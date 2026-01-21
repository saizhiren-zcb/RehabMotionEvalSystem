#!/usr/bin/env python3
"""
YOLO关键点索引映射
用于查看COCO/YOLO 17关键点的索引顺序.
"""

# YOLO 17关键点的索引映射
yolo_keypoint_names = [
    "nose",  # 0
    "left_eye",  # 1
    "right_eye",  # 2
    "left_ear",  # 3
    "right_ear",  # 4
    "left_shoulder",  # 5
    "right_shoulder",  # 6
    "left_elbow",  # 7
    "right_elbow",  # 8
    "left_wrist",  # 9
    "right_wrist",  # 10
    "left_hip",  # 11
    "right_hip",  # 12
    "left_knee",  # 13
    "right_knee",  # 14
    "left_ankle",  # 15
    "right_ankle",  # 16
]

# 打印关键点索引映射
print("YOLO 17关键点索引映射:")
for i, name in enumerate(yolo_keypoint_names):
    print(f"  {i}: {name}")
