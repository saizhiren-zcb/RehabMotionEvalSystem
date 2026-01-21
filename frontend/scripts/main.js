/**
 * 主逻辑模块
 * 负责初始化和协调各个模块
 */

class RehabEvaluationApp {
    constructor() {
        this.wsClient = null;
        this.actionSelector = null;
        this.visualizer = null;
        this.settings = null;
        this.isEvaluating = false;
        
        // 初始化应用
        this.init();
    }
    
    /**
     * 初始化应用
     */
    async init() {
        console.log('开始初始化应用...');
        
        try {
            // 1. 初始化核心模块
            console.log('1. 初始化设置模块...');
            this.initSettings();
            console.log('设置模块初始化成功');
            
            console.log('2. 初始化动作选择器...');
            this.initActionSelector();
            console.log('动作选择器初始化成功');
            
            console.log('3. 摄像头模块已移除，由后端处理...');
            
            console.log('4. 初始化可视化模块...');
            this.initVisualizer();
            console.log('可视化模块初始化成功');
            
            console.log('5. 初始化WebSocket模块...');
            this.initWebSocket();
            console.log('WebSocket模块初始化成功');
            
            console.log('6. 绑定事件监听器...');
            this.bindEventListeners();
            console.log('事件监听器绑定成功');
            
            // 7. 初始化视频显示
            console.log('7. 初始化视频显示...');
            this.initVideoDisplay();
            console.log('视频显示初始化成功');
            
            // 8. 连接WebSocket
            console.log('8. 连接WebSocket...');
            await this.wsClient.connect();
            console.log('WebSocket连接成功');
            
            console.log('康复评估应用核心功能初始化完成！');
            
            } catch (error) {
            console.error('应用初始化失败:', error);
            console.error('错误类型:', typeof error);
            console.error('错误堆栈:', error.stack || '无堆栈信息');
            console.error('错误详细信息:', JSON.stringify(error, null, 2));
            
            // 尝试继续运行核心功能
            alert(`应用初始化过程中发生错误，但核心功能可能仍可用：\n${error.message || '未知错误'}\n\n请检查浏览器控制台获取完整错误信息。`);
        } finally {
            // 9. 初始化非核心模块（可选），确保总是被调用
            this.initOptionalModules();
        }
    }
    
    /**
     * 初始化可选模块
     */
    initOptionalModules() {
        try {
            console.log('9.1 初始化自定义动作管理模块...');
            this.initCustomActions();
            console.log('自定义动作管理模块初始化成功');
            
            console.log('9.2 初始化视频保存模块...');
            this.initVideoSaver();
            console.log('视频保存模块初始化成功');
            
            console.log('所有可选模块初始化完成！');
        } catch (error) {
            console.warn('可选模块初始化失败，但不影响核心功能:', error);
        }
    }
    
    /**
     * 初始化设置模块
     */
    initSettings() {
        this.settings = new Settings();
        
        // 监听设置变化事件
        this.settings.on('onSettingsChange', (newSettings) => {
            console.log('设置已更改:', newSettings);
            // 将设置发送到后端
            this.sendSettingsToBackend(newSettings);
        });
    }
    
    /**
     * 将设置发送到后端
     * @param {Object} settings - 设置对象
     */
    sendSettingsToBackend(settings) {
        if (this.wsClient && this.wsClient.isConnected()) {
            this.wsClient.sendSettings(settings);
            console.log('设置已发送到后端:', settings);
        } else {
            console.warn('WebSocket未连接，无法发送设置');
        }
    }
    
    /**
     * 初始化动作选择器
     */
    initActionSelector() {
        this.actionSelector = new ActionSelector(
            'actionSelect',
            'currentAction',
            'actionCount',
            'actionStage',
            'actionAngle'
        );
        
        // 监听动作变化事件
        this.actionSelector.on('onActionChange', (action) => {
            console.log('动作选择变化:', action ? action.name : '无');
            // 如果WebSocket已连接且有选择的动作，发送动作选择到后端
            if (this.wsClient && this.wsClient.isConnected() && action) {
                this.wsClient.sendActionSelect(action.id);
                console.log('动作选择已发送到后端:', action.id);
            }
        });
    }
    
