class AssetManager {
    constructor() {
        this.sheets = new Map();
        this.sprites = new Map();
        this.totalToLoad = 0;
        this.loadedCount = 0;
    }

    async loadSheet(name, xmlPath, imgPath) {
        this.totalToLoad++;
        try {
            const [xmlResponse, img] = await Promise.all([
                fetch(xmlPath).then(res => res.text()),
                this.loadImage(imgPath)
            ]);

            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlResponse, "text/xml");
            const subTextures = xmlDoc.getElementsByTagName("SubTexture");

            for (let st of subTextures) {
                const spriteName = st.getAttribute("name");
                const x = parseInt(st.getAttribute("x"));
                const y = parseInt(st.getAttribute("y"));
                const width = parseInt(st.getAttribute("width"));
                const height = parseInt(st.getAttribute("height"));

                this.sprites.set(spriteName, {
                    img,
                    x, y, width, height,
                    sheetName: name
                });
            }

            this.loadedCount++;
            return true;
        } catch (error) {
            console.error(`Failed to load sheet ${name}:`, error);
            return false;
        }
    }

    loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }

    get progress() {
        return this.totalToLoad === 0 ? 1 : this.loadedCount / this.totalToLoad;
    }

    getSprite(name) {
        return this.sprites.get(name);
    }
}

class IsometricRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.tileWidth = 132;
        this.tileHeight = 66;
        this.offsetX = 0;
        this.offsetY = 0;
        this.zoom = 0.8;

        // Interaction state
        this.isDragging = false;
        this.lastX = 0;
        this.lastY = 0;

        this.setupInteraction();
    }

    setupInteraction() {
        const handleStart = (e) => {
            this.isDragging = true;
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            this.lastX = clientX;
            this.lastY = clientY;
        };

        const handleMove = (e) => {
            if (!this.isDragging) return;
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;

            const dx = clientX - this.lastX;
            const dy = clientY - this.lastY;

            this.offsetX += dx;
            this.offsetY += dy;

            this.lastX = clientX;
            this.lastY = clientY;
        };

        const handleEnd = () => {
            this.isDragging = false;
        };

        this.canvas.addEventListener('mousedown', handleStart);
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleEnd);

        this.canvas.addEventListener('touchstart', handleStart);
        window.addEventListener('touchmove', handleMove);
        window.addEventListener('touchend', handleEnd);

        this.canvas.addEventListener('wheel', (e) => {
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            const nextZoom = this.zoom * delta;
            if (nextZoom > 0.3 && nextZoom < 2) {
                this.zoom = nextZoom;
            }
            e.preventDefault();
        }, { passive: false });
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    resetView(mapSize) {
        this.zoom = 0.4; // Zoom out more for the bigger city
        this.offsetX = this.canvas.width / 2;
        this.offsetY = - (this.tileHeight * mapSize * this.zoom) / 4; // Start near the top
    }

    worldToScreen(x, y) {
        return {
            x: (x - y) * (this.tileWidth / 2) * this.zoom + this.offsetX,
            y: (x + y) * (this.tileHeight / 2) * this.zoom + this.offsetY
        };
    }

    drawSprite(sprite, gridX, gridY, zOffset = 0) {
        if (!sprite) return;

        const pos = this.worldToScreen(gridX, gridY);
        const w = sprite.width * this.zoom;
        const h = sprite.height * this.zoom;

        // Alignment: Center bottom of sprite to isometric tile center
        const drawX = pos.x - w / 2;
        const drawY = pos.y - h + (this.tileHeight * this.zoom / 2) - (zOffset * this.zoom);

        // Optimization: Culling (strict)
        if (drawX + w < 0 || drawX > this.canvas.width ||
            drawY + h < 0 || drawY > this.canvas.height) {
            return;
        }

        this.ctx.drawImage(
            sprite.img,
            sprite.x, sprite.y, sprite.width, sprite.height,
            drawX, drawY,
            w, h
        );
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

class City {
    constructor(size) {
        this.size = size;
        this.grid = [];
        this.generate();
    }

    generate() {
        this.grid = [];
        for (let x = 0; x < this.size; x++) {
            this.grid[x] = [];
            for (let y = 0; y < this.size; y++) {
                // Island base shape
                const isIsland = (x >= 2 && x <= 8 && y >= 2 && y <= 8) || (x === 5 && y === 9);
                if (isIsland) {
                    this.grid[x][y] = {
                        ground: "landscapeTiles_067.png", // Clean flat sand/beige base
                        road: null,
                        building: null,
                        prop: null,
                        vehicle: null
                    };
                } else {
                    this.grid[x][y] = null;
                }
            }
        }

        // Road Layout (T-shape)
        // Horizontal main
        for (let x = 2; x <= 8; x++) {
            this.grid[x][4].road = "cityTiles_070.png";
        }
        // Vertical branch
        for (let y = 5; y <= 9; y++) {
            this.grid[5][y].road = "cityTiles_019.png";
        }
        // Junction
        this.grid[5][4].road = "cityTiles_033.png";

        // Corners/Ends
        this.grid[2][4].road = "cityTiles_070.png"; // Straight end
        this.grid[8][4].road = "cityTiles_070.png"; // Straight end

        // Buildings (Matching Sample precisely)
        // Top Left Cluster
        this.grid[2][2].building = "buildingTiles_001.png"; // Beige tall
        this.grid[2][3].building = "buildingTiles_002.png"; // Beige tall
        this.grid[3][2].building = "buildingTiles_007.png"; // Red tall
        this.grid[3][3].building = "buildingTiles_008.png"; // Red tall

        // Mid-Back
        this.grid[4][2].building = "buildingTiles_044.png"; // Beige small
        this.grid[5][2].building = "buildingTiles_043.png"; // Grey shop
        this.grid[6][2].building = "buildingTiles_038.png"; // Green awning shop

        // Modern/Right
        this.grid[7][2].building = "buildingTiles_011.png"; // Blue modern
        this.grid[7][3].building = "buildingTiles_012.png"; // Blue modern

        // Foreground Area
        this.grid[4][5].building = "buildingTiles_010.png"; // Red brick
        this.grid[4][6].building = "buildingTiles_014.png"; // Modern

        this.grid[6][5].building = "buildingTiles_017.png"; // Beige
        this.grid[6][6].building = "buildingTiles_005.png"; // Red modern small

        // Props & Details
        this.grid[7][4].vehicle = "carGreen2_000.png";
        this.grid[3][4].vehicle = "carRed1_000.png";
        this.grid[4][4].vehicle = "police_NE.png";
        this.grid[6][4].vehicle = "ambulance_NE.png";
        this.grid[5][7].vehicle = "taxi_NE.png";

        // Shrubs
        this.grid[6][3].prop = "cityDetails_010.png";
        this.grid[8][5].prop = "cityDetails_010.png";
        this.grid[8][6].prop = "cityDetails_010.png";
        this.grid[4][8].prop = "cityDetails_010.png";

        // Specific detail on road branch
        this.grid[5][5].vehicle = "carSilver1_004.png"; // facing SE
    }
}

const assets = new AssetManager();
const canvas = document.getElementById('cityCanvas');
const renderer = new IsometricRenderer(canvas);
const citySize = 12; // Slightly larger for padding
let city = new City(citySize);
const loadingOverlay = document.getElementById('loading-overlay');

async function init() {
    window.addEventListener('resize', () => renderer.resize());
    renderer.resize();
    renderer.resetView(citySize);

    const sheets = [
        { name: 'base', xml: 'assets/isometric_tiles-base/landscapeTiles_sheet.xml', img: 'assets/isometric_tiles-base/landscapeTiles_sheet.png' },
        { name: 'city', xml: 'assets/isometric_tiles-city/cityTiles_sheet.xml', img: 'assets/isometric_tiles-city/cityTiles_sheet.png' },
        { name: 'buildings', xml: 'assets/isometric_tiles-buildings/buildingTiles_sheet.xml', img: 'assets/isometric_tiles-buildings/buildingTiles_sheet.png' },
        { name: 'details', xml: 'assets/isometric_tiles-city/cityDetails_sheet.xml', img: 'assets/isometric_tiles-city/cityDetails_sheet.png' },
        { name: 'cars', xml: 'assets/isometric_vehicles/sheet_allCars.xml', img: 'assets/isometric_vehicles/sheet_allCars.png' }
    ];

    for (let s of sheets) {
        await assets.loadSheet(s.name, s.xml, s.img);
    }

    loadingOverlay.style.opacity = '0';
    setTimeout(() => loadingOverlay.style.display = 'none', 800);

    render();
}

function render() {
    renderer.clear();

    for (let x = 0; x < city.size; x++) {
        for (let y = 0; y < city.size; y++) {
            const tile = city.grid[x][y];
            if (!tile) continue;

            renderer.drawSprite(assets.getSprite(tile.ground), x, y);
            if (tile.road) renderer.drawSprite(assets.getSprite(tile.road), x, y);
            if (tile.prop) renderer.drawSprite(assets.getSprite(tile.prop), x, y);
            if (tile.vehicle) renderer.drawSprite(assets.getSprite(tile.vehicle), x, y);
            if (tile.building) renderer.drawSprite(assets.getSprite(tile.building), x, y);
        }
    }

    requestAnimationFrame(render);
}

// Override resetView for diorama look
renderer.resetView = function (mapSize) {
    this.zoom = 1.0;
    this.offsetX = this.canvas.width / 2;
    this.offsetY = this.canvas.height / 3;
};

document.getElementById('resetView').addEventListener('click', (e) => {
    renderer.resetView(citySize);
    e.stopPropagation();
});

document.getElementById('randomize').addEventListener('click', (e) => {
    city = new City(citySize);
    e.stopPropagation();
});

init();
