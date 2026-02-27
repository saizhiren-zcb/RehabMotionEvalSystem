#!/usr/bin/env python3
"""
康复动作评估模块
负责使用YOLO模型进行姿态估计和动作评估.
"""

from ultralytics import YOLO


class RehabEvaluator:
    """康复动作评估器类 用于评估康复动作，包括角度计算、动作计数和阶段判断 直接使用YOLO模型进行姿态估计和动作评估.
    """

    def __init__(self):
        """初始化康复动作评估器."""
        # 加载YOLO姿态估计模型，设置合适的置信度阈值
        self.model = YOLO("yolo26n-pose.pt")
        # 设置较低的置信度阈值，确保能检测到关键点
        self.confidence_threshold = 0.1

        # 当前评估的动作
        self.current_action = None

        # 动作计数状态
        self.states = {}

    def set_action(self, action):
        """
        设置当前评估的动作
        :param action: 动作配置字典.
        """
        self.current_action = action
        # 重置状态
        self.reset()

    def set_confidence(self, confidence):
        """
        设置置信度阈值
        :param confidence: 置信度阈值，范围0-1.
        """
        self.confidence_threshold = confidence
        print(f"已更新置信度阈值: {confidence}")

    def set_line_width(self, line_width):
        """
        设置绘制线条宽度
        :param line_width: 线条宽度，整数.
        """
        # YOLO模型的plot方法支持line_width参数
        self.line_width = line_width
        print(f"已更新线条宽度: {line_width}")

    def reset(self):
        """重置动作计数状态."""
        self.states.clear()

    def _calculate_angle(self, keypoints, kpts_indices):
        """
        根据三个关键点计算角度（使用与AIGym相同的atan2方法）
        :param keypoints: 关键点数据，形状为 (17, 3)，每个关键点包含 (x, y, confidence)
        :param kpts_indices: 用于计算角度的三个关键点索引
        :return: 角度值（度）.
        """
        if len(kpts_indices) != 3:
            return 0.0

        try:
            # 确保keypoints是numpy数组
            import numpy as np

            if hasattr(keypoints, "numpy"):
                keypoints_np = keypoints.numpy()
            else:
                keypoints_np = np.array(keypoints)

            # 获取三个关键点的坐标
            idx_a, idx_b, idx_c = kpts_indices

            a = keypoints_np[idx_a]
            b = keypoints_np[idx_b]
            c = keypoints_np[idx_c]

            # 提取x, y坐标
            a_xy = (float(a[0]), float(a[1]))
            b_xy = (float(b[0]), float(b[1]))
            c_xy = (float(c[0]), float(c[1]))

            # 使用atan2计算角度（与AIGym相同的方法）
            import math

            # 计算向量ba和bc
            ba_x = a_xy[0] - b_xy[0]
            ba_y = a_xy[1] - b_xy[1]
            bc_x = c_xy[0] - b_xy[0]
            bc_y = c_xy[1] - b_xy[1]

            # 计算向量ba和向量bc的叉积和点积
            cross_product = ba_x * bc_y - ba_y * bc_x
            dot_product = ba_x * bc_x + ba_y * bc_y

            # 使用atan2计算角度，范围是[-π, π]
            angle_rad = math.atan2(cross_product, dot_product)
            angle_deg = abs(angle_rad * 180.0 / math.pi)

            # 确保角度在0-180度之间
            if angle_deg > 180.0:
                angle_deg = 360.0 - angle_deg

            return angle_deg
        except Exception:
            return 0.0

    def evaluate(self, frame, action):
        """
        评估单帧图像的动作
        :param frame: 输入图像
        :param action: 动作配置字典
        :return: 评估结果字典，包含angle, count, stage, keypoints.
        """
        # 更新当前动作
        if self.current_action is None or self.current_action["id"] != action["id"]:
            self.set_action(action)

        # 使用YOLO模型进行姿态估计，设置置信度阈值
        results = self.model(frame, conf=self.confidence_threshold, verbose=False)[0]

        # 准备返回结果
        keypoints = None
        angle = 0.0
        count = 0
        stage = "-"

        # 检查是否检测到关键点
        if results.keypoints is not None:
            if len(results.keypoints.data) > 0:
                # 获取第一个人的关键点
                raw_keypoints = results.keypoints.data[0]

                # 确保keypoints是numpy数组
                import numpy as np

                if hasattr(raw_keypoints, "numpy"):
                    raw_keypoints_np = raw_keypoints.numpy()
                else:
                    raw_keypoints_np = np.array(raw_keypoints)

                # 获取原始帧尺寸
                original_h, original_w, _ = frame.shape

                # 获取YOLO模型处理后的尺寸（通常是640x640）
                model_h, model_w = results.orig_shape

                # 缩放关键点坐标到原始帧尺寸
                scale_x = original_w / model_w
                scale_y = original_h / model_h

                # 创建新的关键点数组，包含缩放后的坐标
                scaled_keypoints = raw_keypoints_np.copy()
                for i in range(scaled_keypoints.shape[0]):
                    # 缩放x和y坐标
                    scaled_keypoints[i, 0] *= scale_x
                    scaled_keypoints[i, 1] *= scale_y

                # 使用缩放后的关键点计算角度
                angle = self._calculate_angle(scaled_keypoints, action["kpts"])

                # 使用默认track_id 0
                track_id = 0

                # 初始化track_id的状态，添加连续帧计数
                if track_id not in self.states:
                    # 初始阶段判断：使用新的三阶段规则
                    initial_stage = (
                        "down" if angle <= action["down_angle"] else "up" if angle >= action["up_angle"] else "normal"
                    )

                    self.states[track_id] = {
                        "angle": angle,
                        "count": 0,
                        "stage": initial_stage,
                        "last_angle": angle,
                        "angle_direction": "stable",
                        "up_count": 0,  # 连续up状态帧数
                        "down_count": 0,  # 连续down状态帧数
                        "normal_count": 0,  # 连续normal状态帧数
                        "last_transition": None,  # 记录上次阶段转换
                    }

                # 更新状态
                state = self.states[track_id]

                # 获取上次角度，用于判断角度变化方向
                last_angle = state["last_angle"]
                state["last_angle"] = angle

                # 判断角度变化方向
                state["angle_direction"]
                angle_direction = "stable"
                if abs(angle - last_angle) > 1:  # 降低容错到1度，提高灵敏度
                    angle_direction = "decreasing" if angle < last_angle else "increasing"
                state["angle_direction"] = angle_direction

                # 增加连续帧计数，只增加当前状态的计数，其他计数重置
                if angle <= action["down_angle"]:
                    state["down_count"] += 1
                    state["up_count"] = 0
                    state["normal_count"] = 0
                elif angle >= action["up_angle"]:
                    state["up_count"] += 1
                    state["down_count"] = 0
                    state["normal_count"] = 0
                else:
                    state["normal_count"] += 1
                    state["up_count"] = 0
                    state["down_count"] = 0

                # 优化的阶段判断和计数逻辑，增加连续帧验证

                # 新的阶段判断逻辑
                # 低于或等于下角度时判断为down
                # 高于或等于上角度时判断为up
                # 介于下角度和上角度之间判断为normal
                if angle <= action["down_angle"]:
                    new_stage = "down"
                elif angle >= action["up_angle"]:
                    new_stage = "up"
                else:
                    new_stage = "normal"

                # 保存当前阶段用于比较
                current_stage = state["stage"]

                # 处理阶段变化和计数
                if new_stage != current_stage:
                    # 阶段发生变化
                    # 根据阶段转换路径判断是否完成一个动作周期

                    # 计数规则：
                    # 1. 从起点经动作循环后到达起点算一次，中间步骤不算
                    # 2. 例如：down → normal → up → normal → down 算一次
                    # 3. 例如：up → normal → down → normal → up 算一次
                    # 4. 例如：down → normal → down 算一次（小幅度动作）
                    # 5. 例如：up → normal → up 算一次（小幅度动作）

                    # 记录完整的阶段转换路径
                    if not state.get("transition_path"):
                        state["transition_path"] = []

                    # 添加当前转换到路径中
                    state["transition_path"].append(current_stage)

                    # 限制路径长度，只保留最近的5个转换，避免内存占用过大
                    if len(state["transition_path"]) > 5:
                        state["transition_path"] = state["transition_path"][-5:]

                    # 检查是否完成了一个完整的动作周期
                    # 将转换路径转换为字符串，方便比较
                    transition_str = "→".join(state["transition_path"]) + "→" + new_stage

                    # 检查各种完整循环
                    if transition_str.endswith("down→normal→up→normal→down"):
                        # 完整循环：down → normal → up → normal → down
                        state["count"] += 1
                        print(f"动作计数增加: {state['count']}")
                        # 重置转换路径，准备下一个循环
                        state["transition_path"] = ["down"]
                    elif transition_str.endswith("up→normal→down→normal→up"):
                        # 完整循环：up → normal → down → normal → up
                        state["count"] += 1
                        print(f"动作计数增加: {state['count']}")
                        # 重置转换路径，准备下一个循环
                        state["transition_path"] = ["up"]
                    elif transition_str.endswith("down→normal→down"):
                        # 小幅度动作：down → normal → down
                        state["count"] += 1
                        print(f"动作计数增加: {state['count']}")
                        # 重置转换路径，准备下一个循环
                        state["transition_path"] = ["down"]
                    elif transition_str.endswith("up→normal→up"):
                        # 小幅度动作：up → normal → up
                        state["count"] += 1
                        print(f"动作计数增加: {state['count']}")
                        # 重置转换路径，准备下一个循环
                        state["transition_path"] = ["up"]
                    elif transition_str.endswith("normal→down→normal"):
                        # 小幅度动作：normal → down → normal
                        state["count"] += 1
                        print(f"动作计数增加: {state['count']}")
                        # 重置转换路径，准备下一个循环
                        state["transition_path"] = ["normal"]
                    elif transition_str.endswith("normal→up→normal"):
                        # 小幅度动作：normal → up → normal
                        state["count"] += 1
                        print(f"动作计数增加: {state['count']}")
                        # 重置转换路径，准备下一个循环
                        state["transition_path"] = ["normal"]

                    # 更新阶段
                    state["stage"] = new_stage

                # 获取当前状态
                count = state["count"]
                stage = state["stage"]

                # 返回缩放后的关键点
                keypoints = scaled_keypoints

        # 返回结果
        result = {"angle": float(angle), "count": int(count), "stage": stage, "keypoints": keypoints}

        return result
