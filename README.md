# Grand Luxury Interactive Christmas Tree 🎄✨

A high-fidelity 3D interactive Christmas experience built with React 19, Three.js (R3F), and Tailwind CSS. Features a "Trump-style" luxury aesthetic with deep emeralds and gold, AI gesture control, and physics-based animations.

## 🚀 How to Run

1.  **Install Dependencies**
    Open your terminal in this project folder and run:
    ```bash
    npm install
    ```

2.  **Start Development Server**
    Run the local server:
    ```bash
    npm run dev
    ```

3.  **Open in Browser**
    Click the link shown in the terminal (usually `http://localhost:5173`).

## 🎮 Controls

*   **Allow Camera Access**: Required for gesture control.
*   **✋ Open Hand**: **UNLEASH CHAOS** (Explodes the tree into particles).
*   **✊ Closed Hand**: **FORM TREE** (Assembles the tree back to shape).
*   **👋 Move Hand**: Rotates the camera view.
*   **Mouse Drag**: You can also rotate the view with your mouse if hands are not detected.

## 🛠️ Tech Stack

*   **Core**: React 19, TypeScript, Vite
*   **3D**: Three.js, React Three Fiber, Drei
*   **Effects**: React Postprocessing (Bloom)
*   **Styling**: Tailwind CSS
*   **AI/Vision**: MediaPipe (Hand Tracking)
*   **State**: Zustand

## ✨ Features

*   **Dual-Position System**: Particles morph between a chaotic sphere and a formed cone.
*   **Instanced Rendering**: Optimized rendering for hundreds of ornaments.
*   **Custom Shaders**: Sparkling emerald foliage effect.
*   **Physics Weights**: Different ornaments (heavy gifts vs. light balls) float differently.
