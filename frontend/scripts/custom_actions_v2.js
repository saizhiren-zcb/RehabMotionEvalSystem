/**
 * 简化版自定义动作管理模块
 * 负责处理自定义动作的添加、编辑、删除和列表管理
 */

// 关键点索引到中文名称的映射
const keypointNames = {
  0: "鼻子",
  1: "左眼",
  2: "右眼",
  3: "左耳",
  4: "右耳",
  5: "左肩",
  6: "右肩",
  7: "左肘",
  8: "右肘",
  9: "左腕",
  10: "右腕",
  11: "左髋",
  12: "右髋",
  13: "左膝",
  14: "右膝",
  15: "左踝",
  16: "右踝",
};

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
    this.customActionsBtn = document.getElementById(customActionsBtnId);
    this.closeBtn = this.panel ? this.panel.querySelector(".close") : null;

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
    if (this.customActionsBtn) {
      this.customActionsBtn.addEventListener("click", () => {
        this.show();
      });
    }

    // 关闭面板
    if (this.closeBtn) {
      this.closeBtn.addEventListener("click", () => {
        this.close();
      });
    }

    // 表单提交
    if (this.actionForm) {
      this.actionForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.saveAction();
      });
    }

    // 取消编辑
    if (this.cancelEditBtn) {
      this.cancelEditBtn.addEventListener("click", () => {
        this.cancelEdit();
        this.close();
      });
    }

    // 点击外部关闭
    if (this.panel) {
      window.addEventListener("click", (e) => {
        if (e.target === this.panel) {
          this.close();
        }
      });
    }

    // 关键点选择事件
    const keypointsSelect = document.getElementById("keypointsSelect");
    const keypointsInput = document.getElementById("keypoints");
    const selectedKeypointsElement = document.getElementById("selectedKeypoints");

    // 改进的多选功能：点击切换选择，无需按住Ctrl键
    if (keypointsSelect) {
      keypointsSelect.addEventListener("click", (e) => {
        // 如果用户按住了Ctrl或Command键，使用浏览器默认的多选行为
        if (e.ctrlKey || e.metaKey) {
          return; // 不执行自定义逻辑，使用默认行为
        }

        if (e.target.tagName === "OPTION") {
          const option = e.target;
          const selectedOptions = Array.from(keypointsSelect.selectedOptions);

          // 检查当前选项是否已选中
          const isSelected = Array.from(selectedOptions).includes(option);

          // 如果已选中，取消选择
          if (isSelected) {
            option.selected = false;
          } else {
            // 如果未选中，检查是否超过最大选择数量
            if (selectedOptions.length >= 3) {
              alert("最多只能选择3个关键点！");
              return;
            }
            // 选择该选项
            option.selected = true;
          }

          // 手动触发change事件，更新显示
          keypointsSelect.dispatchEvent(new Event("change"));
        }
      });

      keypointsSelect.addEventListener("change", () => {
        // 获取所有选中的选项
        let selectedOptions = Array.from(keypointsSelect.selectedOptions);

        // 确保最多只选择3个关键点
        if (selectedOptions.length > 3) {
          // 只保留前3个选中的选项
          selectedOptions.slice(0, 3).forEach((opt) => (opt.selected = true));
          // 取消其他选项的选择
          selectedOptions.slice(3).forEach((opt) => (opt.selected = false));
          // 重新获取选中的选项
          selectedOptions = Array.from(keypointsSelect.selectedOptions);
          alert("最多只能选择3个关键点！");
        }

        // 获取选中的关键点值
        const selectedValues = selectedOptions.map((opt) => parseInt(opt.value));

        // 更新隐藏输入框
        if (keypointsInput) {
          keypointsInput.value = selectedValues.join(",");
        }

        // 更新显示的选中关键点
        if (selectedKeypointsElement) {
          if (selectedValues.length > 0) {
            const selectedNames = selectedValues.map((val) => `${val} - ${keypointNames[val]}`);
            selectedKeypointsElement.textContent = selectedNames.join(", ");
          } else {
            selectedKeypointsElement.textContent = "无";
          }
        }
      });
    }
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

      // 转换关键点为中文名称
      const kpts = action.kpts || action.keypoints;
      const keypointDisplay = kpts.map((kp) => `${kp} - ${keypointNames[kp]}`).join(", ");

      actionItem.innerHTML = `
                <div class="action-info">
                    <h4>${action.name}${isCustom ? " (自定义)" : ""}</h4>
                    <p>上角度: ${action.up_angle || action.upAngle}° | 下角度: ${action.down_angle || action.downAngle}°</p>
                    <p>关键点: ${keypointDisplay}</p>
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

    // 设置关键点选择
    const keypointsSelect = document.getElementById("keypointsSelect");
    const keypointsInput = document.getElementById("keypoints");
    const selectedKeypointsElement = document.getElementById("selectedKeypoints");

    // 获取动作的关键点
    const actionKeypoints = action.kpts || action.keypoints;

    // 重置选择
    for (let i = 0; i < keypointsSelect.options.length; i++) {
      keypointsSelect.options[i].selected = false;
    }

    // 选择对应的选项
    actionKeypoints.forEach((kp) => {
      for (let i = 0; i < keypointsSelect.options.length; i++) {
        if (parseInt(keypointsSelect.options[i].value) === kp) {
          keypointsSelect.options[i].selected = true;
          break;
        }
      }
    });

    // 更新隐藏输入框和显示
    keypointsInput.value = actionKeypoints.join(",");
    const selectedNames = actionKeypoints.map((val) => `${val} - ${keypointNames[val]}`);
    selectedKeypointsElement.textContent = selectedNames.join(", ");
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
        await this.loadActions();
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
          await this.loadActions();
          this.notifyActionsChange();
        } else {
          console.error("动作删除失败:", await response.json());
        }
      } catch (error) {
        console.error("与后端通信出错:", error);
      }
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
