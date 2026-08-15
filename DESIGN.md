---
name: 27.12 Consulting
description: Бюро для fashion-брендов на маркетплейсах — от текущих продаж к управляемой чистой прибыли
colors:
  brass-gold: "#d4a748"
  ledger-navy: "#30345a"
  navy-soft: "#454a75"
  bone-cream: "#f2f2e8"
  espresso-ink: "#1c1817"
  ink-muted: "rgba(28, 24, 23, 0.64)"
  cream-muted: "rgba(242, 242, 232, 0.72)"
  hairline-on-cream: "rgba(28, 24, 23, 0.24)"
  hairline-on-navy: "rgba(242, 242, 232, 0.3)"
typography:
  display:
    fontFamily: "Playfair Display, serif"
    fontSize: "clamp(3rem, 9vh, 6.75rem)"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.02em"
  section-title:
    fontFamily: "Oswald, sans-serif"
    fontSize: "clamp(2.1rem, 5vw, 3.4rem)"
    fontWeight: 700
    lineHeight: 0.95
    letterSpacing: "-0.005em"
  heading:
    fontFamily: "Golos Text, sans-serif"
    fontWeight: 500
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Inter, sans-serif"
    fontWeight: 400
    lineHeight: 1.6
  numeral:
    fontFamily: "Jost, sans-serif"
    fontWeight: 400
rounded:
  card: "6px"
  pill: "999px"
spacing:
  section-x: "clamp(1.5rem, 4vw, 3rem)"
  section-y: "clamp(3.5rem, 9vw, 7rem)"
components:
  button-primary:
    backgroundColor: "{colors.ledger-navy}"
    textColor: "{colors.bone-cream}"
    rounded: "{rounded.pill}"
    padding: "0.9rem 2rem"
  button-primary-hover:
    backgroundColor: "{colors.navy-soft}"
  button-on-navy:
    backgroundColor: "{colors.bone-cream}"
    textColor: "{colors.espresso-ink}"
    rounded: "{rounded.pill}"
    padding: "0.9rem 2rem"
  button-on-navy-hover:
    backgroundColor: "{colors.navy-soft}"
    textColor: "{colors.bone-cream}"
  button-ghost:
    rounded: "{rounded.pill}"
    padding: "0.9rem 2rem"
  card:
    backgroundColor: "{colors.ledger-navy}"
    textColor: "{colors.bone-cream}"
    rounded: "{rounded.card}"
    padding: "2rem"
---

# Design System: 27.12 Consulting

## Overview

**Creative North Star: "The Trend Auditor"**

The system reads as a fashion trend-analyst's working ledger, not a marketing brochure: confident editorial typography borrowed from fashion print, disciplined by the exactness of an audit — numbered stages, SKU-level specificity, a single accent color spent deliberately rather than decoratively. Photography is full-bleed and unretouched-feeling; everything else (color, type, spacing) is structural and restrained so the photography and the numbers stay the loudest things on the page.

The page alternates bone-cream and ledger-navy full-bleed sections in sequence, so scrolling reads as turning pages in a bound dossier rather than scanning one flat surface. Cards always take the color opposite their section's background — never the same — so they never blend into the page they sit on.

**Key Characteristics:**
- Full-bleed alternating cream/navy sections, no in-between grays
- One accent color (brass gold), spent only on the single most important word or number per view
- Flat by default; shadow appears only as a hover response, never at rest
- Pill-shaped buttons against hard-edged rectangular cards and sections — the only curve in an otherwise rectilinear system

## Colors

Two structural surfaces (cream, navy) that swap section by section, one accent spent sparingly, and no gray scale in between.

