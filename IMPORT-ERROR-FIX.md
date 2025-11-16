# 修复 Import 语法错误

## 错误信息
```
Uncaught SyntaxError: Cannot use import statement outside a module
dental-chart.js:4
```

## 原因
JavaScript 文件使用了 ES6 的 `import` 语句，但 HTML 中没有将其声明为模块。

## 解决方案

### 选项1：修改 HTML 引用（推荐）

在 HTML 文件中，将：
```html
<script src="js/dental-chart.js"></script>
```

改为：
```html
<script type="module" src="js/dental-chart.js"></script>
```

### 选项2：移除 import 语句

如果文件使用了 `import { something } from './other-file.js'`，改为全局引用：

**之前：**
```javascript
import { escapeHtml } from './security-utils.js';
```

**之后：**
```javascript
// 确保 security-utils.js 在 dental-chart.js 之前加载
// 然后直接使用全局函数
```

并在 HTML 中确保正确的加载顺序：
```html
<script src="js/security-utils.js"></script>
<script src="js/dental-chart.js"></script>
```

### 选项3：将 import 改为全局导出

在 `security-utils.js` 中，添加：
```javascript
// 在文件末尾
window.SecurityUtils = {
  escapeHtml,
  safeSetText,
  // ... 其他函数
};
```

然后在 `dental-chart.js` 中：
```javascript
// 移除 import
// 使用 window.SecurityUtils.escapeHtml() 代替
```

## 检查步骤

1. 找到报错的文件（dental-chart.js）
2. 查看第4行是什么 import 语句
3. 根据上面的方案选择修复方式
