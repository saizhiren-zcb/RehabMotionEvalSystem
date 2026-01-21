/**
 * 视频保存功能模块
 * 负责录制和保存评估过程的视频
 */

class VideoSaver {
  constructor(videoId, canvasId, saveBtnId) {
    this.videoElement = document.getElementById(videoId);
    this.canvasElement = document.getElementById(canvasId);
    this.saveBtn = document.getElementById(saveBtnId);

    this.isRecording = false;
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.stream = null;

    // 初始化事件监听器
    this._initEventListeners();
  }

  /**
   * 初始化事件监听器
   */
  _initEventListeners() {
    // 保存视频按钮
    this.saveBtn.addEventListener("click", () => {
      if (this.isRecording) {
        this.stopRecording();
      } else {
        this.startRecording();
      }
    });
  }

  /**
   * 开始录制视频
   */
  async startRecording() {
    try {
      // 创建媒体流，包含视频和画布
      this.stream = await this._createMixedStream();

      // 创建MediaRecorder实例
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: "video/webm; codecs=vp9",
      });

      // 媒体录制器事件
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this._saveRecording();
      };

      // 开始录制
      this.mediaRecorder.start();
      this.isRecording = true;

      // 更新按钮状态
      this.saveBtn.textContent = "停止录制";
      this.saveBtn.classList.add("recording");

      console.log("开始录制视频");
    } catch (error) {
      console.error("开始录制视频失败:", error);
      alert("无法开始录制视频，请检查浏览器支持情况");
    }
  }

  /**
   * 停止录制视频
   */
  stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;

      // 停止所有媒体轨道
      this.stream.getTracks().forEach((track) => track.stop());

      // 更新按钮状态
      this.saveBtn.textContent = "保存视频";
      this.saveBtn.classList.remove("recording");

      console.log("停止录制视频");
    }
  }

  /**
   * 创建混合流（视频+画布）
   * @returns {Promise<MediaStream>} - 混合媒体流
   */
  async _createMixedStream() {
    // 创建一个新的canvas用于绘制混合内容
    const mixedCanvas = document.createElement("canvas");
    mixedCanvas.width = this.videoElement.videoWidth;
    mixedCanvas.height = this.videoElement.videoHeight;
    const ctx = mixedCanvas.getContext("2d");

    // 绘制循环：将视频和原始canvas的内容绘制到混合canvas上
    const drawFrame = () => {
      if (this.isRecording) {
        // 绘制视频帧
        ctx.drawImage(this.videoElement, 0, 0, mixedCanvas.width, mixedCanvas.height);

        // 绘制原始canvas的内容（人体骨架）
        ctx.drawImage(this.canvasElement, 0, 0, mixedCanvas.width, mixedCanvas.height);

        // 继续绘制下一帧
        requestAnimationFrame(drawFrame);
      }
    };

    // 开始绘制循环
    drawFrame();

    // 从混合canvas创建流
    const canvasStream = mixedCanvas.captureStream(30);

    return canvasStream;
  }

  /**
   * 保存录制的视频
   */
  _saveRecording() {
    if (this.recordedChunks.length === 0) {
      console.error("没有录制到视频内容");
      return;
    }

    try {
      // 创建Blob对象
      const blob = new Blob(this.recordedChunks, {
        type: "video/webm",
      });

      // 创建下载链接
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      // 生成文件名（包含时间戳）
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      a.download = `rehab-evaluation-${timestamp}.webm`;

      // 触发下载
      document.body.appendChild(a);
      a.click();

      // 清理资源
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);

      // 清空录制的块
      this.recordedChunks = [];

      console.log("视频保存成功");
    } catch (error) {
      console.error("保存视频失败:", error);
      alert("保存视频失败，请重试");
    }
  }

  /**
   * 获取录制状态
   * @returns {boolean} - 是否正在录制
   */
  isRecording() {
    return this.isRecording;
  }
}

// 导出VideoSaver类
window.VideoSaver = VideoSaver;
