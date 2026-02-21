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
        let isPainting = false;

        const handleStart = (e) => {
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;

            // Middle or right click for dragging, or two-finger touch
            if (e.button === 1 || e.button === 2 || (e.touches && e.touches.length >= 2)) {
                this.isDragging = true;
                document.getElementById('viewport').classList.add('panning');
            } else if (e.button === 0 || (e.touches && e.touches.length === 1)) {
                isPainting = true;
                if (this.onPaint) this.onPaint(clientX, clientY);
            }

            this.lastX = clientX;
            this.lastY = clientY;
        };

        const handleMove = (e) => {
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;

            if (this.isDragging) {
                const dx = clientX - this.lastX;
                const dy = clientY - this.lastY;
                this.offsetX += dx;
                this.offsetY += dy;
            } else if (isPainting) {
                if (this.onPaint) this.onPaint(clientX, clientY);
            }

            this.lastX = clientX;
            this.lastY = clientY;
        };

        const handleEnd = (e) => {
            this.isDragging = false;
            isPainting = false;
            document.getElementById('viewport').classList.remove('panning');
        };

        this.canvas.addEventListener('mousedown', handleStart);
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleEnd);
        this.canvas.addEventListener('contextmenu', e => e.preventDefault()); // Prevent normal right click menu

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
        const viewport = document.getElementById('viewport');
        if (viewport) {
            this.canvas.width = viewport.clientWidth;
            this.canvas.height = viewport.clientHeight;
        } else {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }
    }

    resetView(mapSize) {
        this.zoom = 0.6;
        this.offsetX = this.canvas.width / 2;
        this.offsetY = 50;
    }

    worldToScreen(x, y) {
        return {
            x: (x - y) * (this.tileWidth / 2) * this.zoom + this.offsetX,
            y: (x + y) * (this.tileHeight / 2) * this.zoom + this.offsetY
        };
    }

    screenToGrid(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        const screenX = clientX - rect.left - this.offsetX;
        const screenY = clientY - rect.top - this.offsetY;

        const halfW = (this.tileWidth / 2) * this.zoom;
        const halfH = (this.tileHeight / 2) * this.zoom;

        const gridX = (screenX / halfW + screenY / halfH) / 2;
        const gridY = (screenY / halfH - screenX / halfW) / 2;

        return { x: Math.round(gridX), y: Math.round(gridY) };
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
    constructor(data) {
        this.size = data.size;
        this.grid = [];

        // Initialize an empty grid
        for (let x = 0; x < this.size; x++) {
            this.grid[x] = [];
            for (let y = 0; y < this.size; y++) {
                this.grid[x][y] = null;
            }
        }

        // Populate from data
        if (data.tiles) {
            for (const tileData of data.tiles) {
                this.grid[tileData.x][tileData.y] = {
                    ground: tileData.ground || "landscapeTiles_067.png",
                    road: tileData.road || null,
                    building: tileData.building || null,
                    prop: tileData.prop || null,
                    vehicle: tileData.vehicle || null
                };
            }
        }
    }
}

const assets = new AssetManager();
const canvas = document.getElementById('cityCanvas');
const renderer = new IsometricRenderer(canvas);
let city = null;
const loadingOverlay = document.getElementById('loading-overlay');

// Map Editor States
let activeBrush = null;
let activeCategory = 'base';

async function init() {
    try {
        const res = await fetch('city.json');
        const cityData = await res.json();
        city = new City(cityData);
    } catch (e) {
        console.error("Failed to load city.json:", e);
        city = new City({ size: 12, tiles: [] });
    }

    window.addEventListener('resize', () => renderer.resize());
    renderer.resize();
    renderer.resetView(city.size);

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

    setupEditorUI();

    renderer.onPaint = (clientX, clientY) => {
        if (!city || (!activeBrush && activeBrush !== 'ERASE')) return;

        const gridPos = renderer.screenToGrid(clientX, clientY);
        const gx = gridPos.x;
        const gy = gridPos.y;

        if (gx >= 0 && gx < city.size && gy >= 0 && gy < city.size) {
            // Create cell if missing
            if (!city.grid[gx]) city.grid[gx] = [];
            if (!city.grid[gx][gy]) {
                city.grid[gx][gy] = { ground: null, road: null, building: null, prop: null, vehicle: null };
            }

            const cell = city.grid[gx][gy];

            if (activeBrush === 'ERASE') {
                city.grid[gx][gy] = null;
            } else {
                if (activeCategory === 'base') cell.ground = activeBrush;
                else if (activeCategory === 'city') cell.ground = activeBrush; // City roads act as ground
                else if (activeCategory === 'buildings') cell.building = activeBrush;
                else if (activeCategory === 'details') cell.prop = activeBrush;
                else if (activeCategory === 'cars') cell.vehicle = activeBrush;
            }
        }
    };

    render();
}

