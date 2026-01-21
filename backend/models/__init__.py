#!/usr/bin/env python3
"""
模型模块初始化文件
创建全局的动作配置管理器实例，确保所有组件共享同一个实例
"""

from .action_config import ActionConfigManager

# 创建全局的动作配置管理器实例
action_config_manager = ActionConfigManager()