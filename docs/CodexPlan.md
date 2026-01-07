# CodexPlan.md

## Objectives
- Complete the refactor of the public-facing app (`外网-react`) into a well-typed, componentized React + TypeScript codebase.
- Establish a consistent styling system (Tailwind CSS or agreed alternative) to improve performance, UX, and maintainability.
- Preserve the current Firebase appointment workflow; validate that refactors keep public and admin dashboards in sync.
- Prepare the architecture for a members-only AI chat assistant powered by future RAG + LLM integrations.

## Scope
- Public app refactor within `外网-react`:
  - Pages: Home, Services, FAQ, member chat entry, and any remaining marketing pages.
  - Shared components: Header, Navigation, Footer, carousels, chat-shell UI, etc.
  - Hooks/contexts: language handling (`useLanguage`), carousel hooks, Firebase data flows, member session/chat state.
- Styling system rollout (Tailwind or chosen solution).
- Firebase layer review to ensure per-clinic appointment segregation remains correct.
- AI chat groundwork:
  - Member-only access control and gated navigation.
  - JSON knowledge base ingestion and retrieval abstractions for RAG.
  - Provider-agnostic bridge for future LLM API calls (OpenAI, Gemini, etc.).
- Internal/admin app stays out of scope.

## Out of Scope
- Admin (`内网`) UI or feature changes.
- Firebase security rules/backend configuration unless refactor requires it.
- Non-public-app features.
- Finalizing a specific LLM vendor (only interfaces/placeholders).

## Strategy
1. **Discovery**
   - Inspect `外网-react` structure (components, pages, hooks).
   - Review existing guides/README to confirm prior refactor decisions.
   - Map current Firebase flows and clinic-isolation logic.
   - Identify legacy AI chat implementation details from the original web app.
2. **Foundation**
   - Confirm TypeScript configuration (tsconfig, path aliases, shared types).
   - Plan Tailwind adoption: config, stylesheet migration, legacy CSS cleanup.
   - Set up lint/format tooling (ESLint, Prettier) for consistent code quality.
3. **Architecture & Components**
   - Refine component hierarchy, extracting reusable UI/state pieces.
   - Strengthen component props and domain types; eliminate `any`.
   - Centralize copy, carousel data, and chat message schemas to avoid magic strings.
4. **Styling Migration**
   - Replace inline styles/custom CSS with Tailwind (or selected system) gradually.
   - Preserve Figma visual identity while simplifying maintenance.
   - Ensure responsive behavior and accessibility (semantic markup, ARIA).
   - Plan dedicated Tailwind components for the chat interface.
5. **Firebase & Data Flow**
   - Abstract Firebase calls into services/hooks with clear typings.
   - Document and enforce appointment, clinic, and role data models.
   - Verify member flagging and gating logic post-refactor.
   - Define test/QA steps for booking flows across clinics.
6. **AI Chat Readiness**
   - Design JSON knowledge base schema, loading, and retrieval helpers.
   - Prototype chat state management (context/store) and UI layout.
   - Create provider-agnostic adapters for LLM calls and fallback handling.
   - Define behaviour when knowledge base lacks answers (e.g., escalate to LLM).
7. **Performance & UX**
   - Optimize media usage (lazy loading, compression, CDN settings).
   - Audit bundle size and network requests; apply code-splitting if needed.
   - Improve user feedback for forms, loading states, carousels, and chat.
8. **Verification & Documentation**
   - Build regression checklist: page tour, booking flow, member login → chat, admin visibility checks.
   - Update README/guide documents with new setup steps, architectural choices, and chat guidance.
   - Track open issues or follow-ups for styling polish and AI integration.

## Safety & Quality Rules
- Keep backups: verify Git status before edits; never discard untracked user work.
- Make incremental commits/PRs per logical change; treat chat feature groundwork as a dedicated effort.
- Enforce type safety: define domain types for appointments, clinics, members, chat messages.
- Guarantee functional parity: manually/automatically test critical flows after refactors.
- Protect clinic isolation logic—never merge without double validation of data filters.
- Touch Firebase calls carefully; coordinate if admin app might be impacted.
- Gate member chat with strict auth checks; sanitize JSON knowledge data before exposure.
- Avoid mixing styling paradigms once Tailwind lands; document any temporary exceptions.
- Document meaningful architectural decisions to keep future contributors aligned.
