# Isometric Mega City 🏙️

Welcome to the **Isometric Mega City**, a high-performance web-based isometric city rendering engine. This project showcases a vast, procedurally generated (or custom-built) diorama featuring thousands of tiles, optimized for smooth interaction.

![City Preview](https://raw.githubusercontent.com/singhanat/isometric-city/main/assets/isometric_tiles-buildings_sample.png)

## ✨ Key Features

- **Mega-Scale Kingdom**: An expansive **60x60 grid** containing over **3,600 tiles**, allowing for grand architectural designs.
- **Smart Optimization**: Implements **Rendering Culling** to ensure high frame rates by only drawing sprites currently visible in the viewport.
- **Fluid Camera System**: Smooth panning (click and drag) and zooming (scroll wheel) to explore the city from any angle.
- **Automatic Road Networking**: A structured grid system for roads that ensures logical connectivity across the city.
- **Aesthetic Assets**: Utilizes premium Kenney isometric assets for a polished, professional look.

## 🚀 Getting Started

### Prerequisites
You'll need a way to serve the files locally due to CORS restrictions with local assets. We recommend using `http-server`.

### Running the Project

#### On Windows:
Simply run the provided batch or PowerShell script:
```powershell
./run.ps1
```
or 
```cmd
run.bat
```
These scripts will start a local server and open your default browser automatically.

#### Manually:
1. Install a local server (e.g., `npm install -g http-server`).
2. Run it in the project root: `npx http-server`.
3. Open `http://localhost:8080` in your browser.

## 🛠️ Controls

- **Explore**: Click and drag to pan around the city.
- **Zoom**: Use the mouse wheel to zoom in for details or out for a bird's-eye view.
- **Reset**: Click the **Reset** button in the floating panel to return to the default view.
- **Randomize**: Generate a fresh layout with the **Randomize** button.

## 🎨 Asset Credits
Built with ❤️ using assets by [Kenney.nl](https://kenney.nl).

---
*Developed as part of the Advanced Agentic Coding project.*
