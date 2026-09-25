# PHASE 8D — ACCESSIBILITY & RESPONSIVE DESIGN SPECIFICATION

## 1. Responsive Viewport Guidelines

All views are validated across standard responsive breakpoints:
- **Ultra-Mobile (320px – 360px)**: Compact layouts, single-column stacked cards, full touch target spacing.
- **Standard Mobile (375px – 412px)**: Optimal reading width, comfortable line heights for Uthmani script.
- **Tablet / Phablet (768px – 834px)**: 2-column balanced dashboard grids, sticky sub-navigation.
- **Desktop (1024px – 1280px+)**: Multi-column master-detail layout, sidebar filters, expansive analytics.

---

## 2. Accessibility (a11y) & WCAG AA Compliance

1. **Contrast Ratio**:
   - Primary text on cards: $\ge 4.5:1$ (stone-900 on white/stone-50).
   - Large headings ($\ge 18\text{pt}$): $\ge 3:1$.
   - Interactive borders: $\ge 3:1$.
2. **Touch Targets**:
   - Minimum target height and width of $44 \times 44\text{px}$ on all mobile touch controls.
3. **Keyboard Navigation & Focus**:
   - Visible focus indicators (`focus-visible:ring-2 focus-visible:ring-emerald-700`).
   - Logical tab orders adhering to natural Arabic RTL flow (right-to-left, top-to-bottom).
4. **Screen Reader Support (ARIA)**:
   - All state indicators possess descriptive Arabic `aria-label`s.
   - Live regions (`aria-live="polite"`) for background sync notifications and conflict warnings.
   - Non-informative decorative icons flagged with `aria-hidden="true"`.
5. **Reduced Motion**:
   - Respects `prefers-reduced-motion: reduce` across all transitions and animations.
