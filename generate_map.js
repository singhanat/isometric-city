const fs = require('fs');

const size = 12;
const tiles = [];

for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
        const tile = {
            x,
            y,
            ground: 'landscapeTiles_067.png'
        };

        // ถนนเส้นตรงแกน X (แทยงซ้ายบนไปขวาล่าง)
        if (y === 5 && x >= 2 && x <= 8 && x !== 5) {
            tile.ground = 'cityTiles_010.png';
        }

        // ถนนเส้นตรงแกน Y (แทยงขวาบนไปซ้ายล่าง)
        else if (x === 5 && y >= 2 && y <= 8 && y !== 5) {
            tile.ground = 'cityTiles_009.png';
        }

        // สี่แยกตรงกลาง
        else if (x === 5 && y === 5) {
            tile.ground = 'cityTiles_014.png';
        }

        tiles.push(tile);
    }
}

const cityData = { size, tiles };
fs.writeFileSync('city.json', JSON.stringify(cityData, null, 2));

console.log('City map generated - SIMPLE CROSSROAD!');
