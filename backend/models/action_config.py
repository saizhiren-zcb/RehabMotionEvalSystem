#!/usr/bin/env python3
"""
动作配置管理模块
负责存储和管理动作配置，包括内置动作和用户自定义动作
"""

import json
import os
import uuid

class ActionConfigManager:
    """
    动作配置管理器类
    用于管理康复动作配置，包括内置动作和用户自定义动作
    """
    
    def __init__(self):
        """
        初始化动作配置管理器
        """
        self.config_file = os.path.join(os.path.dirname(__file__), "../data/action_configs.json")
        self.actions = self._load_actions()
        
    def _load_actions(self):
        """
        从文件加载动作配置
        如果文件不存在，创建默认配置
        :return: 动作配置字典
        """
        # 默认动作配置
        default_actions = [
            {
                "id": "arm_lift",
                "name": "手臂上举",
                "kpts": [6, 8, 10],  # 肩部、肘部、手腕
                "up_angle": 160.0,
                "down_angle": 90.0,
                "is_default": True
            },
            {
                "id": "bicep_curl",
                "name": "二头肌弯举",
                "kpts": [6, 8, 10],  # 肩部、肘部、手腕
                "up_angle": 160.0,
                "down_angle": 60.0,
                "is_default": True
            },
            {
                "id": "shoulder_press",
                "name": "肩部推举",
                "kpts": [5, 6, 8],  # 左肩部、右肩部、右肘部
                "up_angle": 160.0,
                "down_angle": 90.0,
                "is_default": True
            },
            {
                "id": "squat",
                "name": "深蹲",
                "kpts": [11, 13, 15],  # 左髋部、左膝盖、左脚踝
                "up_angle": 170.0,
                "down_angle": 90.0,
                "is_default": True
            },
            {
                "id": "leg_lift",
                "name": "腿部上举",
                "kpts": [11, 13, 15],  # 左髋部、左膝盖、左脚踝
                "up_angle": 170.0,
                "down_angle": 90.0,
                "is_default": True
            }
        ]
        
        # 如果配置文件存在，加载配置
        if os.path.exists(self.config_file):
            try:
                with open(self.config_file, "r", encoding="utf-8") as f:
                    loaded_actions = json.load(f)
                
                # 合并默认动作和加载的动作
                # 默认动作优先级低于已保存的动作
                loaded_ids = {action["id"] for action in loaded_actions}
                for default_action in default_actions:
                    if default_action["id"] not in loaded_ids:
                        loaded_actions.append(default_action)
                
                return loaded_actions
            except Exception as e:
                print(f"加载动作配置出错: {e}")
                return default_actions
        else:
            # 配置文件不存在，返回默认动作并保存
            self._save_actions(default_actions)
            return default_actions
    
    def _save_actions(self, actions):
        """
        保存动作配置到文件
        :param actions: 动作配置列表
        """
        try:
            # 确保数据目录存在
            os.makedirs(os.path.dirname(self.config_file), exist_ok=True)
            
            with open(self.config_file, "w", encoding="utf-8") as f:
                json.dump(actions, f, ensure_ascii=False, indent=2)
            return True
        except Exception as e:
            print(f"保存动作配置出错: {e}")
            return False
    
    def get_all_actions(self):
        """
        获取所有动作配置
        :return: 动作配置列表
        """
        return self.actions
    
    def get_action(self, action_id):
        """
        根据ID获取动作配置
        :param action_id: 动作ID
        :return: 动作配置字典，不存在返回None
        """
        for action in self.actions:
            if action["id"] == action_id:
                return action
        return None
    
    def add_or_update_action(self, action_data):
        """
        添加或更新动作配置
        :param action_data: 动作配置数据
        :return: 保存后的动作配置，失败返回None
        """
        # 验证必要字段
        required_fields = ["name", "kpts", "up_angle", "down_angle"]
        for field in required_fields:
            if field not in action_data:
                print(f"动作配置缺少必要字段: {field}")
                return None
        
        # 如果没有ID，生成一个新ID
        if "id" not in action_data or not action_data["id"]:
            action_data["id"] = str(uuid.uuid4())
        
        # 添加或更新动作
        updated = False
        for i, action in enumerate(self.actions):
            if action["id"] == action_data["id"]:
                # 更新现有动作
                # 保留原始的is_default值，除非请求中明确指定了新的值
                if "is_default" not in action_data:
                    action_data["is_default"] = action.get("is_default", False)
                self.actions[i] = action_data
                updated = True
                break
        
        if not updated:
            # 添加新动作
            self.actions.append(action_data)
        
        # 保存到文件
        if self._save_actions(self.actions):
            return action_data
        else:
            return None
    
    def delete_action(self, action_id):
        """
        删除动作配置
        :param action_id: 动作ID
        :return: 删除成功返回True，失败返回False
        """
        # 不能删除默认动作
        for action in self.actions:
            if action["id"] == action_id:
                if action.get("is_default", False):
                    print("不能删除默认动作")
                    return False
                break
        
        # 删除动作
        new_actions = [action for action in self.actions if action["id"] != action_id]
        if len(new_actions) < len(self.actions):
            self.actions = new_actions
            return self._save_actions(self.actions)
        else:
            print(f"动作不存在: {action_id}")
            return False
