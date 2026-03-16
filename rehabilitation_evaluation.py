#!/usr/bin/env python3
"""
康复动作评估测试脚本.

此脚本使用 Ultralytics YOLO 的 AIGym 类实现实时康复动作评估，支持多种动作类型和灵活配置。
"""

import argparse
import time

import cv2

from ultralytics.solutions.ai_gym import AIGym

# 康复动作配置字典
EXERCISE_CONFIGS = {
    "arm_lift": {
        "name": "手臂上举",
        "kpts": [6, 8, 10],  # 肩部、肘部、手腕
        "up_angle": 160.0,
        "down_angle": 90.0,
    },
    "bicep_curl": {
        "name": "二头肌弯举",
        "kpts": [6, 8, 10],  # 肩部、肘部、手腕
        "up_angle": 160.0,
        "down_angle": 60.0,
    },
    "shoulder_press": {
        "name": "肩部推举",
        "kpts": [5, 6, 8],  # 左肩部、右肩部、右肘部
        "up_angle": 160.0,
        "down_angle": 90.0,
    },
    "squat": {
        "name": "深蹲",
        "kpts": [11, 13, 15],  # 左髋部、左膝盖、左脚踝
        "up_angle": 170.0,
        "down_angle": 90.0,
    },
    "leg_lift": {
        "name": "腿部上举",
        "kpts": [11, 13, 15],  # 左髋部、左膝盖、左脚踝
        "up_angle": 170.0,
        "down_angle": 90.0,
    },
}


def parse_args():
    """解析命令行参数."""
    parser = argparse.ArgumentParser(description="Ultralytics YOLO 康复动作评估")
    parser.add_argument("--source", type=str, default=0, help="输入源 (摄像头ID或视频文件路径)")
    parser.add_argument("--model", type=str, default="yolo26n-pose.pt", help="姿态估计模型路径")
    parser.add_argument(
        "--exercise", type=str, default="arm_lift", choices=EXERCISE_CONFIGS.keys(), help="康复动作类型"
    )
    parser.add_argument("--conf", type=float, default=0.5, help="置信度阈值")
    parser.add_argument("--show", type=bool, default=True, help="是否显示结果")
    parser.add_argument("--save", type=bool, default=False, help="是否保存结果")
    parser.add_argument("--line_width", type=int, default=3, help="线条粗细")
    return parser.parse_args()


def main():
    """主函数."""
    args = parse_args()

    # 获取所选动作的配置
    exercise_cfg = EXERCISE_CONFIGS[args.exercise]
    print("=== 康复动作评估 ===")
    print(f"动作类型: {exercise_cfg['name']}")
    print(f"模型: {args.model}")
    print(f"输入源: {args.source}")
    print("按 'q' 键退出")

    # 直接在创建 AIGym 实例时传入所有参数，包括自定义动作配置
    gym = AIGym(
        model=args.model,
        source=args.source,
        conf=args.conf,
        show=args.show,
        line_width=args.line_width,
        kpts=exercise_cfg["kpts"],
        up_angle=exercise_cfg["up_angle"],
        down_angle=exercise_cfg["down_angle"],
    )

    # 打开视频捕获
    cap = cv2.VideoCapture(args.source if isinstance(args.source, int) else args.source)
    if not cap.isOpened():
        print(f"无法打开视频源: {args.source}")
        return

    # 获取视频信息
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    # 视频写入器（如果需要保存）
    out = None
    if args.save:
        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        out = cv2.VideoWriter(f"rehabilitation_{args.exercise}.mp4", fourcc, fps, (width, height))

    # 记录开始时间
    start_time = time.time()
    frame_count = 0

    try:
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            frame_count += 1

            # 处理帧
            results = gym.process(frame)

            # 获取处理后的图像
            processed_frame = results.plot_im

            # 计算 FPS
            current_time = time.time()
            elapsed_time = current_time - start_time
            current_fps = frame_count / elapsed_time

            # 在图像上显示信息
            cv2.putText(
                processed_frame, f"FPS: {current_fps:.1f}", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2
            )
            cv2.putText(
                processed_frame, f"动作: {exercise_cfg['name']}", (10, 70), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2
            )

            # 显示结果
            if args.show:
                cv2.imshow("康复动作评估", processed_frame)

                # 按 'q' 键退出
                if cv2.waitKey(1) & 0xFF == ord("q"):
                    break

            # 保存结果
            if args.save and out is not None:
                out.write(processed_frame)

    finally:
        # 释放资源
        cap.release()
        if out is not None:
            out.release()
        cv2.destroyAllWindows()

    print("\n=== 评估结束 ===")
    print(f"总帧数: {frame_count}")
    print(f"总时间: {elapsed_time:.2f} 秒")
    print(f"平均 FPS: {current_fps:.1f}")

    if args.save:
        print(f"结果已保存到: rehabilitation_{args.exercise}.mp4")


if __name__ == "__main__":
    main()
