# Plan: Enhance Category Card Opacity & Stability

## Objective

Update the `CategoryCard` component to ensure all subject cards have a rich, vibrant appearance (like the "Biology" card example) and maintain this appearance consistently, even when pressed.

## Changes

1.  **Increase Background Opacity**:
    - Currently: `15%` opacity (faint/pastel).
    - Target: `25%` opacity (richer, more visible color).
    - _Why_: This ensures every card (Math, Physics, etc.) has that distinct, solid pop of color that the Biology card had.

2.  **Enhance Corner Glow**:
    - Currently: `20%` opacity.
    - Target: `40%` opacity.
    - _Why_: This makes the corner "blob" clearly visible and decorative on all cards, creating that two-tone depth effect.

3.  **Stabilize Press Interaction**:
    - Currently: `activeOpacity={0.9}` (fades slightly when pressed).
    - Target: `activeOpacity={1}` (no fading).
    - _Why_: The user requested "same opacity when pressed down". This prevents the card from "winking" or fading out when touched, making it feel more solid.

## Implementation Steps

1.  Edit `src/components/CategoryCard.js`.
2.  Update `backgroundColor` logic.
3.  Update `cornerGlow` styled view opacity.
4.  Update `TouchableOpacity` prop `activeOpacity`.
