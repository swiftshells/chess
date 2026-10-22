# Offline 1 vs 1 Local Mode (Pass & Play on One Phone)

An intuitive, tabletop-inspired offline two-player mode enabling two friends to play chess on a single phone or tablet with a fixed top-down view, untimed casual flow, mirrored HUD indicators, and full tactile 3D piece animations.

## User Review & Critical Decisions

> [!IMPORTANT]
> Based on your interactive clarification choices:

- **Confirmed Perspective & Camera**: **Fixed top-down view for both players simultaneously**. In offline 1 vs 1 mode, the camera automatically sets an overhead tabletop perspective (`top_down`) so the phone can be placed flat between two players, just like a physical wooden travel board. Players can still freely orbit or switch back to 3D angle via the bottom dock if desired.
- **Confirmed Timing & Pace**: **Untimed casual mode with turn counter**. Eliminates timer pressure so players can pass the device comfortably. The interface prominently features an alternating turn indicator ("White's Turn" / "Black's Turn"), total move count, captured pieces for both sides, and check notifications.
- **Title Screen CTA**: A dedicated **"1 vs 1 Local (Pass & Play)"** action button added directly to the main Title Screen hero actions and navigation row for immediate one-tap offline play.

---

## 1. Overview & Core Concept

### What It Does
Allows two players to share a single smartphone, tablet, or laptop without needing an internet connection, room codes, or separate accounts. Players take turns tapping pieces and making legal moves on the 3D Nordic wooden board.

### Key Use Cases
- Sitting across from a friend at a cafe, park, train, or airplane with the phone resting between you.
- Teaching or playing casual games without internet access or account logins.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Starting Local 1 vs 1**:
   - On the Title Screen, tap **"Pass & Play (1 vs 1 Local)"**.
   - The game immediately launches into the tabletop overhead perspective without any network requests or waiting screens.

2. **Gameplay on a Single Phone**:
   - The board sits centered in the viewport.
   - **Opposing Player HUD**:
     - Top of screen: Black Player badge, captured white pieces, active turn status (rotated or clearly oriented for the player sitting opposite).
     - Bottom of screen: White Player badge, captured black pieces, active turn status.
   - **Turn Transition Feedback**:
     - When White makes a move, a tactile wooden sound triggers, the piece glides into place, and the indicator shifts to "Black's Turn".
     - Check / checkmate alerts are instantly announced on the board with illuminated king tiles.

3. **In-Game Bottom Dock**:
   - Clean collapsible dock with Camera toggle (Top-down tabletop / 3D angle), Move Undo (take back accidental mis-taps), Restart Game, Resign, and Main Menu.

4. **Game Over & Rematch**:
   - When checkmate or stalemate is reached, the result modal offers an instant one-tap "Rematch" (swapping piece colors automatically or keeping current sides) and "Exit to Menu".

### Visual Identity
- Consistent Scandinavian Nordic Wood palette: oiled birch light pieces, smoked walnut dark pieces, brass inlays, and warm ambient studio lighting.
- Tabletop top-down framing optimized for touch targets ($\ge 44\text{px}$) across standard smartphone screen sizes ($360\text{px}$–$430\text{px}$ width).

---

## 3. Key Product Decisions & Trade-Offs

| Decision | Chosen Approach | Rationale |
| :--- | :--- | :--- |
| **Default Camera Angle** | Overhead Tabletop (`top_down`) | Matches physical board ergonomics when a phone is laid flat on a table between two seated players. |
| **Time Controls** | Untimed with Move Counter | User confirmed preference; prevents anxiety while passing the phone back and forth. |
| **Undo Support** | Available in Local Mode | In casual pass-and-play, accidental screen touches on small phone screens are common; single-tap undo provides a forgiving, friendly experience. |
| **Offline Independence** | Zero Network Calls | Runs entirely client-side using `chess.js` and Three.js so it functions in airplane mode or with no connectivity. |

---

## 4. Technical Architecture

```
┌────────────────────────────────────────────────────────┐
│                   MAIN TITLE SCREEN                    │
│   [Play vs AI]   [1 vs 1 Local (Pass & Play)]   [Rooms]│
└───────────────────────────┬────────────────────────────┘
                            │ (Taps "1 vs 1 Local")
┌───────────────────────────▼────────────────────────────┐
│                  LOCAL PASS & PLAY MODE                │
│                                                        │
│   ┌────────────────────────────────────────────────┐   │
│   │ Top HUD: Black Player (Oriented for Opponent)  │   │
│   ├────────────────────────────────────────────────┤   │
│   │                                                │   │
│   │       Three.js Overhead Tabletop Board         │   │
│   │         - Tap to select & move                 │   │
│   │         - Parabolic move kinematics            │   │
│   │         - Untimed casual play                  │   │
│   │                                                │   │
│   ├────────────────────────────────────────────────┤   │
│   │ Bottom HUD: White Player                       │   │
│   ├────────────────────────────────────────────────┤   │
│   │ Pinned Dock: Undo · Top/3D View · Resign · Menu│   │
│   └────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────┘
```

### Component & State Changes:
- **`src/types/chess.ts`**: Verify `local_pass` is fully supported across game modes and history logs.
- **`src/components/TitleScreen.tsx`**: Add prominent **"1 vs 1 Local (Pass & Play)"** CTA button in the main hero actions.
- **`src/components/GameHud.tsx`**: Enhance the layout for `local_pass` mode with top/bottom player banners and "Pass & Play · Move X" status.
- **`src/App.tsx`**: Add `handleStartLocalPass()` handler that sets `gameMode = 'local_pass'`, sets camera to `top_down`, resets clocks to untimed, and configures clean turn handling with single-move undo.

---

## 5. Execution Steps

1. Add `onStartLocalPass` to `TitleScreen.tsx` with a dedicated button and icon.
2. Update `App.tsx` to handle starting, playing, and resetting `local_pass` mode.
3. Optimize `GameHud.tsx` for tabletop pass-and-play on mobile viewports.
4. Verify with `lint_applet` and `compile_applet`.
