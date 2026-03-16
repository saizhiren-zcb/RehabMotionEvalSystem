#!/usr/bin/env python3
"""
WebSocket处理模块
负责处理前端的视频流和动作选择，并返回识别结果.
"""

import asyncio
import base64
import json

import cv2
from camera import CameraHandler
from fastapi import WebSocket
from models import action_config_manager


async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket端点处理函数
    :param websocket: WebSocket连接对象.
    """
    await websocket.accept()
    print("客户端已连接")

    # 创建相机处理器实例，传递动作配置管理器
    camera_handler = CameraHandler(action_manager=action_config_manager)
    is_evaluating = False

    try:
        # 打开相机
        if not camera_handler.open_camera():
            await websocket.send_text(json.dumps({"type": "error", "message": "无法打开相机", "status": "error"}))
            return

        # 获取所有动作并返回给前端
        actions = action_config_manager.get_all_actions()
        await websocket.send_text(json.dumps({"type": "actions_list", "actions": actions, "status": "success"}))

        # 启动图像推送任务
        async def push_frames():
            """持续推送处理后的图像."""
            nonlocal is_evaluating
            while True:
                if is_evaluating and camera_handler.current_action:
                    # 捕获并处理一帧图像
                    frame = camera_handler.capture_frame()
                    if frame is not None:
                        # 处理图像，进行姿态识别和骨架绘制
                        processed_frame, evaluation_result = camera_handler.process_frame(frame)
                        # 转换为JPEG格式
                        _, buffer = cv2.imencode(".jpg", processed_frame)
                        frame_data = base64.b64encode(buffer).decode("utf-8")

                        # 推送处理后的图像
                        await websocket.send_text(
                            json.dumps({"type": "processed_frame", "data": frame_data, "status": "success"})
                        )

                        # 推送评估结果
                        await websocket.send_text(
                            json.dumps(
                                {
                                    "type": "result",
                                    "angle": evaluation_result["angle"],
                                    "count": evaluation_result["count"],
                                    "stage": evaluation_result["stage"],
                                    "status": "success",
                                }
                            )
                        )

                # 控制推送频率
                await asyncio.sleep(0.033)  # 约30 FPS

        # 启动推送任务
        asyncio.create_task(push_frames())

        while True:
            # 接收前端消息
            data = await websocket.receive_text()
            message = json.loads(data)

            # 处理不同类型的消息
            if message["type"] == "action_select":
                # 处理动作选择
                action_id = message["action_id"]
                camera_handler.set_action(action_id)
                await websocket.send_text(
                    json.dumps(
                        {
                            "type": "action_selected",
                            "action_name": camera_handler.current_action["name"]
                            if camera_handler.current_action
                            else "",
                            "status": "success",
                        }
                    )
                )

            elif message["type"] == "start_evaluation":
                # 开始评估
                action_id = message["action_id"]
                camera_handler.set_action(action_id)
                is_evaluating = True
                print("开始动作评估")
                await websocket.send_text(
                    json.dumps(
                        {
                            "type": "evaluation_started",
                            "action_name": camera_handler.current_action["name"]
                            if camera_handler.current_action
                            else "",
                            "status": "success",
                        }
                    )
                )

            elif message["type"] == "stop_evaluation":
                # 停止动作评估
                is_evaluating = False
                print("停止动作评估")
                await websocket.send_text(
                    json.dumps({"type": "action_stopped", "message": "动作评估已停止", "status": "success"})
                )

            elif message["type"] == "action_stop":
                # 兼容旧的停止动作评估消息
                is_evaluating = False
                print("停止动作评估")
                await websocket.send_text(
                    json.dumps({"type": "action_stopped", "message": "动作评估已停止", "status": "success"})
                )

            elif message["type"] == "get_actions":
                # 获取所有动作
                actions = action_config_manager.get_all_actions()
                await websocket.send_text(json.dumps({"type": "actions_list", "actions": actions, "status": "success"}))

            elif message["type"] == "settings_change":
                # 更新设置
                settings = message.get("settings", {})
                # 将设置应用到相机处理器
                camera_handler.update_settings(settings)
                await websocket.send_text(
                    json.dumps({"type": "settings_updated", "settings": settings, "status": "success"})
                )

    except Exception as e:
        print(f"WebSocket连接出错: {e}")
    finally:
        print("客户端已断开连接")
        # 关闭相机
        camera_handler.close_camera()
        # 简单的try-except处理，避免重复关闭连接
        try:
            await websocket.close()
        except RuntimeError:
            # 忽略已经关闭的连接
            pass
