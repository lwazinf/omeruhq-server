# OmeruHQ — Brand & Design System Reference

> **Audience:** Designers, developers, and AI agents working on `hq.omeru.io`.  
> **Scope:** Every visual, motion, and interaction decision used in the current production codebase.  
> **Last updated:** June 2026

---

## Table of Contents

1. [Brand Philosophy](#1-brand-philosophy)
2. [Color Palette](#2-color-palette)
3. [Typography](#3-typography)
4. [Layout & Grid](#4-layout--grid)
5. [Surfaces & Texture](#5-surfaces--texture)
6. [Component Library](#6-component-library)
7. [Dark Mode Surfaces](#7-dark-mode-surfaces)
8. [Motion & Animation](#8-motion--animation)
9. [Scroll Behaviour](#9-scroll-behaviour)
10. [Micro-interactions & Cursor](#10-micro-interactions--cursor)
11. [Page Transitions](#11-page-transitions)
12. [Navigation](#12-navigation)
13. [Modals & Overlays](#13-modals--overlays)
14. [Storefront Patterns](#14-storefront-patterns)
15. [Accordion Pattern](#15-accordion-pattern)
16. [Badges & Status Indicators](#16-badges--status-indicators)
17. [WhatsApp UI Elements](#17-whatsapp-ui-elements)
18. [Error & Feedback Styling](#18-error--feedback-styling)
19. [Consent & Legal UI](#19-consent--legal-ui)
20. [Responsive Breakpoints](#20-responsive-breakpoints)
21. [Package Stack](#21-package-stack)
22. [Implementation Cheatsheet](#22-implementation-cheatsheet)

---

## 1. Brand Philosophy

Omeru exists at the intersection of South African hustle and precision software. The design language reflects this duality:

- **Lime + Black** = energy and authority. Not playful, not corporate — both at once.
- **Off-white ground** = warmth without sterility. Paper-like, not clinical.
- **Syne headings** = loud, confident, geometric. Letters that own the page.
- **DM Sans body** = readable at any size, unpretentious, human.
- **Motion** = purposeful and physical. Everything has weight. Nothing pops in from nowhere.
- **Texture** = a subtle tile overlay on dark surfaces stops the UI from feeling flat or digital-first.

**Design north star:** A Black taxi driver selling vetkoek should feel as capable as an enterprise merchant. Premium without being foreign.

---

## 2. Color Palette

### CSS Custom Properties (`app/globals.css`)

```css
:root {
  --lime:      #C8F135;   /* Primary accent — lime green */
  --lime-dark: #a8d420;   /* Hover state for lime */
  --lime-muted:#e8f9a8;   /* Very light lime for tinted backgrounds */
  --black:     #0a0a0a;   /* Near-black — surfaces, text, CTAs */
  --off-white: #f5f4ef;   /* Page background — warm, not cold */
  --warm-gray: #e8e6de;   /* Dividers, subtle borders */
  --mid-gray:  #9b9990;   /* Secondary text, placeholders, labels */
  --dark-gray: #1a1a18;   /* Body copy on dark surfaces */
  --card-bg:   #f0ede5;   /* Inactive accordion card background */
}
```

### Palette Reference

| Token | Hex | Usage |
|---|---|---|
| `--lime` | `#C8F135` | Primary CTA bg, active indicators, checkmarks, links on dark |
| `--lime-dark` | `#a8d420` | Hover state for lime buttons, open-status badges |
| `--lime-muted` | `#e8f9a8` | Tinted pill chips, very subtle highlights |
| `--black` | `#0a0a0a` | Dark sections, active cards, text on light bg, primary CTAs |
| `--off-white` | `#f5f4ef` | Page background, modal body, nav when scrolled |
| `--warm-gray` | `#e8e6de` | Section dividers |
| `--mid-gray` | `#9b9990` | Captions, labels, nav links, placeholder text |
| `--dark-gray` | `#1a1a18` | Body copy, card descriptions |
| `--card-bg` | `#f0ede5` | Inactive accordion cards |

### In-Context Colour Usage

**On dark (`--black`) surfaces:**
- Body text: `rgba(255,255,255,0.55)` — light 300 weight
- Heading: `white`
- Muted labels: `rgba(255,255,255,0.35)`
- Borders: `rgba(255,255,255,0.08)` to `rgba(255,255,255,0.15)`
- Dividers: `rgba(255,255,255,0.07)`
- Lime glow radial: `rgba(200,241,53,0.06)` to `rgba(200,241,53,0.10)`

**On light (`--off-white`) surfaces:**
- Body text: `var(--dark-gray)` / `var(--black)`
- Muted: `var(--mid-gray)`
- Borders: `rgba(0,0,0,0.06)` to `rgba(0,0,0,0.12)`
- Dividers: `rgba(0,0,0,0.07)`

**Status colours (inline — no separate tokens):**

| State | Background | Text/Border |
|---|---|---|
| Open/Active | `rgba(90,122,0,0.25)` | `#a8d420` / border `rgba(168,212,32,0.3)` |
| Closed/Inactive | `rgba(255,255,255,0.06)` | `rgba(255,255,255,0.3)` |
| Error | `rgba(192,57,43,0.08)` | `#c0392b` |
| Lime accent on dark | `rgba(200,241,53,0.12)` | `var(--lime)` / border `rgba(200,241,53,0.2)` |
| Lime accent on light | `rgba(200,241,53,0.2)` | `var(--lime-dark)` |

---

## 3. Typography

### Font Stack

```css
/* Loaded via Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');

--font-display: 'Syne', sans-serif;   /* All headings, stats, prices, logos */
--font-body:    'DM Sans', sans-serif; /* All body, UI, buttons, labels */
```

### Display Scale (CSS classes)

```css
.display-xl {
  font-family: var(--font-display);
  font-size: clamp(52px, 7vw, 108px);
  font-weight: 800;
  line-height: 0.92;         /* Tight — intentional, creates visual compression */
  letter-spacing: -0.03em;
}

.display-lg {
  font-family: var(--font-display);
  font-size: clamp(36px, 4.5vw, 72px);
  font-weight: 700;
  line-height: 1.0;
  letter-spacing: -0.025em;
}

.display-md {
  font-family: var(--font-display);
  font-size: clamp(24px, 3vw, 44px);
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.02em;
}
```

### Stat Numbers

```css
.stat-number {
  font-family: var(--font-display);
  font-size: clamp(40px, 5vw, 80px);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1;
}
```

### Body Type Scale (inline styles)

| Role | Size | Weight | Color |
|---|---|---|---|
| Hero body | 18–20px | 300 | `rgba(255,255,255,0.45)` |
| Section body | 16px | 300 | `var(--mid-gray)` or body |
| Card body | 14–15px | 300–400 | `var(--dark-gray)` |
| Caption / label | 12–13px | 300 | `var(--mid-gray)` |
| Eyebrow label | 10–11px | 600 | uppercase, `letter-spacing: 0.08–0.12em` |
| Price | 14–18px | 800 | `var(--black)` / `var(--lime)` on dark |
| Nav link | 14px | 400 | `var(--mid-gray)` → `var(--black)` on hover |
| Button text | 13–15px | 500–600 | depends on variant |

### Logo Typography

```
omeru.  — Syne, weight 800, letter-spacing -0.02em
         — The period is coloured var(--lime)
         — On dark: white + lime dot
         — On light: var(--black) + lime dot
```

---

## 4. Layout & Grid

### Container

```css
.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 clamp(20px, 4vw, 48px);
  width: 100%;
}
```

### Named Grid Classes

| Class | Desktop columns | Description |
|---|---|---|
| `.steps-grid` | 4-col @ 1200px+ | How It Works steps |
| `.features-grid` | 3-col @ 1200px+ | Feature cards |
| `.testimonials-grid` | 4-col @ 1200px+ | Testimonial cards |
| `.pricing-grid` | 3-col @ 1200px+ | Pricing tiers |
| `.footer-grid` | `2fr 1fr 1fr 1fr` @ 1200px+ | Footer columns |
| `.stats-grid` | 4-col @ 1200px+ | Stat counters |

### Spacing Rhythm

Section padding uses `clamp()` throughout. Common patterns:

```
Vertical section padding:  clamp(80px, 10vh, 140px)
Nav vertical padding:      clamp(14px, 2vh, 18px)
Hero top padding:          clamp(32px, 5vh, 56px)
Card padding:              40px (desktop), proportional on mobile
```

---

## 5. Surfaces & Texture

### The Tile Texture

Every dark surface uses a repeating tile image overlay to break up flat black and add physical depth. This is a core Omeru visual signature.

```jsx
/* Applied on: dark section headers, InviteModal header, accordion active cards,
   storefront hero, ConsentBanner, store info CTA card, StoresAccordion */

<div style={{
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  backgroundImage: "url('/bg-tile.jpg')",
  backgroundSize: '500px 333px',
  backgroundRepeat: 'repeat',
  mixBlendMode: 'screen',
  filter: 'invert(1)',
  opacity: 0.06,        /* Range: 0.05–0.09 depending on context */
  zIndex: 0,
}} />
```

**Key**: `mixBlendMode: 'screen'` + `filter: 'invert(1)'` together create a white-on-black screen blend that lifts the texture off the dark background without altering hue.

### Film Grain Noise

A global SVG-based fractal noise overlay sits at `z-index: 9999` over the entire page:

```css
.noise {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9999;
  opacity: 0.03;
  background-image: url("data:image/svg+xml,...fractalNoise baseFrequency='0.85' numOctaves='4'...");
}
```

Always include `<div className="noise" />` as first child of every page body.

### Lime Radial Glow

Appears in hero sections and dark stat areas. Creates ambient warmth without being literal:

```jsx
/* Bottom-right glow — hero/stats sections */
<div style={{
  position: 'absolute',
  bottom: '-40%',
  right: '10%',
  width: '50%',
  height: '110%',
  background: 'radial-gradient(ellipse at center, rgba(200,241,53,0.06) 0%, transparent 65%)',
  pointerEvents: 'none',
}} />
```

### Border Radius Scale

| Element | Radius |
|---|---|
| Full pill (buttons, tags) | `100px` / `9999px` |
| Modal card | `28px` |
| Content cards | `20–24px` |
| Pricing cards | `28px` |
| Feature/accordion cards | `18–20px` |
| Small chips / badges | `8px` |
| Inputs | `12px` |
| Icon boxes | `10–14px` |
| Consent banner | `16px` |
| Store CTA card | `16px` |

### Box Shadows

| Context | Shadow |
|---|---|
| `.card:hover` | `0 20px 60px rgba(0,0,0,0.08)` |
| Pricing card hover | `0 24px 64px rgba(0,0,0,0.08)` |
| Modal | `0 40px 100px rgba(0,0,0,0.28)` |
| Consent banner | `0 16px 56px rgba(0,0,0,0.45), 0 2px 12px rgba(0,0,0,0.3)` |
| Storefront hero image | `0 20px 60px rgba(0,0,0,0.4)` |
| `.btn-lime:hover` | `0 10px 32px rgba(200,241,53,0.35)` — lime glow |
| Bottom WhatsApp CTA | `0 12px 40px rgba(0,0,0,0.18)` |

---

## 6. Component Library

### Buttons

#### `btn-lime` — Primary CTA

```css
.btn-lime {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 16px 32px;
  background: var(--lime);
  color: var(--black);
  border-radius: 100px;
  font-family: var(--font-body);
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: background 0.2s ease,
              transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1),  /* spring overshoot */
              box-shadow 0.22s ease;
  text-decoration: none;
  white-space: nowrap;
}
.btn-lime:hover {
  background: var(--lime-dark);
  transform: translateY(-3px);
  box-shadow: 0 10px 32px rgba(200, 241, 53, 0.35);  /* lime glow shadow */
}
.btn-lime:active {
  transform: scale(0.96) !important;
  box-shadow: none !important;
  transition-duration: 0.07s !important;  /* snap to press instantly */
}
/* Mobile */
@media (max-width: 860px) {
  .btn-lime { padding: 13px 24px; font-size: 14px; }
}
```

#### `btn-outline` — Secondary CTA

```css
.btn-outline {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 15px 30px;
  background: transparent;
  color: var(--black);
  border-radius: 100px;
  font-family: var(--font-body);
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  border: 1.5px solid rgba(0, 0, 0, 0.2);
  transition: border-color 0.2s ease,
              transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1),
              background 0.2s ease;
  text-decoration: none;
  white-space: nowrap;
}
.btn-outline:hover {
  border-color: var(--black);
  background: rgba(0, 0, 0, 0.04);
  transform: translateY(-3px);
}
.btn-outline:active {
  transform: scale(0.96) !important;
  transition-duration: 0.07s !important;
}
/* On dark surfaces, override border and text color inline */
/* border: rgba(255,255,255,0.25), color: rgba(255,255,255,0.8) */
```

#### Hero Primary Button (custom inline — not `.btn-lime`)

Used in the hero section for the merchant CTA:

```jsx
style={{
  display: 'inline-flex',
  alignItems: 'center',
  gap: 10,
  background: 'var(--black)',
  color: 'white',
  borderRadius: 12,   /* ← 12px, not pill — deliberate */
  padding: 'clamp(12px,1.5vw,15px) clamp(16px,2vw,22px)',
  fontWeight: 600,
  fontSize: 'clamp(13px,1.2vw,14px)',
  textDecoration: 'none',
  transition: 'background 0.2s, transform 0.15s',
}}
/* hover: background '#222', translateY(-2px) */
```

### Cards

#### `.card` — Base card

```css
.card {
  background: white;
  border-radius: 24px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  overflow: hidden;
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1),
              box-shadow 0.35s ease;
}
.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
}
a.card:active,
button.card:active {
  transform: scale(0.98) translateY(-2px) !important;
  transition-duration: 0.08s !important;
}
```

#### `.pricing-card` — Pricing tier card

```css
.pricing-card {
  padding: 40px;
  border-radius: 28px;
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.07);
  transition: transform 0.35s ease, box-shadow 0.35s ease;
}
.pricing-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.08);
}
.pricing-card.featured {
  background: var(--black);
  color: white;
  border-color: transparent;
}
```

### Pill / Tag

```css
.pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 100px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(12px);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--mid-gray);
}
/* On dark: border: rgba(255,255,255,0.1), color: rgba(255,255,255,0.4), bg: rgba(255,255,255,0.05) */
```

### Filter Tab Pill (Accordion Tabs)

These use a shared `layoutId` for the Framer Motion morphing background:

```jsx
/* Active pill background — morphs between buttons via layoutId */
<motion.span
  layoutId="store-accordion-pill"   /* or "stores-accordion-pill" */
  style={{
    position: 'absolute',
    inset: 0,
    borderRadius: 100,
    background: 'var(--black)',
    zIndex: 0,
  }}
  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
/>

/* Active state text properties */
fontFamily: 'var(--font-display)'  /* Syne — switches on active */
fontWeight: 700
fontSize: 13
letterSpacing: '-0.01em'
color: 'white'

/* Count badge */
fontSize: 10, fontWeight: 600
background: active ? 'rgba(200,241,53,0.2)' : 'rgba(0,0,0,0.07)'
color: active ? 'var(--lime)' : 'var(--mid-gray)'
borderRadius: 100, padding: '1px 7px'
```

### Dividers

```jsx
/* Standard horizontal rule */
<div style={{ height: 1, background: 'rgba(0,0,0,0.07)', width: '100%' }} />

/* On dark: background: rgba(255,255,255,0.07) */
/* Between sections: margin: '28px 0' or '36px 0' or '40px 0' */
```

### Form Inputs

```css
/* Base input style (used in InviteModal) */
{
  width: '100%',
  padding: '11px 14px',
  borderRadius: 12,
  border: '1.5px solid rgba(0,0,0,0.12)',
  fontSize: 14,
  fontFamily: 'inherit',
  outline: 'none',
  background: 'white',
  color: 'var(--black)',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s',
}
/* Focus: borderColor → 'var(--lime-dark)' */
/* Blur:  borderColor → 'rgba(0,0,0,0.12)' */
```

---

## 7. Dark Mode Surfaces

Omeru doesn't use a theme toggle — instead, sections deliberately alternate between light and dark. Dark surfaces are `var(--black)` (`#0a0a0a`).

### When to use dark

- Hero sections
- Section headers and full-bleed banners
- Featured pricing card
- Accordion active card state
- InviteModal header
- Storefront hero
- Consent banner
- Navigation (transparent over dark hero, transitions to off-white frosted when scrolled)
- CTA cards inside light pages ("Ready to order?" box)
- Footer

### Adapting existing tokens on dark surfaces

```
Text:           white / rgba(255,255,255,0.55) / rgba(255,255,255,0.35)
Borders:        rgba(255,255,255,0.08–0.18)
Dividers:       rgba(255,255,255,0.07)
Overlays:       rgba(255,255,255,0.07–0.12)
Lime accent:    --lime (#C8F135) — unchanged, creates contrast
Lime bg tint:   rgba(200,241,53,0.12)
```

---

## 8. Motion & Animation

### Core Spring Config

Shared spring used across accordions, filter pills, and interactive buttons:

```js
const spring = { type: 'spring', stiffness: 380, damping: 32 };
```

### Easing Curves

| Name | Curve | Used for |
|---|---|---|
| Expo out | `[0.16, 1, 0.3, 1]` | Most reveals, accordion expand, modal enter, page slide |
| Spring overshoot | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Button hover lift (slight overshoot above target) |
| Smooth out | `easeOut` | Page fade, section fade opacity |
| Linear | `linear` | Ticker/marquee animation |

### Framer Motion: Standard Reveal

Used via `RevealOnScroll` / inline `useInView`:

```js
initial={{ opacity: 0, y: 28 }}
animate={inView ? { opacity: 1, y: 0 } : {}}
transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1], delay }}
/* margin: '-60px' on useInView — fires slightly before element enters viewport */
```

### GenieReveal — Scroll-Linked Scale

Applied to major section blocks. As the block scrolls into view, it scales from compressed to full size with a spring drag. **Desktop only — mobile gets static render.**

```js
/* From: */ { scaleX: 0.91, scaleY: 0.86, y: 64 }
/* To:   */ { scaleX: 1,    scaleY: 1,    y:  0 }

/* Springs: */
y:      { stiffness: 140, damping: 30 }
scaleX: { stiffness: 110, damping: 27 }
scaleY: { stiffness:  80, damping: 24 }

transformOrigin: 'bottom center'   /* compresses from bottom, not centre */
```

### SectionFade — Scroll-Out Fade

Applied to hero section. As the user scrolls away, the section fades out:

```js
/* Fade starts at 40% scroll through section, fully gone at 100% */
opacity: useTransform(scrollYProgress, [0, 0.4, 1], [1, 1, 0])
/* Desktop only */
```

### AnimatePresence: Filter Changes

Accordion filter tab changes cross-fade the entire item track:

```jsx
<AnimatePresence mode="wait" initial={false}>
  <motion.div
    key={activeFilter}   /* ← key change triggers exit/enter */
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.18 }}
  >
```

### Stagger: Accordion Card Entrance

```js
/* Each card within the track staggered by index */
transition={{ duration: 0.42, delay: i * 0.055, ease: [0.16, 1, 0.3, 1] }}
initial={{ opacity: 0, y: 18 }}
animate={{ opacity: 1, y: 0 }}
```

### Multi-Step Modal Slide

Direction-aware slide between form steps:

```js
const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? 48 : -48, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (dir) => ({ x: dir > 0 ? -48 : 48, opacity: 0 }),
};
transition: { duration: 0.26, ease: [0.16, 1, 0.3, 1] }
```

### Accordion Card Width Transition

Pure CSS transition — not Framer Motion:

```css
width: isActive ? 'clamp(260px, 34vw, 380px)' : 'clamp(88px, 11vw, 130px)';
transition: width 0.55s cubic-bezier(0.16, 1, 0.3, 1);
```

### Opacity Sequencing (Anti-Squash Pattern)

When content inside an expanding container is conditionally rendered, text renders in a narrow space. **Always mount all layers; control visibility with opacity + transition-delay:**

```js
/* Rule: content opacity delay on enter = width transition duration × ~0.85 */

/* Active gradient (enter after 280ms) */
transition: isActive
  ? 'opacity 0.3s ease 0.28s'   /* delayed entry */
  : 'opacity 0.12s ease'         /* instant exit */

/* Active badges (enter after 440ms) */
transition: isActive
  ? 'opacity 0.25s ease 0.44s'
  : 'opacity 0.08s ease'

/* Active text bottom (enter after 480ms — longest) */
transition: isActive
  ? 'opacity 0.28s ease 0.48s'
  : 'opacity 0.08s ease'

/* Inactive vertical name (re-enter after 280ms once collapsed) */
transition: isActive
  ? 'opacity 0.12s ease'
  : 'opacity 0.28s ease 0.28s'
```

### CSS Animations

```css
/* Floating elements */
@keyframes float-up   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
@keyframes float-down { 0%,100%{transform:translateY(0)} 50%{transform:translateY(8px)}  }
.float-up   { animation: float-up   6s ease-in-out infinite; }
.float-down { animation: float-down 5s ease-in-out infinite 1s; }

/* Slow spin */
@keyframes rotate-slow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
.rotate-slow { animation: rotate-slow 20s linear infinite; }

/* Marquee ticker */
@keyframes ticker { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
.ticker-inner { display: inline-flex; animation: ticker 28s linear infinite; }
```

---

## 9. Scroll Behaviour

### Lenis — Smooth Scroll

Library: `lenis@^1.3.18`

```js
const lenis = new Lenis({
  duration: 1.4,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),  /* exponential out */
  smoothWheel: true,
  wheelMultiplier: 0.9,
  touchMultiplier: 1.5,
});
```

Exposed on `window.__lenis` so any component can:
- **Programmatic scroll:** `window.__lenis?.scrollTo(element, { offset: -80, duration: 1.4 })`
- **Stop/start:** `window.__lenis?.stop()` / `window.__lenis?.start()`

**Always stop Lenis when modals open:**

```js
useEffect(() => {
  if (open) {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    (window as any).__lenis?.stop();
  } else {
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    (window as any).__lenis?.start();
  }
}, [open]);
```

### GSAP ScrollTrigger Integration

```js
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);
```

### Scroll-to-anchor (Nav)

```js
function scrollToSection(href) {
  const el = document.getElementById(href.replace('#', ''));
  const lenis = window.__lenis;
  if (lenis?.scrollTo) {
    lenis.scrollTo(el, { offset: -80, duration: 1.4 });
  } else {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
```

---

## 10. Micro-interactions & Cursor

### Custom Cursor

Two-layer cursor system (desktop only):

| Layer | Element | Style |
|---|---|---|
| Dot | 10×10px circle | `background: var(--lime)`, `mixBlendMode: 'multiply'`, instant GSAP `0.1s` follow |
| Ring | 32×32px border circle | `border: 1.5px solid rgba(0,0,0,0.3)`, `0.12` lerp follow each frame |

**On hover of `a`, `button`, or `[data-hover]`:**
- Dot: `scale(3)` via GSAP `power2.out` — lime dot blooms to fill the ring
- Ring: `scale(0)` — ring disappears
- On leave: both reset over 0.3s

Trigger hover states on elements: add `data-hover` attribute.

### Nav Link Underline Sweep

```css
.nav-link { position: relative; }
.nav-link::after {
  content: '';
  position: absolute;
  bottom: -2px; left: 0;
  width: 0; height: 1px;
  background: var(--black);
  border-radius: 1px;
  transition: width 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.nav-link:hover::after { width: 100%; }
```

### Button Press State

All primary buttons snap to scale(0.96) on active with an extremely short `0.07s` transition for physical feedback:

```css
:active {
  transform: scale(0.96) !important;
  transition-duration: 0.07s !important;
}
```

### Arrow / Icon Button (Accordion nav)

```jsx
<motion.button
  whileHover={{ scale: 1.1 }}
  whileTap={{ scale: 0.9 }}
  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
/>

/* WhatsApp arrow in accordion below-card */
<motion.a
  whileHover={{ scale: 1.08, rotate: -8 }}
  whileTap={{ scale: 0.92 }}
  transition={spring}
/>
```

### Success Checkmark Animation

Spring scale-in from 0:

```jsx
<motion.div
  initial={{ scale: 0 }}
  animate={{ scale: 1 }}
  transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
/>
```

### Progress Bar Fill (Modal)

```jsx
<motion.div
  animate={{ width: i <= step ? '100%' : '0%' }}
  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
  style={{ height: '100%', background: 'var(--lime)', borderRadius: 2 }}
/>
```

---

## 11. Page Transitions

Defined in `app/template.tsx`. Re-mounts on every route change.

```jsx
// Pure opacity fade — no y movement
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.35, ease: 'easeOut' }}
>
  {children}
</motion.div>
```

**Design principle:** Keep page transitions invisible. Users should feel a clean cut, not a choreographed animation between pages. The 350ms opacity fade is the maximum acceptable duration here.

---

## 12. Navigation

### States

| State | Background | Text |
|---|---|---|
| Over dark hero, not scrolled | `transparent` | `rgba(255,255,255,0.65)` |
| Scrolled > 60px | `rgba(245,244,239,0.92)` + `backdrop-filter: blur(20px)` | `var(--mid-gray)` → `var(--black)` |
| Mobile menu open | Full-screen `var(--off-white)` | `var(--black)` |

### Nav initial entrance

```jsx
<motion.nav
  initial={{ y: -16, opacity: 0 }}
  animate={{ y: 0, opacity: 1 }}
  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
/>
```

### Mobile Menu

Full-screen reveal with `clipPath`:

```jsx
initial={{ opacity: 0, clipPath: 'inset(0 0 100% 0)' }}
animate={{ opacity: 1, clipPath: 'inset(0 0 0% 0)' }}
exit={{ opacity: 0, clipPath: 'inset(0 0 100% 0)' }}
transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
```

Nav items stagger in:

```jsx
initial={{ opacity: 0, x: -14 }}
animate={{ opacity: 1, x: 0 }}
transition={{ delay: 0.06 + i * 0.06, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
```

Nav item typography (mobile): `font-family: var(--font-display)`, `font-size: clamp(26px, 7vw, 38px)`, `font-weight: 700`

### Hamburger Icon

Three bars (`height: 1.5px`): middle bar fades; top rotates 45° + translates Y 6.5px; bottom rotates -45° + translates Y -6.5px.

---

## 13. Modals & Overlays

### InviteModal (Multi-step apply form)

**Trigger:** `window.dispatchEvent(new CustomEvent('omeru:invite'))` — fire from any component on any page. The modal is a singleton in `app/layout.tsx`.

**Structure:**

```
Fixed centering shell (pointer-events:none, flex center)
  └── Relative wrapper (pointer-events:auto, maxWidth:540px)
        ├── Close button — floats 44px above card (position:absolute, top:-44, right:0)
        └── Modal card (maxHeight:90vh, flex column)
              ├── Dark header (black + tile texture + progress bars)
              ├── Scrollable body (overflowY:auto, flex:1)
              └── Footer (borderTop 1px, padding 16px 28px 24px)
```

**Close button (external):**

```jsx
style={{
  width: 36, height: 36,
  borderRadius: '50%',
  border: '1px solid rgba(255,255,255,0.25)',
  background: 'rgba(255,255,255,0.12)',
  backdropFilter: 'blur(8px)',
}}
```

**Backdrop:**

```jsx
background: 'rgba(0,0,0,0.65)'
backdropFilter: 'blur(8px)'
```

**Modal enter animation:**

```jsx
initial={{ opacity: 0, scale: 0.95, y: 20 }}
animate={{ opacity: 1, scale: 1, y: 0 }}
exit={{ opacity: 0, scale: 0.95, y: 12 }}
transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
```

**Progress bars (3 steps):** `height: 3px`, `borderRadius: 2`, background track `rgba(255,255,255,0.12)`, fill `var(--lime)`, animated with `width: 0% → 100%`.

**Step form fields:** Three steps collecting: store info → social reach → contact details. See [InviteModal.tsx](/OmeruIO/components/InviteModal.tsx).

**Form step 1 — Your store:** business name, company reg (grid 2-col), sells type, category (+Other field), team size, province (all 9 SA provinces)

**Form step 2 — Your reach:** social platforms (multi-select), combined following, monthly orders, heard from (+Other field)

**Form step 3 — Almost there:** name, email, WhatsApp (required — used for follow-up), notes

**Keyboard:** `Escape` closes. Body scroll locked (Lenis + `overflow:hidden` on `body` and `html`).

**"Other" field pattern:** AnimatePresence slide-in `height: 0 → auto` with `marginTop: 0 → 10px` when "Other" pill is selected. Text input `autoFocus` on reveal.

---

## 14. Storefront Patterns

### `[handle]` page layout

Two-column layout: hero strip (dark, full-width) + sidebar TOC + main content.

**Hero strip:**

```
background: var(--black)
paddingBottom: 64px
Tile texture overlay: opacity 0.07
Lime glow: bottom-right radial, rgba(200,241,53,0.07), 50% × 130%
```

**Store logo:**

```jsx
width/height: clamp(80px, 12vw, 120px)
borderRadius: 24px
border: '2px solid rgba(255,255,255,0.1)'
boxShadow: '0 20px 60px rgba(0,0,0,0.4)'
```

**Status badges (open/closed):**

```jsx
/* Open */
background: 'rgba(90,122,0,0.25)'
color: '#a8d420'
border: '1px solid rgba(168,212,32,0.3)'

/* Closed */
background: 'rgba(255,255,255,0.06)'
color: 'rgba(255,255,255,0.3)'
border: '1px solid rgba(255,255,255,0.08)'

/* Shared: fontSize:11, fontWeight:600, letterSpacing:'0.08em',
           textTransform:'uppercase', borderRadius:100, padding:'4px 12px' */
```

**Section heads (`SectionHead`):**

```
n="01" — number label (Syne, weight 800, lime-dark color)
title  — heading text (Syne, display-md)
```

**Sidebar TOC:** `position: sticky; top: 100px`. Scrollspy links in 11px uppercase Syne.

**Hours table:**

```jsx
/* Header row */
background: 'rgba(0,0,0,0.03)'
th: fontFamily: var(--font-display), fontWeight:700, fontSize:11
    borderBottom: '1px solid rgba(0,0,0,0.07)'

/* Data rows */
borderBottom: '1px solid rgba(0,0,0,0.05)'
Closed hours: color var(--mid-gray)
Open hours: color var(--dark-gray)
```

**"Ready to order?" CTA card (sidebar):**

```jsx
background: 'var(--black)'
borderRadius: 16
padding: '18px 16px'
/* + tile texture overlay */
```

---

## 15. Accordion Pattern

Used in both `StoreAccordion` (products/services) and `StoresAccordion` (directory).

### Key Dimensions

```
Active card width:   clamp(260px, 34vw, 380px)
Inactive card width: clamp(88px, 11vw, 130px)
Card height:         clamp(280px, 36vw, 440px)
Width transition:    0.55s cubic-bezier(0.16, 1, 0.3, 1)
Gap between cards:   10px
Below-card row:      height: 38px (fixed — prevents layout shift)
```

### Card States

```
Inactive: background var(--card-bg), image opacity 0.85
Active:   background var(--black), image opacity 0.5 + dark gradient overlay
Hovered (inactive): image opacity 1, scale(1.04), box-shadow 0 12px 40px rgba(0,0,0,0.12)
```

### Below-card elements

- **Arrow button:** 38×38px circle, `var(--black)` bg, lime arrow SVG. `whileHover: { scale: 1.08, rotate: -8 }`.
- **Active CTA pill:** `height:38px`, flex-1, `var(--black)` bg, item name left + ZAR price right in `var(--lime)`.
- **Inactive price:** Syne, 14px, weight 800, `var(--black)`.

### ZAR Formatting

```js
const formatZAR = (n) =>
  n === 0 ? 'Free'
  : new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      maximumFractionDigits: 0,
    }).format(n);
```

### Duration Formatting

```js
const formatDuration = (min) => {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
};
```

---

## 16. Badges & Status Indicators

### Eyebrow Pill (section labels)

```jsx
/* On dark */
display: 'inline-block', padding: '4px 12px', borderRadius: 100
fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase'
background: 'rgba(200,241,53,0.12)', color: 'var(--lime)'
border: '1px solid rgba(200,241,53,0.2)'

/* On dark (muted variant) */
background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.4)'
border: '1px solid rgba(255,255,255,0.1)'
```

### Product / Service type badge

```jsx
fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase'
borderRadius: 8, padding: '3px 9px'

/* Product: */ background: 'rgba(255,255,255,0.9)', color: 'var(--black)'
/* Service: */ background: 'rgba(200,241,53,0.9)', color: 'var(--black)'
/* Out of stock: */ background: 'rgba(0,0,0,0.6)', color: 'rgba(255,255,255,0.6)'
```

### Consent / Cookie banner dot indicator

```jsx
width: 7, height: 7, borderRadius: '50%'
background: 'var(--lime)'
boxShadow: '0 0 0 3px rgba(200,241,53,0.15)'  /* lime ring glow */
```

---

## 17. WhatsApp UI Elements

### Message bubble (incoming)

```css
.wa-bubble {
  background: white;
  border-radius: 18px 18px 18px 4px;  /* bottom-left corner flat */
  padding: 12px 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.07);
}
```

### Message bubble (outgoing)

```css
.wa-bubble-right {
  background: #dcf8c6;  /* WhatsApp green read receipt colour */
  border-radius: 18px 18px 4px 18px;  /* bottom-right corner flat */
  padding: 12px 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  margin-left: auto;
}
```

---

## 18. Error & Feedback Styling

### Inline form error (modal)

```jsx
<motion.p
  initial={{ opacity: 0, y: -4 }}
  animate={{ opacity: 1, y: 0 }}
  style={{
    fontSize: 12,
    color: '#c0392b',
    fontWeight: 500,
    padding: '8px 12px',
    background: 'rgba(192, 57, 43, 0.08)',  /* muted red wash */
    borderRadius: 8,
    marginBottom: 12,
  }}
/>
```

### Success state

```jsx
/* Lime circle with animated checkmark */
width: 60, height: 60, borderRadius: '50%'
background: 'var(--lime)'

/* SVG check path */
<path d="M5 13l4 4L19 7" stroke="var(--black)" strokeWidth="2.5" strokeLinecap="round"/>

/* Enter animation */
initial={{ scale: 0 }}
animate={{ scale: 1 }}
transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
```

### "Nothing here" empty state

```jsx
/* Accordion empty */
fontSize: 15, color: 'var(--mid-gray)', fontWeight: 300, padding: '32px 0'

/* Stores empty */
fontSize: 17, color: 'var(--mid-gray)', fontWeight: 300
+ a .btn-lime link below
```

---

## 19. Consent & Legal UI

### Consent Banner

Slides up from bottom-left. **Never full-width.** Contained to 360px to stay unobtrusive.

```jsx
position: 'fixed', bottom: 24, left: 24
width: 'min(360px, calc(100vw - 48px))'
background: 'var(--black)'
borderRadius: 16
border: '1px solid rgba(255,255,255,0.09)'
boxShadow: '0 16px 56px rgba(0,0,0,0.45), 0 2px 12px rgba(0,0,0,0.3)'
padding: '22px 22px 20px'
zIndex: 9999

/* Show/hide via transform */
transform: visible ? 'translateY(0)' : 'translateY(calc(100% + 32px))'
opacity: visible ? 1 : 0
transition: 'transform 0.45s cubic-bezier(0.16,1,0.3,1), opacity 0.3s ease'
```

**Buttons inside banner:**

- Decline: transparent, `border: 1px solid rgba(255,255,255,0.12)`, text `rgba(255,255,255,0.45)`, `borderRadius: 10`
- Accept: `background: var(--lime)`, `color: var(--black)`, `borderRadius: 10`, `fontWeight: 700`

---

## 20. Responsive Breakpoints

| Breakpoint | Width | What changes |
|---|---|---|
| Desktop XL | ≥ 1200px | 4-col grids, footer 2fr+3×1fr |
| Desktop | ≥ 861px | Nav links visible, hamburger hidden |
| Tablet | ≤ 1024px | features 2-col, testimonials 2-col |
| Mobile large | ≤ 860px | Nav collapses, buttons shrink to 13px/24px |
| Mobile | ≤ 768px | Container padding 24px, steps 2-col, stats 2-col |
| Mobile small | ≤ 480px | All grids 1-col, display text shrinks, pill shrinks |

### Container padding

```css
padding: 0 clamp(20px, 4vw, 48px);
/* 20px at narrow, scales to 48px at wide */
```

### GenieReveal / SectionFade

Both effects are **disabled on mobile** (`< 768px`) via `window.matchMedia` check inside `useEffect`. Mobile renders static layout — no scroll-linked transforms.

---

## 21. Package Stack

### Production Dependencies

| Package | Version | Role |
|---|---|---|
| `next` | 16.1.6 | App Router, ISR, server components |
| `react` | 19.2.3 | UI framework |
| `framer-motion` | ^12.36.0 | Animations, layout transitions, spring physics |
| `gsap` | ^3.14.2 | Cursor animation, ScrollTrigger integration |
| `@gsap/react` | ^2.1.2 | GSAP React hooks |
| `lenis` | ^1.3.18 | Smooth scroll (Lenis v1) |
| `@prisma/client` | ^6.19.2 | ORM — database queries |
| `prisma` | ^6.19.2 | Schema + migrations |
| `@supabase/supabase-js` | ^2.108.2 | Supabase client (available but Prisma is primary) |
| `tailwindcss` | ^4 | Utility classes (minimal use — mostly inline styles) |

### Dev Dependencies

| Package | Version | Role |
|---|---|---|
| `typescript` | ^5 | Type safety |
| `@types/react` | ^19 | React types |
| `eslint-config-next` | 16.1.6 | Linting |
| `@tailwindcss/postcss` | ^4 | PostCSS Tailwind v4 |

### Install commands

```bash
# Core UI stack
npm install framer-motion lenis gsap @gsap/react

# Data layer
npm install @prisma/client @supabase/supabase-js
npm install -D prisma

# Styling
npm install tailwindcss @tailwindcss/postcss
```

---

## 22. Implementation Cheatsheet

### New page checklist

```jsx
// 1. Include noise overlay
<div className="noise" />

// 2. Wrap content sections in GenieReveal
<GenieReveal><YourSection /></GenieReveal>

// 3. Dark hero sections need tile texture
<div style={{ position:'absolute', inset:0, backgroundImage:"url('/bg-tile.jpg')",
  backgroundSize:'500px 333px', backgroundRepeat:'repeat',
  mixBlendMode:'screen', filter:'invert(1)', opacity:0.07, pointerEvents:'none' }} />

// 4. Add lime glow radial to dark sections
<div style={{ position:'absolute', bottom:'-40%', right:'10%',
  width:'50%', height:'110%',
  background:'radial-gradient(ellipse at center, rgba(200,241,53,0.07) 0%, transparent 65%)',
  pointerEvents:'none' }} />

// 5. Eyebrow label before section headings
<span style={{ /* eyebrow pill */ }}>Category</span>
<h2 className="display-md">Heading</h2>
<p style={{ fontSize:16, fontWeight:300, color:'var(--mid-gray)' }}>Subtext</p>
```

### New CTA that should open the invite modal

```jsx
// Client component
<button onClick={() => window.dispatchEvent(new CustomEvent('omeru:invite'))}>
  Apply for invite
</button>

// Server component — use InviteTrigger
import InviteTrigger from '@/components/InviteTrigger';
<InviteTrigger className="btn-lime">Apply for invite</InviteTrigger>
```

### Interactive element that needs cursor scale

```jsx
<a data-hover href="...">Link text</a>
<button data-hover>Button text</button>
```

### ZAR price display

```js
const formatZAR = (n) =>
  n === 0 ? 'Free'
  : new Intl.NumberFormat('en-ZA', {
      style: 'currency', currency: 'ZAR', maximumFractionDigits: 0,
    }).format(n);
```

### Scroll lock for any overlay/modal

```js
// Open
document.body.style.overflow = 'hidden';
document.documentElement.style.overflow = 'hidden';
(window as any).__lenis?.stop();

// Close
document.body.style.overflow = '';
document.documentElement.style.overflow = '';
(window as any).__lenis?.start();
```

### Shared spring config

```js
const spring = { type: 'spring', stiffness: 380, damping: 32 };
```

### Standard divider

```jsx
<div style={{ height: 1, background: 'rgba(0,0,0,0.07)' }} />
/* dark surface: rgba(255,255,255,0.07) */
```

---

*This document is generated from live codebase analysis and should be updated whenever the design system evolves. For questions, reference the source files: `app/globals.css`, `app/template.tsx`, `components/SmoothScroll.tsx`, `components/GenieReveal.tsx`, `components/CustomCursor.tsx`, `components/InviteModal.tsx`.*
