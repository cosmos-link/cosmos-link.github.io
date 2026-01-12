# 简单TODO应用

一个基于HTML/CSS/JavaScript的简单TODO应用，具有完整的增删改查功能，数据存储在浏览器本地存储中。

## 功能特性

- ✅ 添加新的TODO事项
- ✅ 标记TODO为完成/未完成
- ✅ 编辑TODO内容
- ✅ 删除TODO事项
- ✅ 过滤显示：全部/未完成/已完成
- ✅ 清除所有已完成事项
- ✅ 数据持久化（本地存储）
- ✅ 响应式设计

## 使用方法

1. 直接打开 `index.html` 文件即可使用
2. 在输入框中输入TODO内容，点击"添加"或按Enter键
3. 点击复选框标记为完成/未完成
4. 点击"编辑"按钮修改TODO内容
5. 点击"删除"按钮删除TODO
6. 使用顶部过滤按钮切换显示
7. 点击"清除已完成"删除所有已完成事项

## 技术栈

- HTML5
- CSS3
- JavaScript (ES6)
- LocalStorage (数据存储)

## 文件结构

```
simple-todo-app/
├── index.html      # 主HTML文件
├── style.css       # 样式文件
├── app.js          # JavaScript逻辑
└── README.md       # 说明文档
```

## 浏览器兼容性

支持所有现代浏览器（Chrome, Firefox, Safari, Edge）。

## 注意事项

- 数据存储在浏览器本地，清除浏览器数据会丢失所有TODO
- 不支持跨设备同步
- 适合个人使用和简单任务管理