    /**
     * 初始化视频显示
     */
    initVideoDisplay() {
        // 隐藏原始video元素，使用canvas显示后端推送的处理后图像
        const videoElement = document.getElementById('video');
        videoElement.style.display = 'none';
        
        // 设置canvas为显示视频的主要元素
        const canvasElement = document.getElementById('canvas');
        canvasElement.style.display = 'block';
        canvasElement.style.width = '100%';
        canvasElement.style.height = 'auto';
    }
    
    /**
     * 初始化可视化模块
     */
    initVisualizer() {
        this.visualizer = new PoseVisualizer('canvas');
    }
    
    /**
     * 初始化WebSocket客户端
     */
    initWebSocket() {
        this.wsClient = new WebSocketClient('ws://localhost:5000/ws');
        
        // 监听WebSocket连接事件
        this.wsClient.on('onOpen', () => {
            console.log('WebSocket连接已建立');
            // 获取动作列表
            this.fetchActions();
        });
        
        // 监听WebSocket消息事件
        this.wsClient.on('onMessage', (event) => {
            this.handleWebSocketMessage(event);
        });
        
        // 监听WebSocket关闭事件
        this.wsClient.on('onClose', () => {
            console.log('WebSocket连接已关闭');
        });
        
        // 监听WebSocket错误事件
        this.wsClient.on('onError', (error) => {
            console.error('WebSocket错误:', error);
        });
    }
    
    /**
     * 初始化自定义动作管理模块
     */
    initCustomActions() {
        this.customActionsManager = new CustomActionsManager(
            'customActionsPanel',
            'actionList',
            'actionForm',
            'editActionTitle',
            'actionId',
            'actionName',
            'upAngle',
            'downAngle',
            'keypoints',
            'submitBtn',
            'cancelEditBtn',
            'customActionsBtn'
        );
        
        // 监听自定义动作变化事件
        this.customActionsManager.on('onActionsChange', (actions) => {
            console.log('自定义动作变化:', actions);
            // 更新动作选择器
            this.actionSelector.updateActions(actions);
        });
    }
    
    /**
     * 初始化视频保存模块
     */
    initVideoSaver() {
        this.videoSaver = new VideoSaver('video', 'canvas', 'saveVideoBtn');
    }
    
    /**
     * 绑定事件监听器
     */
    bindEventListeners() {
        // 开始评估按钮
        document.getElementById('startBtn').addEventListener('click', () => {
            this.startEvaluation();
        });
        
        // 停止评估按钮
        document.getElementById('stopBtn').addEventListener('click', () => {
            this.stopEvaluation();
        });
    }
    
    /**
     * 从后端获取动作列表
     */
    async fetchActions() {
        try {
            await this.actionSelector.fetchActions(this.wsClient);
        } catch (error) {
            console.error('获取动作列表失败:', error);
            // 尝试使用REST API获取
            try {
                await this.actionSelector.fetchActionsRest('http://localhost:5000');
            } catch (restError) {
                console.error('使用REST API获取动作列表也失败:', restError);
                alert('无法获取动作列表，请检查后端服务是否正常运行');
            }
        }
    }
    
    /**
     * 处理WebSocket消息
     * @param {MessageEvent} event - WebSocket消息事件
     */
    handleWebSocketMessage(event) {
        try {
            const message = JSON.parse(event.data);
            
            console.log('收到WebSocket消息:', message);
            
            switch (message.type) {
                case 'processed_frame':
                    // 处理后端推送的处理后图像
                    if (this.isEvaluating) {
                        this.handleProcessedFrame(message);
                    }
                    break;
                case 'result':
                    // 兼容后端返回的result类型消息
                    if (this.isEvaluating) {
                        console.log('收到评估结果:', message);
                        // 更新动作统计数据
                        this.actionSelector.updateStats({
                            count: message.count,
                            stage: message.stage,
                            angle: message.angle
                        });
                    }
                    break;
                case 'warning':
                    console.warn('后端警告:', message.message);
                    break;
                case 'error':
                    console.error('后端错误:', message.message);
                    break;
                case 'actions_list':
                    console.log('收到动作列表:', message.actions);
                    // 更新动作选择器
                    this.actionSelector.updateActions(message.actions);
                    // 更新自定义动作管理器
                    if (this.customActionsManager) {
                        this.customActionsManager.setActions(message.actions);
                    }
                    break;
                case 'action_selected':
                    console.log('动作选择成功:', message.action_name);
                    break;
                case 'action_stopped':
                    console.log('动作评估已停止:', message.message);
                    break;
                case 'evaluation_started':
                    console.log('评估已开始:', message.action_name);
                    break;
                default:
                    console.log('未知消息类型:', message.type);
            }
        } catch (error) {
            console.error('解析WebSocket消息出错:', error);
            console.error('原始消息:', event.data);
        }
    }
    
