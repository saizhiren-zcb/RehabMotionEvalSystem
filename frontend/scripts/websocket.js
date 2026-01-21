/**
 * WebSocket通信模块
 * 负责与后端建立WebSocket连接，发送视频帧和接收识别结果
 */

class WebSocketClient {
  constructor(url) {
    this.url = url;
    this.socket = null;
    this.connected = false;
    this.callbacks = {
      onOpen: [],
      onClose: [],
      onMessage: [],
      onError: [],
    };
  }

  /**
   * 连接到WebSocket服务器
   */
  connect() {
    return new Promise((resolve, reject) => {
      try {
        this.socket = new WebSocket(this.url);

        this.socket.onopen = (event) => {
          this.connected = true;
          console.log("WebSocket连接已建立");
          this._notifyCallbacks("onOpen", event);
          resolve(event);
        };

        this.socket.onclose = (event) => {
          this.connected = false;
          console.log("WebSocket连接已关闭");
          this._notifyCallbacks("onClose", event);
        };

        this.socket.onmessage = (event) => {
          this._notifyCallbacks("onMessage", event);
        };

        this.socket.onerror = (event) => {
          console.error("WebSocket错误:", event);
          this._notifyCallbacks("onError", event);
          reject(event);
        };
      } catch (error) {
        console.error("WebSocket连接失败:", error);
        reject(error);
      }
    });
  }

  /**
   * 断开WebSocket连接
   */
  disconnect() {
    if (this.socket) {
      this.socket.close();
    }
  }

  /**
   * 发送消息到服务器
   * @param {Object} message - 要发送的消息对象
   */
  send(message) {
    if (this.connected && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
      return true;
    } else {
      console.error("WebSocket未连接，无法发送消息");
      return false;
    }
  }

  /**
   * 发送视频帧到服务器
   * @param {string} frameData - base64编码的视频帧数据
   * @param {string} selectedActionId - 当前选择的动作ID
   */
  sendVideoFrame(frameData, selectedActionId) {
    return this.send({
      type: "video",
      data: frameData,
      selected_action_id: selectedActionId,
    });
  }

  /**
   * 发送视频帧（简化版本，使用当前选择的动作）
   * @param {string} frameData - base64编码的视频帧数据
   */
  sendFrame(frameData) {
    return this.send({
      type: "video",
      data: frameData,
    });
  }

  /**
   * 开始动作评估
   * @param {string} actionId - 选择的动作ID
   */
  startEvaluation(actionId) {
    return this.send({
      type: "start_evaluation",
      action_id: actionId,
    });
  }

  /**
   * 停止动作评估
   */
  stopEvaluation() {
    return this.send({
      type: "stop_evaluation",
    });
  }

  /**
   * 发送动作选择消息
   * @param {string} actionId - 选择的动作ID
   */
  sendActionSelect(actionId) {
    return this.send({
      type: "action_select",
      action_id: actionId,
    });
  }

  /**
   * 发送停止动作评估消息
   */
  sendActionStop() {
    return this.send({
      type: "action_stop",
    });
  }

  /**
   * 请求获取所有动作列表
   */
  requestActions() {
    return this.send({
      type: "get_actions",
    });
  }

  /**
   * 发送设置到后端
   * @param {Object} settings - 设置对象
   */
  sendSettings(settings) {
    return this.send({
      type: "settings_change",
      settings: settings,
    });
  }

  /**
   * 注册回调函数
   * @param {string} eventName - 事件名称（onOpen, onClose, onMessage, onError）
   * @param {Function} callback - 回调函数
   */
  on(eventName, callback) {
    if (!this.callbacks[eventName]) {
      this.callbacks[eventName] = [];
    }
    this.callbacks[eventName].push(callback);
  }

  /**
   * 移除回调函数
   * @param {string} eventName - 事件名称
   * @param {Function} callback - 要移除的回调函数
   */
  removeEventListener(eventName, callback) {
    if (this.callbacks[eventName]) {
      this.callbacks[eventName] = this.callbacks[eventName].filter((cb) => cb !== callback);
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
   * 检查WebSocket连接状态
   * @returns {boolean} - 连接状态
   */
  getConnectionStatus() {
    return this.connected;
  }

  /**
   * 检查WebSocket连接状态（简化方法名）
   * @returns {boolean} - 连接状态
   */
  isConnected() {
    return this.socket && this.socket.readyState === WebSocket.OPEN;
  }
}

// 导出WebSocketClient类
window.WebSocketClient = WebSocketClient;
