/**
 * 可视化展示模块
 * 负责将后端返回的姿态估计结果绘制到视频画面上
 */

class PoseVisualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.lineWidth = 3; // 线条粗细
        this.jointRadius = 5; // 关节点半径
        this.keypoints = null; // 当前关键点数据
        this.actionData = {
            angle: 0,
            count: 0,
            stage: '-',
            actionName: '未选择'
        };
        
        // 原始视频尺寸（用于坐标缩放）
        this.originalWidth = 640;
        this.originalHeight = 480;
        
        // 关键点连接顺序（YOLO 17关键点）
        // 正确的COCO/YOLO 17关键点连接顺序
        this.skeleton = [
            [15, 13], [13, 11], [16, 14], [14, 12],  // 腿部
            [11, 12], [5, 11], [6, 12], [5, 6],      // 躯干
            [5, 7], [7, 9], [6, 8], [8, 10],         // 手臂
            [0, 5], [0, 6], [0, 1], [1, 2], [2, 3], [3, 4], [1, 7], [1, 8]  // 头部和肩部
        ];
    }
    
    /**
     * 设置画布尺寸
     * @param {number} width - 宽度
     * @param {number} height - 高度
     */
    setSize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        // 保存原始视频尺寸，用于坐标缩放
        this.originalWidth = width;
        this.originalHeight = height;
    }
    
    /**
     * 获取当前视频和canvas的实际显示尺寸
     * @returns {Object} 包含width和height的对象
     */
    _getActualDisplaySize() {
        // 获取canvas元素的实际显示尺寸
        const rect = this.canvas.getBoundingClientRect();
        return {
            width: rect.width,
            height: rect.height
        };
    }
    
    /**
     * 缩放关键点坐标，使其匹配canvas的实际显示尺寸
     * @param {Array} keypoint - 关键点坐标 [x, y, confidence]
     * @returns {Array} 缩放后的关键点坐标 [x, y, confidence]
     */
    _scaleKeypoint(keypoint) {
        const displaySize = this._getActualDisplaySize();
        const scaleX = displaySize.width / this.originalWidth;
        const scaleY = displaySize.height / this.originalHeight;
        
        return [
            keypoint[0] * scaleX,
            keypoint[1] * scaleY,
            keypoint[2]
        ];
    }
    
    /**
     * 设置线条粗细
     * @param {number} width - 线条粗细
     */
    setLineWidth(width) {
        this.lineWidth = width;
    }
    
    /**
     * 更新关键点数据
     * @param {Array} keypoints - 关键点数据
     */
    updateKeypoints(keypoints) {
        this.keypoints = keypoints;
    }
    
    /**
     * 更新动作数据
     * @param {Object} actionData - 动作数据，包含angle, count, stage, actionName
     */
    updateActionData(actionData) {
        this.actionData = { ...this.actionData, ...actionData };
    }
    
    /**
     * 绘制单帧画面
     */
    draw() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制人体骨架
        if (this.keypoints && this.keypoints.length > 0) {
            this._drawFullSkeleton();
            this._drawAllKeypoints();
        }
        
        // 绘制动作信息
        this._drawActionInfo();
    }
    
    /**
     * 绘制人体骨架
     */
    _drawSkeleton() {
        this.ctx.strokeStyle = '#4CAF50';
        this.ctx.lineWidth = this.lineWidth;
        
        this.skeleton.forEach(connection => {
            const pt1 = this.keypoints[connection[0] - 1]; // COCO关键点索引从1开始
            const pt2 = this.keypoints[connection[1] - 1];
            
            // 只有当两个点都有足够置信度时才绘制连接
            if (pt1 && pt2 && pt1[2] > 0.5 && pt2[2] > 0.5) {
                this.ctx.beginPath();
                this.ctx.moveTo(pt1[0], pt1[1]);
                this.ctx.lineTo(pt2[0], pt2[1]);
                this.ctx.stroke();
            }
        });
    }
    
    /**
     * 绘制关键点
     */
    _drawKeypoints() {
        this.ctx.fillStyle = '#FF5722';
        
        this.keypoints.forEach((keypoint, index) => {
            if (keypoint && keypoint[2] > 0.5) { // 只有置信度足够时才绘制
                this.ctx.beginPath();
                this.ctx.arc(keypoint[0], keypoint[1], this.jointRadius, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
    }
    
    /**
     * 绘制动作信息
     */
    _drawActionInfo() {
        // 设置文本样式
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 2;
        
        // 绘制背景
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, 10, 300, 150);
        
        // 绘制当前动作
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 18px Arial';
        this.ctx.fillText(`动作: ${this.actionData.actionName}`, 20, 40);
        
        // 绘制动作次数
        this.ctx.fillStyle = '#4CAF50';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.fillText(`次数: ${this.actionData.count}`, 20, 80);
        
        // 绘制当前阶段
        let stageColor = '#FFC107'; // 默认颜色
        if (this.actionData.stage === 'up') {
            stageColor = '#4CAF50';
        } else if (this.actionData.stage === 'down') {
            stageColor = '#2196F3';
        }
        
        this.ctx.fillStyle = stageColor;
        this.ctx.font = 'bold 20px Arial';
        this.ctx.fillText(`阶段: ${this.actionData.stage.toUpperCase()}`, 20, 115);
        
        // 绘制角度
        this.ctx.fillStyle = '#FF5722';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.fillText(`角度: ${this.actionData.angle.toFixed(1)}°`, 20, 150);
    }
    
    /**
     * 绘制姿态骨架
     * @param {Array} keypoints - 关键点数据
     */
    drawPose(keypoints) {
        if (keypoints && keypoints.length > 0) {
            this.updateKeypoints(keypoints);
            
            // 清空画布
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            // 绘制完整人体骨架
            this._drawFullSkeleton();
            
            // 绘制所有关键点
            this._drawAllKeypoints();
        }
    }
    
    /**
     * 绘制完整人体骨架
     */
    _drawFullSkeleton() {
        this.ctx.strokeStyle = '#4CAF50';
        this.ctx.lineWidth = this.lineWidth;
        
        // 绘制完整的骨架连接
        this.skeleton.forEach(connection => {
            const pt1 = this.keypoints[connection[0] - 1]; // COCO关键点索引从1开始
            const pt2 = this.keypoints[connection[1] - 1];
            
            // 只有当两个点都有足够置信度时才绘制连接
            if (pt1 && pt2 && pt1[2] > 0.5 && pt2[2] > 0.5) {
                // 缩放关键点坐标，使其匹配canvas的实际显示尺寸
                const scaledPt1 = this._scaleKeypoint(pt1);
                const scaledPt2 = this._scaleKeypoint(pt2);
                
                this.ctx.beginPath();
                this.ctx.moveTo(scaledPt1[0], scaledPt1[1]);
                this.ctx.lineTo(scaledPt2[0], scaledPt2[1]);
                this.ctx.stroke();
            }
        });
    }
    
    /**
     * 绘制所有关键点
     */
    _drawAllKeypoints() {
        this.ctx.fillStyle = '#FF5722';
        
        // 绘制所有关键点
        this.keypoints.forEach((keypoint, index) => {
            if (keypoint && keypoint[2] > 0.5) { // 只有置信度足够时才绘制
                // 缩放关键点坐标，使其匹配canvas的实际显示尺寸
                const scaledKeypoint = this._scaleKeypoint(keypoint);
                
                this.ctx.beginPath();
                this.ctx.arc(scaledKeypoint[0], scaledKeypoint[1], this.jointRadius, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
    }
    
    /**
     * 处理姿态估计结果
     * @param {Object} result - 姿态估计结果
     */
    handlePoseResult(result) {
        if (result.keypoints && result.keypoints.length > 0) {
            this.updateKeypoints(result.keypoints);
        }
        
        this.updateActionData({
            angle: result.angle || 0,
            count: result.count || 0,
            stage: result.stage || '-',
            actionName: result.action_name || this.actionData.actionName
        });
        
        this.draw();
    }
    
    /**
     * 清除画布
     */
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    /**
     * 重置可视化状态
     */
    reset() {
        this.keypoints = null;
        this.actionData = {
            angle: 0,
            count: 0,
            stage: '-',
            actionName: '未选择'
        };
        this.clear();
    }
}

// 导出PoseVisualizer类
window.PoseVisualizer = PoseVisualizer;
