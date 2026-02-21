# Isometric City 🏙️

Welcome to the **Isometric City**, a high-performance web-based isometric city rendering engine. This project showcases a beautiful diorama featuring a data-driven map system, optimized for smooth interaction.

![City Preview](https://raw.githubusercontent.com/singhanat/isometric-city/main/assets/isometric_tiles-buildings_sample.png)

## ✨ Key Features

- **Data-Driven Architecture**: The entire city layout is loaded dynamically from a `city.json` file. This makes it incredibly easy to modify, expand, or completely redesign the city without touching the core rendering logic.
- **Perfect Z-Sorting**: Uses a precise isometric depth-sorting algorithm (x + y) to ensure that tall buildings, vehicles, and props overlap correctly regardless of the camera angle.
- **Smart Optimization**: Implements **Rendering Culling** to ensure high frame rates by only drawing sprites currently visible in the viewport.
- **Fluid Camera System**: Smooth panning (click and drag) and zooming (scroll wheel) to explore the city from any angle.
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

## 🗺️ Customizing the Map

You can easily design your own city by editing the `city.json` file. The file structure is clean and straightforward:

```json
{
  "size": 12,
  "tiles": [
    {
      "x": 0,
      "y": 0,
      "ground": "landscapeTiles_067.png",
      "building": "buildingTiles_001.png"
    }
  ]
}
```

- `size`: Defines the dimensions of the grid (e.g., 12x12).
- `tiles`: An array containing tile objects. specify `x` and `y` coordinates along with asset IDs for `ground`, `road`, `building`, `prop`, or `vehicle`.

## 🎨 Asset Credits
Built with ❤️ using assets by [Kenney.nl](https://kenney.nl).

---
*Developed as part of the Advanced Agentic Coding project.*
