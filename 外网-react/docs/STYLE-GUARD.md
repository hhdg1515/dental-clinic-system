本文件为 Tailwind 迁移期的**硬性护栏**，确保像素级保真与旧外网 CSS 的视觉一致性。

## Forbidden（禁止）
- 修改 Header、Footer、Landing hero、Forms 的**颜色/圆角/阴影/间距/字重/字号/断点**
- 引入新的布局容器（将 `w-full` 改为 `max-w-*` 或 80% 宽等）
- 调整列数、改栅格、改 overlay 强度或替换背景资源
- 以“更 Tailwind”为由重排结构（仅允许等效替换）
- 新增 Tailwind tokens（`tailwind.config.js` 仅做旧 token 映射）

## Allowed（允许）
- 使用 Tailwind 工具类或 `@layer components` **等效还原** legacy 视觉
- 在 `src/index.css` 的 `@layer components` 定义**等效**组件类（不可改变视觉）
- 对无可避免的兼容性问题，新增最小限度的 bridge 选择器（随迁随删）

## Must-check（每次提交前）
- **Header**：左右全宽铺满（w-full），Landing=overlay，内页=plain，无多余间距/灰底
- **Footer**：双层色块（#263C38 / #213330），版权行**水平居中且贴底**，不被装饰图遮挡（`z-index ≥ 30`）
- **营业时间**：无分隔线
- **社交图标**：有 `hover/focus/active` 明显反馈（无需真实链接）

## 提交流程
- PR 必须附两档截图（1440px / 375px）对比 legacy
- 若与 legacy 不一致，先回