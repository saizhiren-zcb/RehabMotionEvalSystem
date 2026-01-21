#!/usr/bin/env python3
"""
相机处理模块
负责打开相机、捕获视频帧、进行姿态识别和骨架绘制.
"""

import cv2
from models.action_config import ActionConfigManager
from models.rehab_evaluator import RehabEvaluator


class CameraHandler:
    def __init__(self, camera_id=0, action_manager=None):
        self.camera_id = camera_id
        self.cap = None
        self.is_running = False
        self.evaluator = RehabEvaluator()
        # 接受外部传入的ActionConfigManager实例，或创建默认实例
        self.action_manager = action_manager if action_manager else ActionConfigManager()
        self.current_action = None

    def open_camera(self):
        """打开相机."""
        try:
            self.cap = cv2.VideoCapture(self.camera_id)
            if not self.cap.isOpened():
                raise Exception(f"无法打开相机 {self.camera_id}")
            self.is_running = True
            print(f"相机 {self.camera_id} 已打开")
            return True
        except Exception as e:
            print(f"打开相机失败: {e}")
            return False

    def close_camera(self):
        """关闭相机."""
        if self.cap:
            self.cap.release()
            self.cap = None
        self.is_running = False
        print(f"相机 {self.camera_id} 已关闭")

    def set_action(self, action_id):
        """设置当前动作."""
        self.current_action = self.action_manager.get_action(action_id)
        if self.current_action:
            self.evaluator.set_action(self.current_action)
            print(f"已设置当前动作: {self.current_action['name']}")
        else:
            print(f"动作 ID {action_id} 不存在")

    def update_settings(self, settings):
        """更新设置."""
        print(f"更新设置: {settings}")
        # 将设置应用到评估器
        if "confidence" in settings:
            self.evaluator.set_confidence(float(settings["confidence"]))
        if "lineWidth" in settings:
            self.evaluator.set_line_width(int(settings["lineWidth"]))
        # 图像大小设置暂时不支持动态更新
        print("设置已更新")

    def capture_frame(self):
        """捕获一帧图像."""
        if not self.is_running or not self.cap:
            return None

        ret, frame = self.cap.read()
        if not ret:
            print("捕获视频帧失败")
            return None

        return frame

    def process_frame(self, frame):
        """处理图像，进行姿态识别和骨架绘制."""
        evaluation_result = {"angle": 0.0, "count": 0, "stage": "-"}

        if not self.current_action:
            return frame, evaluation_result

        # 使用完整的evaluate方法进行评估
        evaluation_result = self.evaluator.evaluate(frame, self.current_action)

        # 使用YOLO模型进行姿态估计，用于绘制骨架
        results = self.evaluator.model(frame, conf=0.1, verbose=False)[0]

        # 绘制姿态骨架，使用设置的线条宽度
        processed_frame = results.plot(
            line_width=self.evaluator.line_width if hasattr(self.evaluator, "line_width") else 3
        )

        # 在图像上显示动作信息
        if evaluation_result["angle"] > 0:
            # 在图像上显示角度
            cv2.putText(
                processed_frame,
                f"角度: {evaluation_result['angle']:.1f}°",
                (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX,
                1,
                (0, 255, 0),
                2,
            )
            # 在图像上显示次数
            cv2.putText(
                processed_frame,
                f"次数: {evaluation_result['count']}",
                (10, 70),
                cv2.FONT_HERSHEY_SIMPLEX,
                1,
                (0, 255, 0),
                2,
            )
            # 在图像上显示阶段
            cv2.putText(
                processed_frame,
                f"阶段: {evaluation_result['stage']}",
                (10, 110),
                cv2.FONT_HERSHEY_SIMPLEX,
                1,
                (0, 255, 0),
                2,
            )

        return processed_frame, evaluation_result

    def get_processed_frame(self):
        """获取处理后的图像和评估结果."""
        frame = self.capture_frame()
        if frame is None:
            return None, {"angle": 0.0, "count": 0, "stage": "-"}

        return self.process_frame(frame)

    def get_jpeg_frame(self):
        """获取JPEG格式的处理后图像和评估结果."""
        processed_frame, evaluation_result = self.get_processed_frame()
        if processed_frame is None:
            return None, {"angle": 0.0, "count": 0, "stage": "-"}

        # 转换为JPEG格式
        _, buffer = cv2.imencode(".jpg", processed_frame)
        return buffer.tobytes(), evaluation_result
