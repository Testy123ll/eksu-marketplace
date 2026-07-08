# BataMarket Design Tokens — Direction B (Vibrant Indigo & Mint)

This document contains the visual style tokens for BataMarket, selected and customized using Google Stitch. Refer to these tokens during development to maintain design consistency.

---

## 1. Color Palette (Dark Theme)

Our dark-theme palette is built to provide high contrast, high visual energy, and a premium mobile-first marketplace feel.

| Token Name | Tailwind Variable | Hex Code | Purpose / Usage |
| :--- | :--- | :--- | :--- |
| **Canvas** | `bg-canvas` | `#0B0F19` | The base page background color |
| **Surface Lowest** | `bg-surface-lowest` | `#0E0E10` | Embedded boxes or sections |
| **Surface Low** | `bg-surface-low` | `#1C1B1D` | Default listing/content feed container background |
| **Surface** | `bg-surface` | `#121214` | High-emphasis cards, popups, and search bars |
| **Surface High** | `bg-surface-high` | `#2A2A2C` | Modals, menu dropdowns |
| **Border** | `border-border` | `#27272A` | Default 1px borders (e.g. outline-variant) |
| **Primary (Indigo)** | `text-brand-indigo` / `bg-brand-indigo` | `#4F46E5` | Primary buttons, active tabs, highlights |
| **Secondary (Mint)** | `text-brand-mint` / `bg-brand-mint` | `#34D399` | Success states, Verified Student badge, trust points |
| **Accent / Warning** | `text-brand-amber` | `#F59E0B` | Boosted listings, alerts, attention items |
| **Text Primary** | `text-primary` | `#E5E1E4` | High-contrast title and body text |
| **Text Muted** | `text-muted` | `#94A3B8` | Subtitles, labels, secondary metadata |

---

## 2. Typography

We pair **Syne** (for bold, geometric headlines) and **Inter** (for clean, highly readable functional copy).

### Web Font Sources
*   **Syne**: Google Fonts
    *   URL: `https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&display=swap`
*   **Inter**: Google Fonts
    *   URL: `https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap`

### Font Scale & Config
*   **Headline XL** (Hero headers)
    *   Font Family: `Syne`
    *   Weight: `700` (Bold)
    *   Size: `2.5rem` (40px)
    *   Letter Spacing: `-0.02em`
*   **Headline LG** (Section title)
    *   Font Family: `Syne`
    *   Weight: `600` (Semi-bold)
    *   Size: `2rem` (32px)
*   **Headline MD** (Card title)
    *   Font Family: `Syne`
    *   Weight: `600` (Semi-bold)
    *   Size: `1.5rem` (24px)
*   **Body LG** (Large paragraphs)
    *   Font Family: `Inter`
    *   Weight: `400`
    *   Size: `1.125rem` (18px)
*   **Body MD** (Default text/chat messages)
    *   Font Family: `Inter`
    *   Weight: `400`
    *   Size: `1rem` (16px)
*   **Label MD** (Card metadata / form labels)
    *   Font Family: `Inter`
    *   Weight: `600` (Semi-bold)
    *   Size: `0.875rem` (14px)
    *   Letter Spacing: `0.01em`
*   **Label SM** (Micro-tags / badges / dates)
    *   Font Family: `Inter`
    *   Weight: `700` (Bold)
    *   Size: `0.75rem` (12px)

---

## 3. Shapes & Roundness

Direction B uses soft, modern corner roundness to feel approachable yet technical.

*   **Small Elements** (Chips, tags, badges): `0.25rem` (`rounded-sm` / 4px)
*   **Buttons & Inputs**: `0.5rem` (`rounded-md` / 8px)
*   **Cards & Content Blocks**: `0.75rem` (`rounded-lg` / 12px)
*   **Floating Navigation / Actions**: `9999px` (`rounded-full` / Pill-shape)

---

## 4. Spacing Scale

Our grid is aligned to a 4px baseline rhythm.

*   **Section Gap**: `40px` (`my-10`)
*   **Card Padding**: `16px` (`p-4`)
*   **Mobile Margin**: `16px` (`mx-4`)
*   **Desktop Margin**: `32px` (`mx-8`)
*   **Element Gap**: `12px` (`gap-3`)
