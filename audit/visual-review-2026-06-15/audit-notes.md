# Codex Quota Widget Visual Audit

## Audit Scope

- Surface: 390 x 236 Windows desktop quota widget
- User goal: understand remaining quota at a glance without visual distraction
- References: `02-reference-green.png`, `03-reference-red.png`
- Current capture: `01-current-green-state.png`

## Step List

1. **Default widget state — Healthy foundation, needs hierarchy polish**
   - The overall structure is clear: identity and controls on top, primary quota on the left, supporting windows on the right.
   - The circular meter is memorable and matches the product concept.
   - The current browser capture shows the fallback/error content because the Electron preload bridge is unavailable outside the app. Layout and styling remain valid evidence; live data behavior was reviewed from code.

## Strengths

1. The circular liquid meter gives the product a distinct identity.
2. State colors are consistently propagated through the LED, meter, card, and ambient light.
3. The layout remains readable at a compact desktop-widget size.
4. Reduced-motion support is already present.
5. Hover and pressed states exist for title-bar controls.

## UX Risks

1. **Too many simultaneous focal points.** The LED, ambient glow, liquid edge, primary-card border, active pin button, and status dot all use the same accent. The eye does not know where to land first.
2. **The top-right control row is dense.** Five controls consume nearly half the title bar. Language is a low-frequency action and competes with refresh and window controls.
3. **Supporting information is visually compressed.** The right cards combine percentage and reset time in one bold line, which makes quick scanning harder.
4. **The footer has low-value persistent copy.** “Auto refresh every 60 seconds” is implementation detail rather than the most useful current status.
5. **Error and zero-quota states share red styling.** A connection failure can be mistaken for exhausted quota.

## Accessibility Risks

1. Labels at 9–10px are likely difficult to read on high-DPI displays.
2. The 27 x 27px title controls are visually tight and below a comfortable desktop target size.
3. There is no explicit `:focus-visible` treatment for keyboard users.
4. Muted labels rely on small size plus reduced contrast.
5. Constant liquid motion may be distracting even though reduced-motion preferences are respected.

## Priority Recommendations

### P1 — Highest impact

1. **Create one accent hierarchy.**
   - Keep the strongest glow on the LED and liquid surface.
   - Reduce the primary-card border opacity.
   - Make the pinned state neutral blue or white so it is not confused with quota status.

2. **Refine the material system.**
   - Reduce the nearly opaque panel background.
   - Use a darker translucent base, one restrained top highlight, and a softer shadow.
   - Remove one of the ambient blobs and lower the outer glow.

3. **Improve data typography.**
   - Use tabular numerals for percentages and countdowns.
   - Separate percentage and reset time into distinct visual weights.
   - Increase card labels to 11px and footer text to at least 10–11px.

4. **Differentiate error semantics.**
   - Use a neutral blue-gray or violet for connection errors.
   - Reserve red exclusively for exhausted quota.

### P2 — High-value polish

5. **Simplify title controls.**
   - Move language switching into the tray/context menu.
   - Keep pin, refresh, minimize, and close visible.
   - Increase controls to 30–32px with slightly smaller icons.

6. **Add meaningful motion instead of more constant motion.**
   - Refresh: rotate the refresh icon once, then settle.
   - Data update: count the percentage to its new value over 450–650ms.
   - Liquid level: use the existing spring-like rise, plus a brief surface ripple after update.
   - State change: cross-fade accent colors over 300–400ms.
   - Window entrance: subtle 6px rise and opacity reveal over 220ms.

7. **Make the liquid feel more premium.**
   - Slow the waves to roughly 5–7 seconds.
   - Reduce wave amplitude.
   - Add one occasional specular sweep across the glass, not a continuous shine animation.

8. **Replace footer copy with useful recency.**
   - Show “更新于 10:54” or “刚刚更新”.
   - During refresh, temporarily switch to a compact loading message.

### P3 — Optional finishing work

9. Add a faint texture/noise image at very low opacity to reduce flat digital gradients.
10. Make the primary card slightly taller and the plan card slightly quieter.
11. Add a visible keyboard focus ring using the current state color at reduced opacity.
12. Pause decorative animation while the window is unfocused or hidden to reduce CPU usage.

## Recommended Motion Budget

- Idle: only very slow liquid movement and a nearly imperceptible LED breath.
- User action: 120–180ms button feedback.
- Refresh: 500–700ms icon rotation and data transition.
- State change: 300–400ms color interpolation.
- Avoid simultaneous looping glow, wave, shine, and pulse animations.

## Evidence Limits

- The captured browser state cannot access the Electron preload bridge, so it displays fallback data.
- Keyboard navigation, actual Windows blur behavior, and GPU/CPU impact need verification in the running Electron window.
- This review identifies accessibility risks; it is not a full WCAG compliance assessment.
