---
name: Liquid Glass
colors:
  surface: '#faf9fe'
  surface-dim: '#dad9df'
  surface-bright: '#faf9fe'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f3f8'
  surface-container: '#eeedf3'
  surface-container-high: '#e9e7ed'
  surface-container-highest: '#e3e2e7'
  on-surface: '#1a1b1f'
  on-surface-variant: '#414755'
  inverse-surface: '#2f3034'
  inverse-on-surface: '#f1f0f5'
  outline: '#717786'
  outline-variant: '#c1c6d7'
  surface-tint: '#005bc1'
  primary: '#0058bc'
  on-primary: '#ffffff'
  primary-container: '#0070eb'
  on-primary-container: '#fefcff'
  inverse-primary: '#adc6ff'
  secondary: '#4c4aca'
  on-secondary: '#ffffff'
  secondary-container: '#6664e4'
  on-secondary-container: '#fffbff'
  tertiary: '#ba0034'
  on-tertiary: '#ffffff'
  tertiary-container: '#e51245'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a41'
  on-primary-fixed-variant: '#004493'
  secondary-fixed: '#e2dfff'
  secondary-fixed-dim: '#c2c1ff'
  on-secondary-fixed: '#0c006a'
  on-secondary-fixed-variant: '#3631b4'
  tertiary-fixed: '#ffdada'
  tertiary-fixed-dim: '#ffb3b5'
  on-tertiary-fixed: '#40000c'
  on-tertiary-fixed-variant: '#920027'
  background: '#faf9fe'
  on-background: '#1a1b1f'
  surface-variant: '#e3e2e7'
typography:
  display:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 34px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  unit: 8px
  container-padding: 24px
  gutter: 16px
  stack-gap: 12px
  glass-padding: 20px
---

## Brand & Style

This design system embodies a premium, high-fidelity aesthetic inspired by modern "Liquid Glass" interfaces. The brand personality is sophisticated, fluid, and technologically advanced, aiming to evoke a sense of depth and tactile luxury. 

The visual style leverages **Glassmorphism** as its core foundation, utilizing heavy backdrop blurs, multi-layered translucency, and spectral highlight gradients. The UI feels less like a flat plane and more like a series of suspended glass plates. This creates an atmosphere of "digital craftsmanship" where every element feels polished, refractive, and responsive to light.

## Colors

The palette is designed to interact with light. In **Light Mode**, we use a base of "Vibrant Silver"—a high-white surface with 80-90% opacity and subtle blue tints to simulate frozen glass. **Dark Mode** transitions to "Midnight Slate," utilizing deep charcoals with high-saturation glows.

- **Primary:** An electric blue used for key actions and focal points.
- **Secondary:** A rich violet for supplementary information and brand accents.
- **Gradients:** Surfaces should rarely be flat. Use 45-degree linear gradients that transition from the primary color to a lighter, more desaturated version of itself to simulate "liquid" flow.
- **Glass Tinting:** Every glass surface should have a 1px inner border (stroke) at 20% white to simulate the edge of a glass pane.

## Typography

This design system utilizes **Inter** to mimic the systematic, clean precision of SF Pro. The typography scale relies on tight letter spacing for headlines to create a "locked-in" editorial feel. 

For display text, use a subtle text-shadow or a "vibrant" blending mode when placed over glass surfaces to maintain legibility. Body text should maintain a high contrast ratio against the blurred background. Always prioritize vertical rhythm by aligning to a 4px baseline grid.

## Layout & Spacing

The layout philosophy follows a **Fluid Grid** model with generous safe areas. Elements are treated as floating "islands" rather than edge-to-edge containers. 

- **Breakpoints:** Mobile (under 600px), Tablet (600px - 1024px), Desktop (1025px+).
- **Margins:** On mobile, use 16px side margins. On desktop, increase to 40px or use a centered 1200px max-width container.
- **Rhythm:** Use an 8px spacing system for all padding and margins. Glass containers should feature internal padding of at least 20px to allow the background blur to be appreciated without crowding content.

## Elevation & Depth

Depth is the defining characteristic of this system. Rather than standard dropshadows, we use **Stacking Glass Tiers**:

1.  **Level 0 (Background):** A vibrant, out-of-focus mesh gradient (Primary/Secondary colors).
2.  **Level 1 (Main Canvas):** A large glass sheet with `backdrop-filter: blur(20px)`.
3.  **Level 2 (Cards/Modals):** Elevated glass with `backdrop-filter: blur(40px)` and a subtle shadow (0px 10px 30px rgba(0,0,0,0.05)).
4.  **Level 3 (Popovers/Buttons):** Highest blur density and a dual-stroke edge (one white 10% inner, one black 5% outer).

All elevated elements should have a "Specular Highlight"—a very faint white-to-transparent gradient coming from the top-left corner at a 15% opacity.

## Shapes

The shape language is defined by **Extreme Roundness**. Every container, button, and input must feel organic and "liquid." 

Standard components use a 24px (1.5rem) radius. Large containers and main glass panels use a 40px (2.5rem) radius. Small interactive elements like checkboxes or tags use a fully "pill-shaped" (circular end) approach. Avoid sharp corners entirely to maintain the soft, liquid-glass aesthetic.

## Components

- **Buttons:** Use a "Liquid Gradient" fill (Primary to Secondary). On hover, increase the brightness and add a 10px outer glow of the primary color.
- **Glass Cards:** Must include a 1px white border at 15% opacity and `backdrop-filter: blur(30px)`.
- **Inputs:** Backgrounds should be 5% white (light mode) or 5% black (dark mode) with a soft inner shadow to create a "recessed glass" look.
- **Lists:** Use separator lines that are 1px thick, spanning 90% of the width, using a "vibrant" blend mode so they disappear into the background blur.
- **Progress Bars:** Should look like a hollow glass tube with a neon-glowing liquid filling it.
- **Segmented Controls:** The active state should be a high-blur glass "pill" that slides smoothly behind the text labels.