/**
 * 简化版自定义动作管理模块
 * 负责处理自定义动作的添加、编辑、删除和列表管理
 */

// 简化版CustomActionsManager，修复了变量名错误
class CustomActionsManager {
  constructor(
    panelId,
    actionListId,
    actionFormId,
    editActionTitleId,
    actionIdInputId,
    actionNameInputId,
    upAngleInputId,
    downAngleInputId,
    keypointsInputId,
    submitBtnId,
    cancelEditBtnId,
    deleteActionBtnId,
    customActionsBtnId,
  ) {
    console.log("初始化CustomActionsManager...");

    // 存储元素引用
    this.panel = document.getElementById(panelId);
    this.actionList = document.getElementById(actionListId);
    this.actionForm = document.getElementById(actionFormId);
    this.editActionTitle = document.getElementById(editActionTitleId);

    // 修复：使用正确的参数名
    this.actionIdInput = document.getElementById(actionIdInputId);
    this.actionNameInput = document.getElementById(actionNameInputId);
    this.upAngleInput = document.getElementById(upAngleInputId);
    this.downAngleInput = document.getElementById(downAngleInputId);
    this.keypointsInput = document.getElementById(keypointsInputId);
    this.submitBtn = document.getElementById(submitBtnId);
    this.cancelEditBtn = document.getElementById(cancelEditBtnId);
    this.deleteActionBtn = document.getElementById(deleteActionBtnId);
    this.customActionsBtn = document.getElementById(customActionsBtnId);
    this.closeBtn = this.panel.querySelector(".close");

    // 初始化数据
    this.actions = [];
    this.editingAction = null;
    this.callbacks = {
      onActionsChange: [],
    };

    // 绑定事件
    this.bindEvents();

    console.log("CustomActionsManager初始化成功！");
  }

  // 绑定事件监听器
  bindEvents() {
    // 打开面板
    this.customActionsBtn.addEventListener("click", () => {
      this.show();
    });

    // 关闭面板
    this.closeBtn.addEventListener("click", () => {
      this.close();
    });

    // 表单提交
    this.actionForm.addEventListener("submit", (e) => {
      e.preventDefault();
      this.saveAction();
    });

    // 取消编辑
    this.cancelEditBtn.addEventListener("click", () => {
      this.cancelEdit();
    });

    // 删除按钮
    this.deleteActionBtn.addEventListener("click", () => {
      this.deleteCurrentAction();
    });

    // 点击外部关闭
    window.addEventListener("click", (e) => {
      if (e.target === this.panel) {
        this.close();
      }
    });
  }

  // 显示面板
  show() {
    this.panel.style.display = "block";
    this.loadActions();
  }

  // 关闭面板
  close() {
    this.panel.style.display = "none";
    this.cancelEdit();
  }

  // 加载动作列表
  async loadActions() {
    try {
      const response = await fetch("http://localhost:5000/actions");
      if (response.ok) {
        const data = await response.json();
        this.actions = data.actions;
        this.renderActionList();
      } else {
        console.error("加载动作列表失败");
      }
    } catch (error) {
      console.error("获取动作列表出错:", error);
    }
  }

  // 渲染动作列表
  renderActionList() {
    this.actionList.innerHTML = "";

    this.actions.forEach((action) => {
      const isCustom = !action.is_default;
      const actionItem = document.createElement("div");
      actionItem.className = "action-item";

      actionItem.innerHTML = `
                <div class="action-info">
                    <h4>${action.name}${isCustom ? " (自定义)" : ""}</h4>
                    <p>上角度: ${action.up_angle || action.upAngle}° | 下角度: ${action.down_angle || action.downAngle}°</p>
                    <p>关键点: ${(action.kpts || action.keypoints).join(", ")}</p>
                </div>
                <div class="action-actions">
                    <button class="edit-action-btn" data-id="${action.id}">编辑</button>
                    ${isCustom ? `<button class="delete-action-btn" data-id="${action.id}">删除</button>` : ""}
                </div>
            `;

      // 编辑按钮事件
      actionItem.querySelector(".edit-action-btn").addEventListener("click", () => {
        this.editAction(action);
      });

      // 删除按钮事件
      if (isCustom) {
        actionItem.querySelector(".delete-action-btn").addEventListener("click", () => {
          this.deleteAction(action.id);
        });
      }

      this.actionList.appendChild(actionItem);
    });
  }

  // 编辑动作
  editAction(action) {
    this.editingAction = action;
    this.editActionTitle.textContent = `编辑动作: ${action.name}`;
    this.actionIdInput.value = action.id;
    this.actionNameInput.value = action.name;
    this.upAngleInput.value = action.up_angle || action.upAngle;
    this.downAngleInput.value = action.down_angle || action.downAngle;
    this.keypointsInput.value = (action.kpts || action.keypoints).join(",");
    this.deleteActionBtn.disabled = false;
  }

  // 保存动作
  async saveAction() {
    const actionData = {
      name: this.actionNameInput.value.trim(),
      up_angle: parseInt(this.upAngleInput.value),
      down_angle: parseInt(this.downAngleInput.value),
      kpts: this.keypointsInput.value.split(",").map((kp) => parseInt(kp.trim())),
    };

    if (this.editingAction) {
      actionData.id = this.editingAction.id;
    }

    try {
      const response = await fetch("http://localhost:5000/actions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(actionData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("动作保存成功:", result);
        this.cancelEdit();
        this.loadActions();
        this.notifyActionsChange();
      } else {
        console.error("动作保存失败:", await response.json());
      }
    } catch (error) {
      console.error("与后端通信出错:", error);
    }
  }

  // 删除动作
  async deleteAction(actionId) {
    if (confirm("确定要删除这个动作吗？")) {
      try {
        const response = await fetch(`http://localhost:5000/actions/${actionId}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const result = await response.json();
          console.log("动作删除成功:", result);
          this.loadActions();
          this.notifyActionsChange();
        } else {
          console.error("动作删除失败:", await response.json());
        }
      } catch (error) {
        console.error("与后端通信出错:", error);
      }
    }
  }

  // 删除当前编辑的动作
  deleteCurrentAction() {
    if (this.editingAction) {
      this.deleteAction(this.editingAction.id);
    }
  }

  // 取消编辑
  cancelEdit() {
    this.editingAction = null;
    this.editActionTitle.textContent = "添加新动作";
    this.actionIdInput.value = "";
    this.actionNameInput.value = "";
    this.upAngleInput.value = "";
    this.downAngleInput.value = "";
    this.keypointsInput.value = "";
    this.deleteActionBtn.disabled = true;
  }

  // 通知动作列表变化
  notifyActionsChange() {
    this.callbacks.onActionsChange.forEach((callback) => {
      callback(this.actions);
    });
  }

  // 注册事件监听器
  on(eventName, callback) {
    if (this.callbacks[eventName]) {
      this.callbacks[eventName].push(callback);
    }
  }
}

// 导出CustomActionsManager类
window.CustomActionsManager = CustomActionsManager;
