# FAQ.html React 重构指导文档

## 📋 项目背景

外网 React 重构项目已经完成 Landing Page 和 Service Page 的迁移。现在需要继续重构 `faq.html` 页面。

### ✅ 已完成的工作
- Landing Page 100% UI 还原（包括轮播、距离显示、所有交互功能）
- Service Page 100% UI 还原（8个服务卡片、双排布局、悬浮效果）
- 双语系统（700+ 翻译条目）完全可用
- Navigation 和 Footer 组件已创建并复用
- CSS 文件已全部迁移到 `/src/styles/` 目录
- 多个自定义 Hooks 已创建：`useClinicMap`, `useCommunityCarousel`

### 🎯 本轮目标
将 `外网/faq.html` 完整迁移到 React，实现 100% UI 还原，包括两个轮播组件。

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
│   │   ├── Landing.tsx          ✅ 已完成
│   │   └── Service.tsx          ✅ 已完成
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
│       └── ... (其他CSS文件)
```

### 原始文件位置
```
外网/
├── faq.html              ⬅️ 需要迁移
├── services-detail-1.html ⬅️ 后续迁移
├── services-detail-2.html ⬅️ 后续迁移
└── js/
    ├── faq.js            ⬅️ FAQ 页面的 JS 逻辑（两个轮播）
    ├── static-pages.js   ✅ 已分析
    └── shared-utils.js   📝 需要按需迁移功能
```

---

## 🔍 FAQ.html 分析

### 第一步：阅读原始文件

**必须先读取这些文件来理解页面结构：**

1. **HTML 结构**
   ```bash
   Read: 外网/faq.html
   ```
   重点关注：
   - Hero Section（森林背景、面包屑、标题、描述）
   - Things to Bring Card（三列布局：Safety, Comfort, Convenience）
   - Amenities Carousel（6个轮播项：Parking, Dining, Pharmacy, Waiting, Transport, Accessibility）
   - Tips Carousel（4个轮播项：Appointment, During, After, General）
   - 装饰图片元素（maples, pinecone 等）

2. **JavaScript 逻辑**
   ```bash
   Read: 外网/js/faq.js
   ```
   关键功能：
   - **Amenities Carousel**：6个轮播项，5秒自动切换
   - **Tips Carousel**：4个轮播项，6秒自动切换
   - 触摸滑动支持
   - 鼠标悬停暂停
   - 键盘导航（左右箭头）
   - GSAP 动画效果
   - 返回顶部按钮（滚动显示/隐藏）

3. **CSS 样式**
   ```bash
   Read: 外网-react/src/styles/faq-clean.css
   ```
   确认：
   - Hero section 样式
   - Carousel 样式和动画
   - 装饰图片位置
   - 响应式断点

---

## 📝 迁移步骤清单

### Step 1: 创建自定义 Hooks

**需要创建两个轮播 Hooks：**

#### 1.1 创建 `useAmenitiesCarousel.ts`
**位置**: `外网-react/src/hooks/useAmenitiesCarousel.ts`

```typescript
import { useState, useEffect, useCallback } from 'react';