### Primary
- **Brass Gold** (#d4a748): The only accent in the system. Reserved for the single emphasized word in the hero headline, the logo numeral, price call-outs, and the header ticker's separator dots. Never used as a background or for large surfaces.

### Secondary
- **Ledger Navy** (#30345a): The alternating "dark" section background and the default card fill on cream sections. Carries most of the page's structural weight.
- **Navy Soft** (#454a75): One step lighter than Ledger Navy. Hover state only — never a resting color.

### Neutral
- **Bone Cream** (#f2f2e8): The alternating "light" section background, and the card fill used inside navy sections (same value, reused as a light foreground). This is the page's true neutral — cream, not white.
- **Espresso Ink** (#1c1817): Primary text and icon color on cream surfaces.
- **Ink Muted** (rgba(28,24,23,.64)): Secondary/supporting text on cream surfaces (descriptions, captions).
- **Cream Muted** (rgba(242,242,232,.72)): Secondary/supporting text on navy surfaces — the navy equivalent of Ink Muted.
- **Hairline on Cream** (rgba(28,24,23,.24)) / **Hairline on Navy** (rgba(242,242,232,.3)): Section dividers and card borders, always 1px, never a filled stroke.

### Named Rules
**The Inverted Card Rule.** A card's fill is always the opposite of the section it sits in: navy cards on cream sections, cream cards on navy sections. A card never shares its section's background color.

**The One Accent Rule.** Brass Gold appears at most once or twice per screen — a headline word, a price, a logo mark. It is never a background, never a button fill, never applied to body text.

## Typography

**Display Font:** Playfair Display (serif, with system serif fallback)
**Section-Title Font:** Oswald (sans-serif, bold uppercase)
**Heading Font:** Golos Text (sans-serif)
**Body Font:** Inter (sans-serif)
**Numeral Font:** Jost (sans-serif, used only for the "27.12" logo mark)

**Character:** A magazine-style serif carries the one emotional headline per page; everything else — section titles, body copy, labels — is disciplined sans-serif. The pairing reads as "editorial feature, audit report underneath."

### Hierarchy
- **Display** (600, `clamp(3rem, 9vh, 6.75rem)`, line-height 1, Playfair Display): The hero headline only. One italic Brass Gold word inside it carries the emphasis.
- **Section-Title** (700, `clamp(2.1rem, 5vw, 3.4rem)`, line-height 0.95, Oswald, uppercase): Every section's `<h2>` ("ТРИ ФОРМАТА РАБОТЫ", "НАЧНИ С ОДНОГО ШАГА"). Centered, max-width 22ch, `text-wrap: balance`.
- **Heading** (500, Golos Text): Card and column titles (`<h3>`) inside services, team, project, and stage cards.
- **Body** (400, line-height 1.6, Inter): All paragraph copy. Descriptions inside cards run smaller (~0.9rem) than the hero's lead sentence (~1.15rem).
- **Label** (700, uppercase, letter-spacing 0.03–0.08em, Golos Text or Oswald depending on context): Eyebrows, service zones, format labels, the header ticker.

### Named Rules
**The One Serif Rule.** Playfair Display appears only in the hero headline and its italic accent word. Every other heading on the page is sans-serif — the serif is reserved for the single most important sentence on the site.

## Layout

Sections are full-bleed for background color but cap inner content at `max-width: 1200px`, centered, with horizontal padding `clamp(1.5rem, 4vw, 3rem)` and vertical padding `clamp(3.5rem, 9vw, 7rem)`. The hero is the one exception: full-width two-panel split (photo | navy text panel) with no max-width. Grids are simple `repeat(3, 1fr)` or `repeat(4, 1fr)` with a fixed gap (1.5–2.5rem), collapsing to a single column under 900px / 600px breakpoints. No masonry, no asymmetric spans — the grid is always regular.

## Elevation & Depth

Flat by default. Depth comes from the cream/navy section alternation itself, not from shadows or blur — cards are distinguished from their section by color inversion and a 1px hairline, not by elevation. The one exception is interaction feedback: format-tiles lift 
and cast a soft shadow on hover, and the sticky header uses a light `backdrop-filter: blur(8px)` over a translucent cream fill. Shadow is always a response to state, never a resting property.

### Shadow Vocabulary
- **Hover Lift** (`box-shadow: 0 16px 32px rgba(0,0,0,0.24)`): Format-tile hover only. Paired with a border-color shift to Brass Gold.

### Named Rules
**The Flat-At-Rest Rule.** Nothing casts a shadow while idle. Shadow appears only on `:hover` as direct feedback to a pointer, and disappears immediately after.

## Shapes

Two vocabularies that never mix: cards and sections are hard rectangles with a soft 6px radius; buttons are full pills (999px). The contrast is deliberate — structural content stays rectilinear like a ledger page, interactive calls-to-action are the only rounded, "grabbable" shape on the site. Section dividers are 1px hairlines, never thick rules. The logo's separator dots and the header ticker's `·` glyphs are the only circular decorative marks.

## Components

### Buttons
- **Shape:** Full pill (`border-radius: 999px`), padding `0.9rem 2rem` (small variant: `0.6rem 1.4rem`).
- **Primary** (`.btn-primary`): Ledger Navy background, Bone Cream text. Used for the main CTA ("Обсудить проект", "Заказать услугу").
- **On Navy** (`.btn-on-navy`): Bone Cream background, Espresso Ink text — the inverted primary, used when the button itself sits on a navy surface (hero).
- **Ghost** (`.btn-ghost`): No fill, `border: 1px solid currentColor`; hover fills an inset ring in currentColor. Used for secondary actions inside cards ("Заказать", "Подписаться").
- **Hover:** All variants lift `translateY(-2px)`; filled variants shift to Navy Soft.

### Cards / Containers
- **Corner Style:** 6px radius, always.
- **Background:** Follows the Inverted Card Rule — opposite of the section's background.
- **Border:** 1px hairline, color matched to what reads against the card's own fill (Hairline on Cream on light cards, Hairline on Navy on dark cards).
- **Internal Padding:** 2rem standard; compact variants (steps list) use 1.5rem.
- **Shadow Strategy:** None at rest; see Elevation.

### Navigation
- Sticky header, translucent cream with blur, 1px bottom hairline. Logo is a stacked lockup (gold numeral over tracked-out "CONSULTING" in Jost). A marquee ticker of section labels runs continuously behind/beside the logo, masked with a fade at both edges, pausing under `prefers-reduced-motion`.

### Signature Component: Section Curtain-Reveal
Every main section after the hero wipes into view via `clip-path` as it's scrolled into place (0% to 100% height reveal, plus a small upward settle), rather than appearing at once. Disabled entirely under `prefers-reduced-motion`.

## Do's and Don'ts

### Do:
- **Do** keep Brass Gold to one emphasis point per screen — a word, a number, a mark.
- **Do** invert card color against its section's background, every time.
- **Do** keep section `<h2>` titles in Oswald uppercase; keep Playfair Display exclusive to the hero.
- **Do** leave surfaces flat at rest; only add shadow as hover feedback.

### Don't:
- **Don't** introduce a gray scale — neutrals are cream and ink/cream-muted only, no mid-gray.
- **Don't** give a card the same fill as the section it sits in.
- **Don't** use Brass Gold as a background or button fill.
- **Don't** add a shadow that persists at rest; shadow is state-only.
