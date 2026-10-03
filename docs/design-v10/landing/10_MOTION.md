# 10 — Motion Design & Choreography (V10)

## 1. Cinematic Philosophy
Motion in Cashly V10 is deliberate, subtle, and serves the financial narrative:
- **Micro-interactions (100–180ms)**: Button hover lift (`translateY(-2px)`), card elevation shifts, toggle transitions.
- **Major transitions (250–400ms)**: Tab switching across the 5 pillars, mobile sub-screens, and lifecycle stages using standard cubic ease curves.
- **Narrative choreography (500–800ms)**: Initial hero fade-up, trajectory curve morphing when dragging the Money Twin restraint slider.

## 2. Reduced Motion
All animations respect the user's OS-level preferences:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```
No auto-playing or looping animations are used.