export const useAmenitiesCarousel = (totalSlides: number = 6, autoSlideInterval: number = 5000) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  const goToSlide = useCallback((index: number) => {
    if (index >= 0 && index < totalSlides) {
      setCurrentSlide(index);
    }
  }, [totalSlides]);

  const pauseAutoSlide = useCallback(() => setIsPaused(true), []);
  const resumeAutoSlide = useCallback(() => setIsPaused(false), []);

  // 自动轮播
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(nextSlide, autoSlideInterval);
    return () => clearInterval(timer);
  }, [isPaused, nextSlide, autoSlideInterval]);

  // 键盘导航
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === 'ArrowRight') nextSlide();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide]);

  // 页面可见性控制
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsPaused(true);
      } else {
        setIsPaused(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return {
    currentSlide,
    nextSlide,
    prevSlide,
    goToSlide,
    pauseAutoSlide,
    resumeAutoSlide
  };
};
```

#### 1.2 创建 `useTipsCarousel.ts`
**位置**: `外网-react/src/hooks/useTipsCarousel.ts`

```typescript
// 类似 useAmenitiesCarousel，但默认参数不同
import { useState, useEffect, useCallback } from 'react';

export const useTipsCarousel = (totalSlides: number = 4, autoSlideInterval: number = 6000) => {
  // 逻辑与 useAmenitiesCarousel 相同
  // 复制上面的代码，只修改默认参数即可
};
```

### Step 2: 创建 FAQ.tsx 组件

**位置**: `外网-react/src/pages/FAQ.tsx`

**基础结构**:
```typescript
import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';
import { useLanguage } from '../context/LanguageContext';
import { useAmenitiesCarousel } from '../hooks/useAmenitiesCarousel';
import { useTipsCarousel } from '../hooks/useTipsCarousel';

export const FAQ = () => {
  const { t } = useLanguage();

  // Amenities carousel state
  const {
    currentSlide: amenitiesSlide,
    nextSlide: nextAmenity,
    prevSlide: prevAmenity,
    goToSlide: goToAmenity,
    pauseAutoSlide: pauseAmenities,
    resumeAutoSlide: resumeAmenities
  } = useAmenitiesCarousel(6, 5000);

  // Tips carousel state
  const {
    currentSlide: tipsSlide,
    nextSlide: nextTip,
    prevSlide: prevTip,
    goToSlide: goToTip,
    pauseAutoSlide: pauseTips,
    resumeAutoSlide: resumeTips
  } = useTipsCarousel(4, 6000);

  return (
    <div>
      {/* Hero Section */}
      <section className="hero-section">
        <header className="site-header">
          <Navigation />
        </header>

        <div className="hero-content">
          {/* Breadcrumbs */}
          {/* Title */}
          {/* Description */}
        </div>
      </section>

      {/* Content Section */}
      <section className="content-section">
        {/* Things to Bring Card */}
        {/* Amenities Carousel */}
        {/* Tips Carousel */}
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};
```

### Step 3: 实现 Things to Bring Card

这是一个静态卡片，包含三列：
- **FOR SAFETY**：6个项目
- **FOR COMFORT**：7个项目
- **FOR CONVENIENCE**：6个项目

**数据驱动方式**:
```typescript
const thingsToBringData = {
  safety: [
    'safety-insurance',
    'safety-medical',
    'safety-allergies',
    'safety-emergency',
    'safety-history',
    'safety-referral'
  ],
  comfort: [
    'comfort-headphones',
    'comfort-blanket',
    'comfort-entertainment',
    'comfort-clothing',
    'comfort-snacks',
    'comfort-water',
    'comfort-sunglasses'
  ],
  convenience: [
    'convenience-payment',
    'convenience-forms',
    'convenience-questions',
    'convenience-transport',
    'convenience-childcare',
    'convenience-work'
  ]
};
```

### Step 4: 实现 Amenities Carousel

**6个轮播项数据**:
```typescript
const amenitiesData = [
  {
    id: 'parking',
    image: '/images/parking.jpg',
    titleKey: 'amenity-parking-title',
    items: ['amenity-parking-1', 'amenity-parking-2', 'amenity-parking-3']
  },
  {
    id: 'dining',
    image: '/images/dining2.jpg',
    titleKey: 'amenity-dining-title',
    items: ['amenity-dining-1', 'amenity-dining-2', 'amenity-dining-3']
  },
  // ... 其他4个
];
```

**轮播渲染**:
```jsx
<div className="amenities-carousel">
  <div className="carousel-content">
    {amenitiesData.map((amenity, index) => (
      <div
        key={amenity.id}
        className={`carousel-item ${amenity.id} ${index === amenitiesSlide ? 'active' : ''}`}
      >
        <div className="image-section">
          <img className="left-image" src={amenity.image} alt={t(amenity.titleKey)} />
        </div>
        <div className="text-section">
          <h3 className="amenity-title">{t(amenity.titleKey)}</h3>
          <ul className="amenity-details">
            {amenity.items.map((itemKey) => (
              <li key={itemKey}>{t(itemKey)}</li>
            ))}
          </ul>
        </div>
      </div>
    ))}
  </div>

  {/* 导航按钮 */}
  <button className="carousel-nav prev" onClick={prevAmenity}>
    <i className="fas fa-chevron-left"></i>
  </button>
  <button className="carousel-nav next" onClick={nextAmenity}>
    <i className="fas fa-chevron-right"></i>
  </button>

  {/* 指示器 */}
  <div className="carousel-indicators">
    {amenitiesData.map((_, index) => (
      <span
        key={index}
        className={`indicator ${index === amenitiesSlide ? 'active' : ''}`}
        onClick={() => goToAmenity(index)}
      />
    ))}
  </div>
</div>
```

### Step 5: 实现 Tips Carousel

**4个轮播项数据**:
```typescript
const tipsData = [
  {
    id: 'appointment',
    image: '/images/Appointment.jpg',
    titleKey: 'tips-appointment-title',
    items: ['tips-appointment-1', 'tips-appointment-2', 'tips-appointment-3', 'tips-appointment-4']
  },
  {
    id: 'during',
    image: '/images/during.jpg',
    titleKey: 'tips-during-title',
    items: ['tips-during-1', 'tips-during-2', 'tips-during-3', 'tips-during-4']
  },
  // ... 其他2个
];
```

**轮播渲染**（类似 Amenities，但使用不同的 class 名称）:
```jsx
<div className="tips-carousel">
  {/* 类似结构，但使用 tips-carousel-item, tips-carousel-nav 等类名 */}
</div>
```

### Step 6: 添加鼠标悬停暂停功能

在轮播容器上添加事件：
```jsx
<div
  className="amenities-carousel"
  onMouseEnter={pauseAmenities}
  onMouseLeave={resumeAmenities}
>
  {/* 内容 */}
</div>
```

### Step 7: 装饰图片元素

原始 HTML 中有装饰图片（maples, maple2, pinecone 等），需要保留：
```jsx
<div className="maples"></div>
<div className="maple2"></div>
<div className="pinecone"></div>
<div className="maple3"></div>
{/* 等等... */}
```

这些元素通过 CSS 背景图片显示，不需要在 JSX 中添加 `src`。

### Step 8: 更新路由配置

**位置**: `外网-react/src/App.tsx`

```typescript
import { FAQ } from './pages/FAQ';

// 在 <Routes> 中添加
<Route path="/faq" element={<FAQ />} />
```

### Step 9: 确认 CSS 引入

**位置**: `外网-react/src/main.tsx`

确认 `faq-clean.css` 已引入（应该已经存在）：
```typescript
import './styles/faq-clean.css'
```

---

## 🎨 FAQ 页面结构总结

### 页面布局
1. **Hero Section**（森林背景，类似 Service 页面）
   - Navigation
   - Breadcrumbs
   - Page Title: "Patient Care Guide"
   - Description

2. **Things to Bring Card**（静态内容）
   - 三列布局
   - 每列有标题和列表

3. **Amenities Carousel**（第一个轮播）
   - 6个轮播项
   - 左右箭头导航
   - 底部指示器
   - 5秒自动切换

4. **Tips Carousel**（第二个轮播）
   - 4个轮播项
   - 左右箭头导航
   - 底部指示器
   - 6秒自动切换

5. **Footer**（复用组件）

---

## 🐛 常见问题与解决方案

### 问题 1: 轮播切换不流畅
**解决**:
- 确保 CSS 中有 `transition` 属性
- 使用 `opacity` 和 `visibility` 控制显示/隐藏
- 检查 `.active` 类是否正确添加

### 问题 2: 自动轮播不工作
**解决**:
- 检查 `useEffect` 的依赖项
- 确认 `setInterval` 正确清理
- 检查 `isPaused` 状态

### 问题 3: 键盘导航冲突
**解决**:
- 确保只监听一次 `keydown` 事件
- 在 `useEffect` 中正确清理事件监听器

### 问题 4: 装饰图片不显示
**解决**:
- 确认 CSS 中的背景图片路径正确
- 检查图片文件是否在 `public/images/` 目录
- 使用浏览器开发工具检查 CSS 是否加载

---

## 📊 进度检查清单

完成 FAQ.tsx 后，逐项检查：

- [ ] **HTML 结构 100% 还原**
  - [ ] Hero section 正确显示（森林背景）
  - [ ] Breadcrumbs 正确渲染
  - [ ] Things to Bring Card 三列布局正确
  - [ ] Amenities Carousel 所有6项正确显示
  - [ ] Tips Carousel 所有4项正确显示
  - [ ] 装饰图片正确显示

- [ ] **轮播功能正常**
  - [ ] Amenities 自动轮播（5秒）
  - [ ] Tips 自动轮播（6秒）
  - [ ] 左右箭头导航工作
  - [ ] 指示器点击切换工作
  - [ ] 鼠标悬停暂停工作
  - [ ] 键盘左右箭头导航工作
  - [ ] 页面不可见时暂停轮播

- [ ] **翻译系统正常**
  - [ ] 所有文本使用 `t()` 函数
  - [ ] 中英文切换正常
  - [ ] 无翻译键缺失

- [ ] **CSS 样式完全一致**
  - [ ] 布局与原始页面一致
  - [ ] 轮播过渡动画流畅
  - [ ] 响应式布局正常
  - [ ] 装饰图片位置正确

- [ ] **性能优化**
  - [ ] 轮播切换流畅无卡顿
  - [ ] 页面不可见时停止轮播
  - [ ] 无内存泄漏（清理 interval 和事件监听器）

---

## 🚀 开始命令

**下一轮对话开始时，直接说：**

```
请帮我将 faq.html 页面迁移到 React。请先阅读 外网/faq.html 和 外网/js/faq.js，然后创建 FAQ.tsx 组件和两个轮播 Hooks，实现 100% UI 还原。参考 FAQ_PAGE_REFACTOR_GUIDE.md 文档。
```

---

## 📌 重要提醒

1. **100% UI 还原是核心要求** - 不要改变任何设计细节
2. **优先使用现有组件** - Navigation 和 Footer 已完成，直接复用
3. **创建可复用的 Hooks** - 两个轮播 Hooks 可能在其他页面复用
4. **翻译文本全部使用 `t()` 函数** - 不要硬编码任何文本
5. **保持 CSS 类名一致** - 不要重命名原有类名
6. **测试所有交互功能** - 两个轮播的所有功能都要测试
7. **测试中英文切换** - 确保双语系统完全正常
8. **HMR 会自动更新** - 服务器正在运行时可以实时查看效果

---

## 📚 参考文件路径快速索引

| 用途 | 文件路径 |
|------|---------|
| 原始 HTML | `外网/faq.html` |
| 原始 JS（轮播逻辑） | `外网/js/faq.js` |
| CSS 样式 | `外网-react/src/styles/faq-clean.css` |
| 翻译文件 | `外网-react/src/context/translations.ts` |
| Navigation 组件 | `外网-react/src/components/Navigation.tsx` |
| Footer 组件 | `外网-react/src/components/Footer.tsx` |
| 轮播 Hook 参考 | `外网-react/src/hooks/useCommunityCarousel.ts` |
| 路由配置 | `外网-react/src/App.tsx` |

---

## ✅ 完成标志

当你在浏览器中看到：
1. FAQ 页面完整显示（与原 faq.html 100% 一致）
2. 两个轮播自动播放且流畅切换
3. 所有交互功能正常（箭头、指示器、键盘、悬停暂停）
4. 中英文切换正常
5. 无控制台错误

**那么 FAQ 页面迁移就成功了！** 🎉

---

## 🎯 关键技术点

### 轮播实现核心
- **状态管理**：使用 `useState` 管理当前 slide 索引
- **自动播放**：使用 `useEffect` + `setInterval`
- **暂停/恢复**：使用 `isPaused` 状态控制
- **键盘导航**：监听 `keydown` 事件
- **页面可见性**：监听 `visibilitychange` 事件
- **清理资源**：在 `useEffect` 返回清理函数

### CSS 过渡动画
```css
.carousel-item {
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.5s ease, visibility 0.5s;
}

.carousel-item.active {
  opacity: 1;
  visibility: visible;
}
```

### 触摸滑动支持（可选）
如果需要移动端触摸滑动，可以使用 `onTouchStart` 和 `onTouchEnd` 事件。

---

**祝下一轮对话顺利！加油！💪**
