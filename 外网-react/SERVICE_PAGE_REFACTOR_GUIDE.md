# Service.html React 重构指导文档

## 📋 项目背景

外网 React 重构项目已经完成 Landing Page 的迁移。现在需要继续重构 `service.html` 页面。

### ✅ 已完成的工作
- Landing Page 100% UI 还原（包括轮播、距离显示、所有交互功能）
- 双语系统（700+ 翻译条目）完全可用
- Navigation 和 Footer 组件已创建并复用
- CSS 文件已全部迁移到 `/src/styles/` 目录
- 两个自定义 Hooks 已创建：`useClinicMap`, `useCommunityCarousel`

### 🎯 本轮目标
将 `外网/service.html` 完整迁移到 React，实现 100% UI 还原。

---

## 📁 文件结构参考

### 当前 React 项目结构
```
外网-react/
├── src/
│   ├── components/
│   │   ├── Navigation.tsx       ✅ 已完成
│   │   └── Footer.tsx           ✅ 已完成
│   ├── pages/
│   │   └── Landing.tsx          ✅ 已完成
│   ├── context/
│   │   ├── LanguageContext.tsx  ✅ 已完成
│   │   └── translations.ts      ✅ 已完成（700+ 条目）
│   ├── hooks/
│   │   ├── useClinicMap.ts      ✅ 已完成
│   │   └── useCommunityCarousel.ts ✅ 已完成
│   └── styles/
│       ├── shared-styles.css    ✅ 已迁移
│       ├── landingpage.css      ✅ 已迁移
│       ├── service.css          ✅ 已迁移
│       ├── faq-clean.css        ✅ 已迁移
│       ├── services-detail.css  ✅ 已迁移
│       ├── auth-ui.css          ✅ 已迁移
│       ├── appointment-ui.css   ✅ 已迁移
│       └── chat-assistant.css   ✅ 已迁移
```

### 原始文件位置
```
外网/
├── service.html          ⬅️ 需要迁移
├── faq.html              ⬅️ 后续迁移
├── services-detail-1.html ⬅️ 后续迁移
├── services-detail-2.html ⬅️ 后续迁移
└── js/
    ├── static-pages.js   ⬅️ Service 页面的 JS 逻辑
    ├── languages.js      ✅ 已迁移到 translations.ts
    └── shared-utils.js   📝 需要按需迁移功能
```

---

## 🔍 Service.html 分析

### 第一步：阅读原始文件
**必须先读取这些文件来理解页面结构：**

1. **HTML 结构**
   ```bash
   Read: 外网/service.html
   ```
   重点关注：
   - 页面整体布局（header, hero section, services grid, footer）
   - 每个服务卡片的结构
   - 所有使用 `data-lang` 属性的文本（需要翻译）
   - 特殊交互元素（按钮、链接、悬停效果）

2. **JavaScript 逻辑**
   ```bash
   Read: 外网/js/static-pages.js
   ```
   检查是否有：
   - 事件监听器（点击、悬停等）
   - 动画效果
   - 数据处理逻辑
   - 需要迁移到 React 的功能

3. **CSS 样式**
   ```bash
   Read: 外网-react/src/styles/service.css
   ```
   确认：
   - 所有 CSS 类名
   - 是否有需要调整的样式
   - 响应式断点

---

## 📝 迁移步骤清单

### Step 1: 创建 Service.tsx 组件
**位置**: `外网-react/src/pages/Service.tsx`

**基础模板**:
```typescript
import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';
import { useLanguage } from '../context/LanguageContext';

export const Service = () => {
  const { t } = useLanguage();

  return (
    <div>
      {/* Navigation */}
      <Navigation />

      {/* Hero Section */}
      {/* 从 service.html 复制并转换为 React JSX */}

      {/* Services Grid */}
      {/* 从 service.html 复制并转换为 React JSX */}

      {/* Footer */}
      <Footer />
    </div>
  );
};
```

### Step 2: 转换 HTML 到 JSX 的关键点

**❗ 重要转换规则**:

1. **属性名转换**
   ```html
   <!-- HTML -->
   <div class="service-card" data-lang="service-title">

   <!-- React JSX -->
   <div className="service-card">{t('service-title')}</div>
   ```

