# Ticket 023: QA & Polish Pass

## Status
`not started`

## Phase
Phase 5: Integration & Polish

## Dependencies
All previous tickets

## Description
Final quality assurance pass across the entire application. Fix visual inconsistencies, improve performance, ensure accessibility compliance, test responsive behavior, and polish the overall experience. This is the "make it ship-ready" ticket.

## Requirements
- [ ] **Visual consistency audit**:
  - Verify each component against DESIGN.md token usage (borders, shadows, radius, typography)
  - Decorative elements render correctly and don't obstruct content
  - Animation timing uses correct easing and durations per DESIGN.md
- [ ] **Performance benchmarks** (10k-commit dataset):
  - Initial load (data fetch + first render): < 3 seconds
  - Zoom transition: < 300ms
  - Search filter: < 300ms
  - Profile and fix any rendering bottlenecks found
- [ ] **Accessibility checklist**:
  - Run axe-core audit: 0 critical violations
  - Keyboard flow: Tab through toolbar → Enter to select → Escape to close/zoom out
  - `aria-label` on visualization circles
  - `prefers-reduced-motion`: verify all non-essential animation is disabled
  - Color contrast meets WCAG AA minimum
- [ ] **Responsive verification**:
  - Screenshot at 375px, 768px, 1440px widths
  - Detail panel goes full-width on mobile (375px)
  - Timeline collapses or hides at 375px
  - Toolbar adapts to narrow widths
- [ ] **Browser testing**:
  - Chrome, Firefox, Safari (latest versions)
  - No console errors or warnings in production build (`next build && next start`)

## Files to Create/Modify
- Multiple files across the codebase (fixes and adjustments)

## Acceptance Criteria
- [ ] Each component passes visual audit against DESIGN.md tokens (borders, shadows, radius, typography)
- [ ] Performance: initial load < 3s, zoom < 300ms, search < 300ms (measured at 10k commits)
- [ ] axe-core audit: 0 critical violations
- [ ] Keyboard Tab/Enter/Escape flow navigates the full app without mouse
- [ ] `prefers-reduced-motion` disables all non-essential animation (verified with media query toggle)
- [ ] No console errors in production build across Chrome, Firefox, Safari (latest)
- [ ] Responsive screenshots captured at 375px, 768px, 1440px with no layout breakage
- [ ] A new user can reach "first meaningful insight" in < 60 seconds (PRD success metric)

## Notes
- This ticket should be done last, after all features are implemented
- Use Lighthouse for performance and accessibility auditing
- Test with the PRD's recommended repos (angular, fastapi, git-cliff, electron, next.js, express)
- Focus on the critical path: load repo → see visualization → zoom → read details
- Don't over-polish — ship when it's good, iterate later
