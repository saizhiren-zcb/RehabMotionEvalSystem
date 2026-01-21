#!/usr/bin/env python3
"""
FastAPI应用入口
康复评估系统后端服务
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

from websocket import websocket_endpoint
from models import action_config_manager

# 创建FastAPI应用
app = FastAPI(
    title="康复评估系统API",
    description="用于康复动作评估的后端API服务",
    version="1.0.0"
)

# 设置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 允许所有来源，生产环境应限制为特定域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



# 健康检查路由
@app.get("/health")
async def health_check():
    """健康检查接口"""
    return JSONResponse(status_code=200, content={"status": "healthy"})

# WebSocket路由
app.add_api_websocket_route("/ws", websocket_endpoint)

# 动作配置管理路由
@app.get("/actions")
async def get_actions():
    """获取所有动作配置"""
    return JSONResponse(status_code=200, content={"actions": action_config_manager.get_all_actions()})

@app.post("/actions")
async def add_or_update_action(request: Request):
    """添加或更新动作配置"""
    data = await request.json()
    result = action_config_manager.add_or_update_action(data)
    if result:
        return JSONResponse(status_code=200, content={"message": "动作配置保存成功", "action": result})
    else:
        return JSONResponse(status_code=400, content={"message": "动作配置保存失败"})

@app.delete("/actions/{action_id}")
async def delete_action(action_id: str):
    """删除动作配置"""
    result = action_config_manager.delete_action(action_id)
    if result:
        return JSONResponse(status_code=200, content={"message": "动作配置删除成功"})
    else:
        return JSONResponse(status_code=404, content={"message": "动作配置不存在"})

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5000, log_level="info")