2. **图片路径**
   ```html
   <!-- HTML -->
   <img src="images/family.jpg" alt="Family">

   <!-- React JSX -->
   <img src="/images/family.jpg" alt="Family" />
   ```

3. **链接转换（如果使用 React Router）**
   ```html
   <!-- HTML -->
   <a href="services-detail-1.html">View Details</a>

   <!-- React JSX -->
   <a href="/services-detail-1">View Details</a>
   <!-- 或者使用 Link 组件（如果路由已配置） -->
   ```

4. **内联样式**（尽量避免，优先使用 CSS 类）
   ```jsx
   <div style={{ marginTop: '2em', color: 'white' }}>
   ```

5. **自闭合标签**
   ```jsx
   <img />, <br />, <hr />, <input />
   ```

### Step 3: 处理翻译文本

**检查 translations.ts 是否已包含所有 Service 页面的翻译键**

1. **读取当前翻译文件**
   ```bash
   Read: 外网-react/src/context/translations.ts
   ```

2. **在 service.html 中找到所有 `data-lang` 属性**
   ```bash
   Grep: pattern="data-lang=\"[^\"]+\""
         path="外网/service.html"
         output_mode="content"
   ```

3. **确认翻译键是否缺失**
   如果缺失，需要从原始 `外网/languages.js` 中复制相应条目到 `translations.ts`

### Step 4: 添加路由配置

**位置**: `外网-react/src/App.tsx`

```typescript
import { Service } from './pages/Service';

// 在 <Routes> 中添加
<Route path="/service" element={<Service />} />
```

### Step 5: 检查是否需要新的 Hooks

**Service 页面可能需要的交互功能：**

- ✅ 如果有轮播/滑动：参考 `useCommunityCarousel.ts` 创建类似 hook
- ✅ 如果有筛选/排序：创建 `useServiceFilter.ts`
- ✅ 如果有手风琴/折叠面板：创建 `useAccordion.ts`
- ✅ 如果有模态框/弹窗：创建 `useModal.ts`

**示例 Hook 模板**:
```typescript
// src/hooks/useServiceFilter.ts
import { useState, useCallback } from 'react';

export const useServiceFilter = () => {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filterServices = useCallback((category: string) => {
    setActiveCategory(category);
  }, []);

  return {
    activeCategory,
    filterServices
  };
};
```

### Step 6: CSS 确认与调试

1. **确认 service.css 已在 main.tsx 中引入**
   ```typescript
   // main.tsx
   import './styles/service.css'
   ```

2. **检查 CSS 类名是否与原始 HTML 一致**
   - 使用浏览器开发工具对比
   - 确认所有样式都正确应用

3. **修复可能的 CSS 冲突**
   - Landing 页面的样式可能影响 Service 页面
   - 使用更具体的选择器或添加页面级别的 wrapper class

---

## 🎨 Service 页面常见结构模式

### 模式 1: Hero Section（英雄区域）
```jsx
<section className="services-hero">
  <div className="hero-content">
    <h1>{t('services-hero-title')}</h1>
    <p>{t('services-hero-subtitle')}</p>
  </div>
</section>
```

### 模式 2: Services Grid（服务网格）
```jsx
<section className="services-grid">
  <div className="container">
    {/* 服务卡片 - 可以使用 map 循环渲染 */}
    <div className="service-card">
      <img src="/images/service1.jpg" alt="Service 1" />
      <h3>{t('service-1-title')}</h3>
      <p>{t('service-1-description')}</p>
      <a href="/services-detail-1" className="learn-more">
        {t('learn-more')}
      </a>
    </div>
    {/* 更多卡片... */}
  </div>
</section>
```

### 模式 3: 服务卡片数据驱动（推荐）
```typescript
// 定义服务数据类型
interface ServiceItem {
  id: string;
  titleKey: string;
  descKey: string;
  image: string;
  detailLink: string;
}

// 服务数据数组
const services: ServiceItem[] = [
  {
    id: 'general-family',
    titleKey: 'service-general-title',
    descKey: 'service-general-desc',
    image: '/images/family.jpg',
    detailLink: '/services-detail-1#general-family'
  },
  // ... 更多服务
];

// 在组件中使用
{services.map(service => (
  <div key={service.id} className="service-card">
    <img src={service.image} alt={t(service.titleKey)} />
    <h3>{t(service.titleKey)}</h3>
    <p>{t(service.descKey)}</p>
    <a href={service.detailLink}>{t('learn-more')}</a>
  </div>
))}
```

