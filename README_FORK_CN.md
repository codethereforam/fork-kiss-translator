# KISS Translator Fork - 新增功能说明

本分支为 KISS Translator 添加了以下新功能：

## 新增功能

### 1. 查词历史功能（新增）

自动记录用户使用划词翻译的历史记录，支持在设置中查看、搜索和管理。

**功能特性：**
- 自动记录每次划词翻译的原文、译文、翻译服务
- 支持搜索历史记录
- 支持导入/导出历史记录（JSON 和 CSV 格式）
- 可在设置中开启/关闭查词历史
- 可自定义历史记录保存数量（1-1000 条）
- 去重处理：相同文本只保留最新的一条记录

**使用方法：**
1. 点击扩展图标打开设置
2. 在左侧菜单中选择"查词历史"
3. 可以查看、搜索、导出或清空历史记录

**设置选项：**
- 在"基本设置"页面可以配置：
  - 启用/禁用查词历史
  - 设置历史记录最大数量（默认 50 条，范围 1-1000）

**实现细节：**
- 新增 `src/hooks/LookupHistory.js` - 查词历史管理 Hook
- 新增 `src/views/Options/LookupHistory.js` - 查词历史设置页面
- 新增 `src/config/storage.js` 中的 `STOKEY_LOOKUP_HISTORY` 存储键
- 修改 `src/views/Selection/TranCont.js` 在翻译完成时自动保存历史
- 添加路由和导航菜单项
- 添加多语言 i18n 支持

### 2. CTRL+选中触发模式

新增了一个触发模式，可以在以下条件下触发翻译：
- 选中文本 AND
- 按住 CTRL 键

可以在扩展设置中选择此触发模式：设置 → 划词翻译 → 触发方式 → CTRL+选中触发

**实现细节：**
- 在 `src/config/setting.js` 中添加了新常量 `OPT_TRANBOX_TRIGGER_CTRL_SELECT`
- 添加到可用触发模式数组 `OPT_TRANBOX_TRIGGER_ALL`
- 为所有支持的语言添加了 i18n 翻译
- 更新了鼠标松开事件处理器，在 CTRL+选中模式下检查 `e.ctrlKey`

### 3. 弹出窗口默认显示翻译标签页

点击工具栏扩展图标时，弹出窗口现在默认显示翻译标签页，而不是设置标签页。

**实现细节：**
- 在 `src/views/Popup/index.js` 中将 `showTrantab` 的初始状态从 `false` 改为 `true`

## 安装说明

### 在 Chrome 中加载扩展

1. 下载构建好的扩展包（在仓库根目录查找 `build/chrome` 文件夹）
2. 或者从构建产物中解压 zip 文件
3. 打开 Chrome 浏览器，访问 `chrome://extensions/`
4. 在右上角启用"开发者模式"
5. 点击"加载已解压的扩展程序"按钮
6. 选择解压后的 `chrome` 文件夹
7. 扩展现在应该已安装并激活

### 使用查词历史功能

1. 使用划词翻译功能翻译任意文本
2. 历史记录会自动保存
3. 点击扩展图标 → 查词历史，查看所有翻译记录
4. 可通过搜索框查找特定记录
5. 可导出为 CSV 或 JSON 格式备份

### 使用 CTRL+选中触发功能

1. 点击扩展图标打开设置
2. 切换到设置标签页（点击顶部的齿轮图标）
3. 找到"划词翻译"部分
4. 在"触发方式"下拉菜单中选择"CTRL+选中触发"
5. 设置会自动保存
6. 现在，当你在任何网页上选中文本并同时按住 CTRL 键时，翻译将自动显示

## 从源码构建

如需从源码构建扩展：

```bash
# 安装依赖
pnpm install

# 构建 Chrome 扩展
pnpm build:chrome

# 构建的扩展将位于 build/chrome/ 目录
```

## 最小化改动原则

这些更改遵循最小化改动的设计原则：
- 新增查词历史功能（7 个文件）
- 修改核心翻译逻辑（1 个文件）用于记录历史
- 易于与上游更新合并
- 功能清晰分离

## 修改的文件

### 查词历史功能
1. `src/config/storage.js` - 添加查词历史存储键
2. `src/hooks/LookupHistory.js` - 新增查词历史管理 Hook
3. `src/views/Options/LookupHistory.js` - 新增查词历史设置页面
4. `src/views/Options/Navigator.js` - 添加导航菜单项
5. `src/views/Options/index.js` - 添加路由
6. `src/views/Options/Setting.js` - 添加设置选项（开关和数量）
7. `src/views/Selection/TranCont.js` - 在翻译完成时保存历史
8. `src/config/i18n.js` - 添加多语言翻译

### CTRL+选中触发
1. `src/config/setting.js` - 添加新触发模式常量
2. `src/config/i18n.js` - 添加新触发模式的翻译
3. `src/views/Selection/index.js` - 添加 CTRL 键检测逻辑

### 弹出窗口默认显示翻译
1. `src/views/Popup/index.js` - 将默认标签页改为翻译

## 构建产物

- 构建的 Chrome 扩展包大小：约 1.2MB
- 包含所有必需的文件和本地化资源
- 可直接在 Chrome 或基于 Chromium 的浏览器中安装使用

## 注意事项

- 这些更改与上游仓库兼容，方便后续同步上游更新
- 所有新功能都是可选的，不影响现有功能
- 代码遵循项目现有的代码风格和架构
- 查词历史默认启用，可在设置中关闭
