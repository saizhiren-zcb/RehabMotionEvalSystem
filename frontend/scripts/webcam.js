/**
 * 摄像头调用模块
 * 负责获取摄像头视频流和捕获视频帧
 */

class Webcam {
  constructor(videoId) {
    this.videoElement = document.getElementById(videoId);
    this.stream = null;
    this.constraints = {
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: "user", // 使用前置摄像头
      },
      audio: false,
    };
  }

  /**
   * 初始化摄像头
   * @returns {Promise<void>} - Promise对象
   */
  async init() {
    try {
      // 获取用户媒体设备权限
      this.stream = await navigator.mediaDevices.getUserMedia(this.constraints);

      // 将视频流赋值给video元素
      this.videoElement.srcObject = this.stream;

      // 等待视频元数据加载完成
      await this.videoElement.play();

      console.log("摄像头初始化成功");
    } catch (error) {
      console.error("摄像头初始化失败:", error);
      throw new Error("无法访问摄像头，请检查设备权限设置");
    }
  }

  /**
   * 捕获当前视频帧
   * @returns {ImageData|null} - 捕获的视频帧数据，或null如果捕获失败
   */
  captureFrame() {
    try {
      // 创建一个临时canvas用于捕获帧
      const canvas = document.createElement("canvas");
      canvas.width = this.videoElement.videoWidth;
      canvas.height = this.videoElement.videoHeight;

      // 获取canvas上下文并绘制当前视频帧
      const ctx = canvas.getContext("2d");
      ctx.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);

      // 将canvas转换为DataURL
      const dataURL = canvas.toDataURL("image/jpeg", 0.8);

      return dataURL;
    } catch (error) {
      console.error("捕获视频帧失败:", error);
      return null;
    }
  }

  /**
   * 获取摄像头视频流的宽度
   * @returns {number} - 视频宽度
   */
  getVideoWidth() {
    return this.videoElement.videoWidth;
  }

  /**
   * 获取摄像头视频流的高度
   * @returns {number} - 视频高度
   */
  getVideoHeight() {
    return this.videoElement.videoHeight;
  }

  /**
   * 切换摄像头（前置/后置）
   * @returns {Promise<void>} - Promise对象
   */
  async toggleCamera() {
    try {
      // 停止当前流
      if (this.stream) {
        this.stream.getTracks().forEach((track) => track.stop());
      }

      // 切换摄像头方向
      this.constraints.video.facingMode = this.constraints.video.facingMode === "user" ? "environment" : "user";

      // 重新初始化摄像头
      await this.init();

      console.log("摄像头已切换");
    } catch (error) {
      console.error("切换摄像头失败:", error);
      throw new Error("无法切换摄像头，请检查设备是否有多个摄像头");
    }
  }

  /**
   * 调整视频分辨率
   * @param {number} width - 目标宽度
   * @param {number} height - 目标高度
   * @returns {Promise<void>} - Promise对象
   */
  async adjustResolution(width, height) {
    try {
      // 停止当前流
      if (this.stream) {
        this.stream.getTracks().forEach((track) => track.stop());
      }

      // 更新约束条件
      this.constraints.video.width = { ideal: width };
      this.constraints.video.height = { ideal: height };

      // 重新初始化摄像头
      await this.init();

      console.log("视频分辨率已调整为:", width, "x", height);
    } catch (error) {
      console.error("调整视频分辨率失败:", error);
      throw new Error("无法调整视频分辨率，请检查设备支持的分辨率");
    }
  }

  /**
   * 停止摄像头
   */
  stop() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
      this.videoElement.srcObject = null;
      console.log("摄像头已停止");
    }
  }
}

// 导出Webcam类
window.Webcam = Webcam;