    /**
     * 处理后端推送的处理后图像
     * @param {Object} result - 处理后图像结果
     */
    handleProcessedFrame(result) {
        if (result.data) {
            try {
                // 获取canvas元素
                const canvas = document.getElementById('canvas');
                const ctx = canvas.getContext('2d');
                
                // 创建Image对象并加载数据
                const img = new Image();
                img.onload = () => {
                    // 设置canvas尺寸以匹配图像尺寸
                    canvas.width = img.width;
                    canvas.height = img.height;
                    
                    // 绘制图像到canvas
                    ctx.drawImage(img, 0, 0);
                };
                
                // 设置图像源为base64数据
                img.src = `data:image/jpeg;base64,${result.data}`;
            } catch (error) {
                console.error('处理后端推送的图像出错:', error);
            }
        }
    }
    
    /**
     * 处理姿态估计结果
     * @param {Object} result - 姿态估计结果
     */
    handlePoseResult(result) {
        if (result.keypoints) {
            // 绘制姿态骨架
            this.visualizer.drawPose(result.keypoints);
        }
    }
    
    /**
     * 处理评估结果
     * @param {Object} result - 评估结果
     */
    handleEvaluationResult(result) {
        // 更新动作统计数据
        if (result.stats) {
            this.actionSelector.updateStats(result.stats);
        }
        
        // 如果有姿态数据，绘制骨架
        if (result.pose) {
            this.visualizer.drawPose(result.pose.keypoints);
        }
    }
    
    /**
     * 开始评估
     */
    startEvaluation() {
        // 检查是否选择了动作
        const selectedAction = this.actionSelector.getSelectedAction();
        if (!selectedAction) {
            alert('请先选择要评估的动作');
            return;
        }
        
        // 检查WebSocket连接状态
        if (!this.wsClient.isConnected()) {
            alert('WebSocket连接未建立，请检查后端服务是否正常运行');
            return;
        }
        
        try {
            this.isEvaluating = true;
            
            // 隐藏视频提示
            const videoPrompt = document.getElementById('videoPrompt');
            if (videoPrompt) {
                videoPrompt.style.display = 'none';
            }
            
            // 更新按钮状态
            document.getElementById('startBtn').disabled = true;
            document.getElementById('stopBtn').disabled = false;
            
            console.log('=== 开始评估流程 ===');
            console.log('选择的动作:', selectedAction);
            
            // 发送开始评估请求
            const result = this.wsClient.startEvaluation(selectedAction.id);
            console.log('发送开始评估请求结果:', result);
            
            console.log('开始评估:', selectedAction.name);
        } catch (error) {
            console.error('开始评估失败:', error);
            this.isEvaluating = false;
            alert('开始评估失败，请重试');
        }
    }
    
    /**
     * 停止评估
     */
    stopEvaluation() {
        try {
            this.isEvaluating = false;
            
            // 显示视频提示
            const videoPrompt = document.getElementById('videoPrompt');
            if (videoPrompt) {
                videoPrompt.style.display = 'block';
            }
            
            // 更新按钮状态
            document.getElementById('startBtn').disabled = false;
            document.getElementById('stopBtn').disabled = true;
            
            // 发送停止评估请求
            this.wsClient.stopEvaluation();
            
            // 重置可视化状态
            this.visualizer.reset();
            
            // 重置动作统计数据
            this.actionSelector.resetStats();
            
            console.log('停止评估，已重置状态');
        } catch (error) {
            console.error('停止评估失败:', error);
            alert('停止评估失败，请重试');
        }
    }
    
    /**
     * 开始发送视频帧
     */

}

// 页面加载完成后初始化应用
window.addEventListener('load', () => {
    try {
        // 创建应用实例
        window.rehabApp = new RehabEvaluationApp();
    } catch (error) {
        console.error('创建应用实例失败:', error);
        alert(`创建应用实例失败: ${error.message}\n请检查浏览器控制台获取详细信息`);
    }
});