function setupEditorUI() {
    function populatePalette(category) {
        const grid = document.getElementById('asset-list');
        grid.innerHTML = '';
        for (const [name, sprite] of assets.sprites.entries()) {
            if (sprite.sheetName === category) {
                const div = document.createElement('div');
                div.className = 'asset-item';
                if (activeBrush === name) div.classList.add('selected');

                const c = document.createElement('canvas');
                c.width = sprite.width;
                c.height = sprite.height;
                c.getContext('2d').drawImage(sprite.img, sprite.x, sprite.y, sprite.width, sprite.height, 0, 0, sprite.width, sprite.height);
                div.appendChild(c);
                div.title = name;

                div.onclick = () => {
                    activeBrush = name;
                    activeCategory = category;
                    document.querySelectorAll('.asset-item').forEach(el => el.classList.remove('selected'));
                    div.classList.add('selected');
                };
                grid.appendChild(div);
            }
        }
    }

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            populatePalette(btn.dataset.category);
        };
    });

    // Initial palette load
    populatePalette('base');

    document.getElementById('eraseBtn').onclick = () => {
        activeBrush = 'ERASE';
        document.querySelectorAll('.asset-item').forEach(el => el.classList.remove('selected'));
    };

    document.getElementById('saveMapBtn').onclick = async () => {
        const btn = document.getElementById('saveMapBtn');
        const origText = btn.innerText;
        btn.innerText = 'Saving...';

        const cleanTiles = [];
        for (let x = 0; x < city.size; x++) {
            for (let y = 0; y < city.size; y++) {
                if (city.grid[x] && city.grid[x][y]) {
                    const t = city.grid[x][y];
                    const cleanT = { x, y };
                    if (t.ground) cleanT.ground = t.ground;
                    if (t.road) cleanT.road = t.road;
                    if (t.building) cleanT.building = t.building;
                    if (t.prop) cleanT.prop = t.prop;
                    if (t.vehicle) cleanT.vehicle = t.vehicle;
                    cleanTiles.push(cleanT);
                }
            }
        }

        try {
            const res = await fetch('save_map.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ size: city.size, tiles: cleanTiles })
            });
            const r = await res.json();
            btn.innerText = r.status === 'success' ? 'Saved successful!' : 'Error Saving';
        } catch (e) {
            btn.innerText = 'Failed request';
        }
        setTimeout(() => btn.innerText = origText, 2000);
    };

    document.getElementById('resetView').addEventListener('click', (e) => {
        if (city) renderer.resetView(city.size);
        e.stopPropagation();
    });
}

function render() {
    renderer.clear();

    const tilesToDraw = [];
    for (let x = 0; x < city.size; x++) {
        for (let y = 0; y < city.size; y++) {
            if (city.grid[x] && city.grid[x][y]) {
                tilesToDraw.push({ x, y, tile: city.grid[x][y] });
            }
        }
    }

    tilesToDraw.sort((a, b) => (a.x + a.y) - (b.x + b.y));

    for (const { x, y, tile } of tilesToDraw) {
        renderer.drawSprite(assets.getSprite(tile.ground), x, y);
        if (tile.road) renderer.drawSprite(assets.getSprite(tile.road), x, y);
        if (tile.prop) renderer.drawSprite(assets.getSprite(tile.prop), x, y);
        if (tile.vehicle) renderer.drawSprite(assets.getSprite(tile.vehicle), x, y);
        if (tile.building) renderer.drawSprite(assets.getSprite(tile.building), x, y);
    }

    requestAnimationFrame(render);
}

// Override resetView for map editor default look
renderer.resetView = function (mapSize) {
    this.zoom = 1.0;
    this.offsetX = this.canvas.width / 2;
    this.offsetY = 40;
};

init();
