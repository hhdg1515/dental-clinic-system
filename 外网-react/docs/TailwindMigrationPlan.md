# Tailwind Migration Plan

## Goals
- Replace legacy page-scoped CSS bundles with Tailwind-driven utilities and design tokens while preserving the Figma visual language.
- Reduce duplication across the marketing and authenticated experiences by establishing shared layout primitives and component libraries.
- Improve maintainability and future feature velocity (e.g., member chat) through consistent styling conventions and predictable responsive behavior.

## Current Snapshot
- Tailwind is installed and wired through Vite (`index.css` already imports `@tailwind base/components/utilities`), but the theme is unconfigured and global styles are still driven by files in `src/styles/*`.
- Legacy CSS uses custom properties defined in `shared-styles.css` for colors, typography, spacing, and shadows; page bundles (`landingpage.css`, `faq-clean.css`, `chat-assistant.css`, etc.) layer complex component-specific rules on top.
- Components still rely on `className` strings that match the legacy styles (e.g., `.hero-section`, `.maples`); several sections also mix heavy inline styles.

## Migration Principles
1. **Design tokens first** – capture the existing palette, typography, spacing, and radii in Tailwind’s `theme.extend`. Reuse the same naming semantics as the Figma system (e.g., `brand.primary`, `surface.emphasis`).
2. **Page-by-page, component-first** – start with isolated components (navigation, footer, buttons) before tackling large layouts. This allows incremental adoption without breaking entire pages.
3. **Bridge layer** – maintain a temporary CSS bridge (`styles/legacy-bridge.css`) for selectors we have not yet migrated; remove entries only after the dependent component is converted.
4. **Parity validation** – after each migration chunk, verify layout across breakpoints and key locales (`en`, `zh`). Use existing manual QA checklist + simple Percy-style screenshot diffs if available.
5. **Coexistence** – avoid mixing Tailwind utilities and legacy classes on the same element unless necessary; prefer wrapping the legacy chunk in a `LegacySection` container while converting internals.

## Design Fidelity Charter (P0)
- **像素级保真**：视觉以旧外网 CSS 为唯一标准；**禁止**因“Tailwind 常规做法”而改动视觉。
- **允许的改动范围**：仅可将**既有视觉**等效映射为 Tailwind 工具类或在 `@layer components` 中的组件类；**不得**改变排版、间距、字重、圆角、阴影、颜色与层级。
- **变更边界**：除非在“Phased Rollout/Next Steps”中明确列出，否则**不得新增或删除**结构、容器或断点。
- **验收口径**：在 1440px 与 375px 下对照 legacy CSS 检查：① 尺寸/间距；② 颜色/阴影/圆角；③ Overlay/装饰/层级一致；与旧站“无感”。
- **优先级**：P0=保真，P1=清理旧样式，P2=抽象与复用，P3=性能与体积（Code-splitting/按需加载）。
- **范围限定**：Header **必须全宽铺满**；Footer **双层色块**与版权行 **水平居中且贴底**；营业时间 **无分隔线**；社交图标具备 hover/focus/active 反馈；Footer **不被装饰图遮挡**（`z-index ≥ 30`）。

## Phased Rollout

### Phase 0 – Tooling Prep
- Extend `tailwind.config.js`:
  - Map color scheme (`--primary-color`, `--secondary-color`, etc.) into `theme.extend.colors`.
  - Register fonts (`'Montserrat'`, `'Playfair Display'`) via `fontFamily`.
  - Add spacing, radius, shadow tokens mirroring the CSS variables.
  - Configure container widths + breakpoints based on current design.
- Create `src/styles/tailwind-base.css` with global resets that replace those now living in `shared-styles.css`.
- Introduce helper utilities (`clsx`, `tailwind-merge`) for composable class management if not already present.

### Phase 1 – Global & Layout Foundations
- Convert `Navigation` and `Footer` components using Tailwind utilities, adding Tailwind-based responsive behaviour.
- Replace high-level layout wrappers (`.hero-section`, `.content-section`, `.login-container`) with Tailwind equivalents while keeping inner section styles in the bridge file.
- Migrate typography defaults to Tailwind (`prose`, heading scales) via reusable class sets (`className="font-display text-4xl tracking-tight"` etc.).

### Phase 2 – Shared Components & Forms
- Rebuild button styles (primary, secondary, chat assistant states) as Tailwind component classes (e.g., `btn`, `btn-primary`, `btn-outline`) using `@layer components`.
- Migrate form inputs and validation messaging (Appointment form, login/register) to Tailwind classes; consider enabling `@tailwindcss/forms` plugin for consistent base styling.  
  _Status_: Login + Appointment forms now use Tailwind utilities (2025-10-12); legacy `auth-ui.css` and `appointment-ui.css` removed.
- Extract card / panel primitives used across FAQ and services detail pages (`.things-to-bring-card`, `appointments-summary`) into composable components with Tailwind classes.

### Phase 3 – Page Sections
- FAQ: translate carousel sections to Tailwind, leveraging flex/grid utilities instead of absolute positioning where possible. Validate translation strings with varying length to avoid overflow.
- Landing page: tackle hero, services highlights, testimonials, and CTA blocks sequentially. Remove redundant background images once Tailwind gradients/spacings replicate the original look.
- Services detail pages: convert tab/accordion UI and highlight blocks; ensure cross-device spacing matches Figma specs.
- Dashboard (authenticated view): migrate layout + cards, keeping VIP chat button styles consistent with the public palette.

### Phase 4 – Chat Assistant UI
- Once the chat React module lands, style the floating toggle + overlay via Tailwind:
  - Create Tailwind component classes for chat bubbles, typing indicators, quick-action buttons.
  - Replace `chat-assistant.css` with Tailwind utilities, leaving only animation keyframes in a lightweight CSS module if needed.

### Phase 5 – Cleanup & Hardening
- Remove unused CSS bundles as their sections are migrated; update the bridge file checklist to ensure no orphaned selectors remain.
- Run `npm run lint` and `npm run build` after each batch to catch regressions. Add Playwright visual regression tests for key pages if feasible.
- Update documentation (README / guides) to reflect Tailwind class usage guidelines and naming conventions.

## Safeguards & QA
- Maintain a running migration checklist (Excel/Notion/Jira) mapping each legacy selector to its Tailwind replacement.
- For each converted component:
  1. Verify responsive breakpoints (mobile, tablet, desktop) manually.
  2. Test both languages for layout shifts.
  3. Confirm dark overlays / background images still meet contrast ratios (WCAG AA).
- Use feature branches + PR review with screenshots before merging major styling rewrites.

## Open Questions / Follow-ups
- Decide whether to adopt a utility-first pattern exclusively or keep light semantic component classes for readability (`className="btn btn-primary"` via `@layer components`).
- Determine if we should introduce a design token file (JSON/TS) shared with potential native apps or keep tokens inside Tailwind config.
- Evaluate adding Tailwind plugins (`typography`, `forms`, `aspect-ratio`) once their footprint is justified by use cases.
- Align with product/design on any visual tweaks we might introduce during the refactor (e.g., updated hero gradients, simplified maple leaf decorations).
"""