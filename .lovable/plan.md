

# Liquid Glass Design System for Beat Beat

## What We're Building
Apply a frosted glass / liquid glass aesthetic across all components and pages. This means translucent backgrounds, strong backdrop blurs, subtle borders with white/lavender opacity, and soft glowing shadows — creating a layered, depth-rich feel reminiscent of Apple's visionOS or iOS liquid glass style.

## Approach

### 1. Global Glass Utilities — `src/index.css`
Add reusable utility classes:
- `.glass` — base frosted glass: `bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg`
- `.glass-card` — card variant with slightly more opacity and a subtle lavender tint
- `.glass-strong` — higher opacity for prominent elements like CTAs
- Adjust CSS variables: make `--card` and `--background` slightly more transparent-friendly

### 2. Card Component — `src/components/ui/card.tsx`
Replace the solid `bg-card` with glass styling: semi-transparent background (`bg-card/40`), `backdrop-blur-xl`, a thin `border border-white/15`, and a soft `shadow-lg shadow-black/5`.

### 3. Bottom Navigation — `src/components/BottomNav.tsx`
Already has `backdrop-blur-md`. Enhance with stronger blur (`backdrop-blur-2xl`), lower card opacity (`bg-card/30`), and a top border using `border-white/15`.

### 4. Button Component — `src/components/ui/button.tsx`
- Primary variant: add a subtle glass sheen with `backdrop-blur-sm` and a light `shadow-lg`
- Outline/ghost variants: use glass-like translucent backgrounds on hover
- Add a new `glass` variant: fully transparent with blur and white border

### 5. Dashboard — `src/pages/Dashboard.tsx`
- Add a subtle gradient background (lavender to transparent)
- "Start Scan" CTA: glass-strong treatment with a soft glow shadow
- Scan history cards already use `<Card>` so they inherit the glass card style
- Badge components: add slight transparency

### 6. Onboarding — `src/pages/Onboarding.tsx`
- Add animated gradient orbs in the background for depth
- Cards in profile/tutorial steps get glass treatment
- Heart icon container: glass circle with glow

### 7. Scan Page — `src/pages/Scan.tsx`
- Position prompt card: glass panel
- Recording phase: the pulsing orb already has translucency; enhance with blur rings
- Analyzing phase: glass container around the loader
- Result cards: glass treatment (they use inline styles, will wrap in glass containers)

### 8. Settings — `src/pages/Settings.tsx`
- All setting cards get the glass treatment via the updated Card component

### 9. Background Treatment — `src/index.css` / Layout
Add a subtle fixed background with soft gradient blobs (lavender/purple) to give the glass something to blur against, making the effect visible.

## Technical Details

Files to modify:
- `src/index.css` — add glass utilities + background gradient blobs
- `src/components/ui/card.tsx` — glass defaults
- `src/components/ui/button.tsx` — glass variant + updated primary
- `src/components/BottomNav.tsx` — enhanced glass nav
- `src/pages/Dashboard.tsx` — glass CTA + subtle tweaks
- `src/pages/Onboarding.tsx` — background orbs + glass cards
- `src/pages/Scan.tsx` — glass containers for each phase
- `src/pages/Settings.tsx` — minor tweaks (mostly inherits from Card)
- `src/components/ui/badge.tsx` — slight transparency adjustments