---

## 🐛 常见问题与解决方案

### 问题 1: 图片不显示
**原因**: 路径错误
**解决**:
- 确认图片在 `public/images/` 目录
- 使用绝对路径 `/images/xxx.jpg`（不是 `./images/`）

### 问题 2: 翻译键缺失
**现象**: 页面显示 `service-xxx-title` 而不是实际文本
**解决**:
1. 检查 `translations.ts` 是否包含该键
2. 从 `外网/languages.js` 中找到对应键值对
3. 添加到 `translations.ts` 的 `en` 和 `zh` 对象中

### 问题 3: CSS 样式不生效
**检查项**:
1. CSS 文件是否在 `main.tsx` 中引入
2. CSS 类名拼写是否正确
3. 是否有更高优先级的样式覆盖
4. 使用浏览器开发工具检查元素的计算样式

### 问题 4: TypeScript 类型错误
**常见错误**:
```typescript
// ❌ 错误
<img src={imgSrc} alt={altText}>

// ✅ 正确（自闭合标签）
<img src={imgSrc} alt={altText} />

// ❌ 错误
<a href={link}>{t(textKey)}</a>

// ✅ 正确（确保 link 是字符串）
<a href={link || '#'}>{t(textKey)}</a>
```

---

## 📊 进度检查清单

完成 Service.tsx 后，逐项检查：

- [ ] **HTML 结构 100% 还原**
  - [ ] Hero section 正确显示
  - [ ] 所有服务卡片正确渲染
  - [ ] 图片全部正确加载
  - [ ] 所有链接可点击

- [ ] **翻译系统正常工作**
  - [ ] 所有文本使用 `t()` 函数
  - [ ] 中英文切换正常
  - [ ] 无翻译键缺失

- [ ] **CSS 样式完全一致**
  - [ ] 布局与原始页面一致
  - [ ] 颜色、字体、间距正确
  - [ ] 悬停效果正常
  - [ ] 响应式布局正常

- [ ] **交互功能正常**
  - [ ] 所有按钮可点击
  - [ ] 悬停动画流畅
  - [ ] 页面滚动平滑
  - [ ] 导航正确跳转

- [ ] **性能优化**
  - [ ] 图片使用优化格式
  - [ ] 无不必要的重渲染
  - [ ] 组件结构清晰

---

## 🚀 开始命令

**下一轮对话开始时，直接说：**

```
请帮我将 service.html 页面迁移到 React。请先阅读 外网/service.html 和 外网/js/static-pages.js，然后创建 Service.tsx 组件，实现 100% UI 还原。参考 SERVICE_PAGE_REFACTOR_GUIDE.md 文档。
```

---

## 📌 重要提醒

1. **100% UI 还原是核心要求** - 不要改变任何设计细节
2. **优先使用现有组件** - Navigation 和 Footer 已完成，直接复用
3. **翻译文本全部使用 `t()` 函数** - 不要硬编码任何文本
4. **保持 CSS 类名一致** - 不要重命名原有类名
5. **测试中英文切换** - 确保双语系统完全正常
6. **HMR 会自动更新** - 服务器正在 localhost:5177 运行

---

## 📚 参考文件路径快速索引

| 用途 | 文件路径 |
|------|---------|
| 原始 HTML | `外网/service.html` |
| 原始 JS | `外网/js/static-pages.js` |
| CSS 样式 | `外网-react/src/styles/service.css` |
| 翻译文件 | `外网-react/src/context/translations.ts` |
| 原始翻译参考 | `外网/languages.js` |
| Navigation 组件 | `外网-react/src/components/Navigation.tsx` |
| Footer 组件 | `外网-react/src/components/Footer.tsx` |
| Landing 页面参考 | `外网-react/src/pages/Landing.tsx` |
| 路由配置 | `外网-react/src/App.tsx` |

---

## ✅ 完成标志

当你在浏览器中看到：
1. Service 页面完整显示（与原 service.html 100% 一致）
2. 中英文切换正常
3. 所有链接和交互正常
4. 无控制台错误

**那么 Service 页面迁移就成功了！** 🎉

---

**祝下一轮对话顺利！加油！💪**
