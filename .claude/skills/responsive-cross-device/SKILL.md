---
name: responsive-cross-device
description: Every Rampage screen must work and look good on both desktop and mobile — phones hit the app via QR code, so mobile is a first-class target, not an afterthought. Use whenever building or changing any page, layout, game screen, or interactive component.
---

# Responsive, cross-device — desktop AND mobile, always

Players join by **scanning a QR code on their phone**, and coworkers also open it on laptops. So every screen must be usable and look good on both. Mobile is not a nice-to-have here — it's the primary join device. Design mobile-first, then scale up.

## Rules
- **Mobile-first Tailwind.** Write base classes for small screens, layer breakpoints upward (`sm:` `md:` `lg:`). Don't design desktop-only and hope it shrinks.
- **No fixed pixel widths** that overflow a phone. Use fluid widths, `max-w-*`, `w-full`, flex/grid that reflow. Avoid horizontal scroll on mobile.
- **Touch targets ≥ 44px.** Buttons and interactive controls must be tappable, not just clickable. Add spacing so fingers don't mis-hit.
- **Fluid type & spacing.** Use responsive text sizes; keep the game readable on a small screen without zooming.
- **Respect safe areas & viewport.** Account for mobile browser chrome/notches; use `dvh`/`svh` or `min-h-dvh` rather than `100vh` where full-height matters (avoids the mobile URL-bar jump).
- **Layouts reflow, not just resize.** Multi-column on desktop → single column stack on mobile. Side panel → drawer/sheet (shadcn `Sheet`) on small screens.
- **The game loop must be playable on a phone.** Controls sized and placed for thumbs. If a mechanic only works with a mouse/keyboard, provide a touch equivalent or rethink it.
- **Test both before calling it done.** Check a real phone width (or DevTools device toolbar, ~375px) *and* a laptop width. The demo will be shown on both.

## Quick check before finishing any UI
- Does it render with no horizontal scroll at ~375px wide?
- Are all buttons/controls comfortably tappable on a phone?
- Does the layout reflow sensibly (stack, not squish) between mobile and desktop?
- Is text readable on mobile without pinch-zoom?
- Does full-height content behave with the mobile URL bar (`dvh`, not `vh`)?

## Related
- `shared-ui-components` — build responsiveness with shadcn/Tailwind primitives; they're responsive-friendly out of the box.
- `judging-criteria` — a demo that breaks on the phone people just scanned tanks the demo score.
- `rampage-conventions` — the QR-join flow that makes mobile the primary device.
