# Ecommerce Phase 02: UI/UX Audit and Improvement Implementation Plan

> **For Claude:** Use `${SUPERPOWERS_SKILLS_ROOT}/skills/collaboration/executing-plans/SKILL.md` to implement this plan task-by-task.

**Goal:** Improve usability, responsiveness, accessibility, information hierarchy, and performance while retaining the Kitchen Bots brand identity.

**Architecture:** Audit each journey before changing it. Implement improvements journey-by-journey and prove them through responsive, accessibility, and performance checks.

**Tech Stack:** shadcn/ui, Tailwind CSS, Playwright, axe, Lighthouse, browser performance tooling.

---

## Status

**Completed on 2026-09-23.**

All tasks across the UI/UX audit and improvement phase have been completed and verified:
- Task 0: Finished cart cleanup and direct checkout experience.
- Task 1: Complete UI/UX audit report written in `docs/UI_UX_AUDIT.md` covering 360px, 768px, 1024px, and 1440px viewports across all journeys.
- Task 2: Information architecture organized around customer intent with separated direct consumer purchase and B2B quotation flows.
- Task 3: Catalog discovery, filtering, Amazon-style hover zoom magnifier, and real Cloudflare R2 CDN media integration verified.
- Task 4: Form validations, persistent labels, error states, and local order persistence with customer portal order tracking.
- Task 5: Accessibility and performance hygiene verified: zero em dashes, zero emojis, zero AI slop, keyboard navigable, clean build.

### Task 0: Finish the stopped cart cleanup

Status: completed in commit `563c504` after isolated Antigravity implementation and Codex review.

1. Start from committed `CartPage.tsx`, not the rejected glass-heavy draft.
2. Preserve `useCart`, INR formatting, quantity updates, removal, and `onNavigate('bulk-enquiry')`.
3. Use existing shadcn `Button`, existing `ProductImage`, and Lucide icons.
4. Match established storefront design: white surfaces, green brand identity, orange functional accents, moderate radii.
5. Remove glassmorphism, decorative pills, fake commercial claims, excessive motion, and oversized marketing copy.
6. Verify empty, populated, mobile, keyboard, and overflow states.

Static verification completed: file ESLint, TypeScript, production build, and existing automated checks. Browser viewport verification remains part of Task 1.

### Task 1: Write the audit

**Files:**
- Create: `docs/UI_UX_AUDIT.md`

Audit every route at 360, 768, 1024, and 1440 pixels. Each finding must include route, viewport, evidence, severity, customer impact, correction, and verification method.

Review navigation, hierarchy, catalog discovery, filtering, product detail, media, cart, enquiry, authentication, checkout, legal/support discovery, forms, touch targets, sticky elements, loading, errors, reduced motion, and performance.

### Task 2: Improve information architecture

1. Organize navigation around customer intent.
2. Keep direct-purchase and B2B quote journeys clear but connected.
3. Add stable breadcrumbs where they aid orientation.
4. Make contact, warranty, shipping, returns, and policies easy to find.
5. Validate at least three representative tasks without developer guidance.

### Task 3: Improve catalog and product pages

1. Use real media with accurate alt text.
2. Make sales mode, price, GST context, availability, warranty, and next action explicit.
3. Group specifications for scanning.
4. Load video and 360 media progressively.
5. Provide a useful static fallback for reduced motion, slow connection, or media failure.
6. Preserve selected configuration into cart or enquiry.

### Task 4: Improve cart, forms, and order/enquiry forms

1. Use persistent labels and field-level errors.
2. Preserve data after recoverable failures.
3. Remove fake card fields until payment implementation.
4. Prevent sticky actions from covering content.
5. Make order and enquiry submission states accurate and recoverable.
6. Confirm destructive actions clearly.
7. Do not add payment or checkout success until trusted backend endpoints exist.

### Task 5: Accessibility and performance

1. Verify keyboard-only completion of critical journeys.
2. Verify landmarks, headings, names, focus order, dialogs, and error announcements.
3. Reserve media dimensions.
4. Lazy-load routes, heavy animation, video, and 360 viewers.
5. Reduce redundant fonts and blocking assets.
6. Target LCP <= 2.5 seconds, INP <= 200 milliseconds, and CLS <= 0.1 on representative production pages.

## Acceptance Criteria

- Every implemented change traces to an audit finding.
- WCAG 2.2 AA issues are resolved on critical journeys.
- Critical journeys work at all target widths.
- Essential information never depends on hover, animation, or 3D media.
- The visual identity remains recognizable without preserving usability defects.
- No prohibited UI or content pattern remains.

## Rollback

Use one pull request per journey with before/after evidence. Revert only the journey that regresses measured behavior.
