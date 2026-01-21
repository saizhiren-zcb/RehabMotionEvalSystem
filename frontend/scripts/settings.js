/**
 * 设置面板模块
 * 负责管理应用的各种设置
 */

class Settings {
  constructor() {
    // 初始化设置面板相关元素
    this.panel = document.getElementById("settingsPanel");
    this.confidenceSlider = document.getElementById("confidenceSlider");
    this.confidenceValue = document.getElementById("confidenceValue");
    this.imageSizeSelect = document.getElementById("imageSizeSelect");
    this.lineWidthSlider = document.getElementById("lineWidthSlider");
    this.lineWidthValue = document.getElementById("lineWidthValue");
    this.saveBtn = document.getElementById("saveSettingsBtn");
    this.settingsBtn = document.getElementById("settingsBtn");
    this.closeBtn = this.panel.querySelector(".close");

    this.settings = {
      confidence: 0.5,
      imageSize: 640,
      lineWidth: 3,
    };

    this.callbacks = {
      onSettingsChange: [],
    };

    // 初始化事件监听器
    this._initEventListeners();

    // 从localStorage加载设置
    this._loadSettings();
  }

  /**
   * 初始化事件监听器
   */
  _initEventListeners() {
    // 设置按钮 - 打开面板
    this.settingsBtn.addEventListener("click", () => {
      this.show();
    });

    // 关闭按钮 - 关闭面板
    this.closeBtn.addEventListener("click", () => {
      this.close();
    });

    // 置信度滑块
    this.confidenceSlider.addEventListener("input", (event) => {
      this.settings.confidence = parseFloat(event.target.value);
      this.confidenceValue.textContent = this.settings.confidence;
    });

    // 图像大小选择
    this.imageSizeSelect.addEventListener("change", (event) => {
      this.settings.imageSize = parseInt(event.target.value);
    });

    // 线条粗细滑块
    this.lineWidthSlider.addEventListener("input", (event) => {
      this.settings.lineWidth = parseInt(event.target.value);
      this.lineWidthValue.textContent = this.settings.lineWidth;
    });

    // 保存按钮
    this.saveBtn.addEventListener("click", () => {
      this.saveSettings();
    });

    // 点击模态窗口外部关闭
    window.addEventListener("click", (event) => {
      if (event.target === this.panel) {
        this.close();
      }
    });
  }

  /**
   * 显示设置面板
   */
  show() {
    this.panel.style.display = "block";
  }

  /**
   * 关闭设置面板
   */
  close() {
    this.panel.style.display = "none";
  }

  /**
   * 保存设置
   */
  saveSettings() {
    // 保存到localStorage
    localStorage.setItem("rehabSettings", JSON.stringify(this.settings));

    // 通知回调函数
    this._notifyCallbacks("onSettingsChange", this.settings);

    // 关闭面板
    this.close();
  }

  /**
   * 从localStorage加载设置
   */
  _loadSettings() {
    const savedSettings = localStorage.getItem("rehabSettings");
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        this.settings = { ...this.settings, ...parsedSettings };

        // 更新UI
        this.confidenceSlider.value = this.settings.confidence;
        this.confidenceValue.textContent = this.settings.confidence;
        this.imageSizeSelect.value = this.settings.imageSize;
        this.lineWidthSlider.value = this.settings.lineWidth;
        this.lineWidthValue.textContent = this.settings.lineWidth;
      } catch (error) {
        console.error("加载设置出错:", error);
      }
    }
  }

  /**
   * 获取当前设置
   * @returns {Object} - 当前设置对象
   */
  getSettings() {
    return { ...this.settings };
  }

  /**
   * 设置置信度阈值
   * @param {number} value - 置信度值（0-1）
   */
  setConfidence(value) {
    this.settings.confidence = value;
    this.confidenceSlider.value = value;
    this.confidenceValue.textContent = value;
  }

  /**
   * 设置图像大小
   * @param {number} value - 图像大小
   */
  setImageSize(value) {
    this.settings.imageSize = value;
    this.imageSizeSelect.value = value;
  }

  /**
   * 设置线条粗细
   * @param {number} value - 线条粗细
   */
  setLineWidth(value) {
    this.settings.lineWidth = value;
    this.lineWidthSlider.value = value;
    this.lineWidthValue.textContent = value;
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
}

// 导出Settings类
window.Settings = Settings;
