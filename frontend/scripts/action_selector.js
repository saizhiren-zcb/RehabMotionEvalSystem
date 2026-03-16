/**
 * 动作选择面板模块
 * 负责获取和管理动作列表，允许用户选择要评估的动作
 */

class ActionSelector {
  constructor(selectId, currentActionId, countId, stageId, angleId) {
    this.selectElement = document.getElementById(selectId);
    this.currentActionElement = document.getElementById(currentActionId);
    this.countElement = document.getElementById(countId);
    this.stageElement = document.getElementById(stageId);
    this.angleElement = document.getElementById(angleId);
    this.actions = [];
    this.selectedAction = null;
    this.callbacks = {
      onActionChange: [],
    };
  }

  /**
   * 从后端获取动作列表
   * @param {WebSocketClient} wsClient - WebSocket客户端实例
   */
  async fetchActions(wsClient) {
    return new Promise((resolve, reject) => {
      // 设置临时回调来处理动作列表响应
      const handleMessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === "actions_list") {
            this.actions = message.actions;
            this._populateActionSelect();
            wsClient.removeEventListener("message", handleMessage);
            resolve(this.actions);
          }
        } catch (error) {
          console.error("解析动作列表消息出错:", error);
        }
      };

      // 添加临时事件监听器
      wsClient.on("onMessage", handleMessage);

      // 请求动作列表
      wsClient.requestActions();

      // 设置超时
      setTimeout(() => {
        wsClient.removeEventListener("message", handleMessage);
        reject(new Error("获取动作列表超时"));
      }, 5000);
    });
  }

  /**
   * 使用REST API获取动作列表
   * @param {string} apiUrl - API URL
   */
  async fetchActionsRest(apiUrl) {
    try {
      const response = await fetch(`${apiUrl}/actions`);
      if (response.ok) {
        const data = await response.json();
        this.actions = data.actions;
        this._populateActionSelect();
        return this.actions;
      } else {
        console.error("获取动作列表失败:", response.statusText);
        return [];
      }
    } catch (error) {
      console.error("获取动作列表出错:", error);
      return [];
    }
  }

  /**
   * 填充动作选择下拉框
   */
  _populateActionSelect() {
    // 清空现有选项
    this.selectElement.innerHTML = "";

    // 添加默认选项
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "请选择动作";
    this.selectElement.appendChild(defaultOption);

    // 添加动作选项
    this.actions.forEach((action) => {
      const option = document.createElement("option");
      option.value = action.id;
      option.textContent = action.name;
      this.selectElement.appendChild(option);
    });

    // 添加事件监听器
    this.selectElement.addEventListener("change", (event) => {
      this._handleActionChange(event.target.value);
    });
  }

  /**
   * 处理动作选择变化
   * @param {string} actionId - 选择的动作ID
   */
  _handleActionChange(actionId) {
    if (actionId) {
      this.selectedAction = this.actions.find((action) => action.id === actionId);
      if (this.selectedAction) {
        this.currentActionElement.textContent = this.selectedAction.name;
        this._notifyCallbacks("onActionChange", this.selectedAction);
      }
    } else {
      this.selectedAction = null;
      this.currentActionElement.textContent = "未选择";
      this._notifyCallbacks("onActionChange", null);
    }

    // 重置统计数据
    this.resetStats();
  }

  /**
   * 更新动作统计数据
   * @param {Object} stats - 统计数据，包含count, stage, angle
   */
  updateStats(stats) {
    if (stats.count !== undefined) {
      this.countElement.textContent = stats.count;
    }

    if (stats.stage !== undefined) {
      this.stageElement.textContent = stats.stage.toUpperCase();
      // 根据阶段更新颜色
      if (stats.stage === "up") {
        this.stageElement.style.color = "#4CAF50";
      } else if (stats.stage === "down") {
        this.stageElement.style.color = "#2196F3";
      } else {
        this.stageElement.style.color = "#FFC107";
      }
    }

    if (stats.angle !== undefined) {
      this.angleElement.textContent = `${stats.angle.toFixed(1)}°`;
    }
  }

  /**
   * 重置统计数据
   */
  resetStats() {
    this.countElement.textContent = "0";
    this.stageElement.textContent = "-";
    this.stageElement.style.color = "#2196F3";
    this.angleElement.textContent = "0.0°";
  }

  /**
   * 获取当前选择的动作
   * @returns {Object|null} - 当前选择的动作，或null
   */
  getSelectedAction() {
    return this.selectedAction;
  }

  /**
   * 注册回调函数
   * @param {string} eventName - 事件名称
   * @param {Function} callback - 回调函数
   */
  on(eventName, callback) {
    if (this.callbacks[eventName]) {
      this.callbacks[eventName].push(callback);
    }
  }

  /**
   * 通知所有回调函数
   * @param {string} eventName - 事件名称
   * @param {*} data - 事件数据
   */
  _notifyCallbacks(eventName, data) {
    if (this.callbacks[eventName]) {
      this.callbacks[eventName].forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`执行${eventName}回调时出错:`, error);
        }
      });
    }
  }

  /**
   * 更新动作列表
   * @param {Array} actions - 新的动作列表
   */
  updateActions(actions) {
    console.log("更新动作列表:", actions);
    this.actions = actions;

    // 保存当前选中动作的ID
    const currentActionId = this.selectedAction ? this.selectedAction.id : null;

    // 更新动作选择下拉框
    this._populateActionSelect();

    // 如果当前有选中的动作，用新的动作对象替换它
    if (currentActionId) {
      const updatedAction = this.actions.find((action) => action.id === currentActionId);
      if (updatedAction) {
        this.selectedAction = updatedAction;
        // 更新当前动作显示
        this.currentActionElement.textContent = this.selectedAction.name;
        // 通知动作变化，确保WebSocket发送最新的动作配置
        this._notifyCallbacks("onActionChange", this.selectedAction);
      } else {
        // 如果当前选中的动作已被删除，重置选中状态
        this.selectedAction = null;
        this.currentActionElement.textContent = "未选择";
        this._notifyCallbacks("onActionChange", null);
        // 重置选择下拉框
        this.selectElement.value = "";
      }
    }
  }

  /**
   * 移除事件监听器（兼容方法）
   * @param {string} eventName - 事件名称
   * @param {Function} callback - 要移除的回调函数
   */
  removeEventListener(eventName, callback) {
    console.warn("removeEventListener方法在ActionSelector中未实现");
  }
}

// 导出ActionSelector类
window.ActionSelector = ActionSelector;
