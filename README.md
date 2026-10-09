# Wedding invitation landing page — setup

This zip is a complete, standalone Next.js project — you don't need to run `create-next-app` separately.

## 1. Unzip and install
```bash
cd wedding-invite
npm install
```
(Make sure you `cd` into the folder that directly contains `package.json` — if you extracted the zip into a folder that's already called `wedding-invite`, you may end up with a nested `wedding-invite\wedding-invite` path; `cd` into the inner one.)

## 2. Add your images
Drop your two assets into `public/images/`:
- `background.jpg` — the cream/silk drape background
- `couple.png` — the couple illustration, ideally a **transparent-background PNG** so it sits cleanly over the backdrop like in your reference (no white box around it)

If your couple image has a solid background instead of transparency, either remove the background first (remove.bg or Photoshop) or place it inside a soft circular/arched frame — tell me which and I'll adjust `HeroInvite.tsx`.

## 3. Run it
```bash
npm run dev
```

## Notes on what's built in
- **Fonts**: Cinzel (small-caps display headings) + Cormorant Garamond (body), loaded via `next/font/google` — no extra setup needed, self-hosted automatically at build time.
- **Palette**: ivory/champagne background, maroon heading, muted gold accent — pulled straight from your reference image.
- **Motion**: the divider draws itself in, the heading and subheading fade up in sequence, and the couple portrait fades/scales in then floats gently — one signature animation (the soft gold shimmer sweeping across the background) rather than lots of small competing effects.
- **Accessibility**: respects `prefers-reduced-motion` (see `globals.css`), and text stays legible over the image via the ivory overlay wash.

## To extend
The hero is one `<section>`. Add more sections below it in `app/page.tsx` (e.g. countdown, venue map, RSVP form) — reuse `OrnamentalDivider` and the same `fadeUp`/`container` variants from `HeroInvite.tsx` to keep the motion language consistent.
