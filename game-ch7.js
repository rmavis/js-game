/*
  TODO
  - characters smaller than land cells
  - item cells
  - characters push each other, item cells, etc
  - items cells have other rules
*/


function Game(conf) {

    /*
     * Land cells.
     *
     * These form the world the characters move around on.
     * The map is stored as an array of arrays of LandCell objects.
     * The other types of land should prototype from LandCell.
     *
     * In the browser, the land elements will have two classes:
     * - land__cell, common to them all, and
     * - land__cell--TYPE, where TYPE is the cell's `type`.
     *
     * All styling of land and character cells must be done in the CSS.
     */

    // LandCell is the generic type.
    function LandCell(conf) {
        if (conf !== undefined) {
            for (key in conf) {
                if (conf.hasOwnProperty(key)) {
                    this[key] = conf[key];
                }
            }
        }
    }

    // The generic land cell has the `generic` type.
    LandCell.prototype.type = 'generic';
    // The cell's `char` is how it is represented in the map's
    // `instructions`, the array of arrays of `char`s that instructs
    // the game on how to build the map.
    LandCell.prototype.char = ' ';
    // The cell's `elem` will refer to the DOM element.
    LandCell.prototype.elem = null;
    // The `coords` will be a two-item array specifying the row and
    // column of the cell in the `$map.cells` arrays.
    LandCell.prototype.coords = null;
    // A boolean indicating whether characters can occupy this cell.
    LandCell.prototype.can_occupy = true;
    // Either `null` or a reference to the occupying character.
    LandCell.prototype.occupied_by = null;
    // The cell's `occupy_action` will be fired when the character
    // occupies this cell.
    LandCell.prototype.occupy_action = null;


    function PathCell() {
        LandCell.call(this);
    }

    PathCell.prototype = Object.create(LandCell.prototype);

    PathCell.prototype.char = '-';
    PathCell.prototype.type = 'path';
    PathCell.prototype.occupy_action = pathOccupyAction;


    function ForestCell() {
        LandCell.call(this);
    }

    ForestCell.prototype = Object.create(LandCell.prototype);

    ForestCell.prototype.char = '%';
    ForestCell.prototype.type = 'forest';
    ForestCell.prototype.occupy_action = forestOccupyAction;


    function DesertCell() {
        LandCell.call(this);
    }

    DesertCell.prototype = Object.create(LandCell.prototype);

    DesertCell.prototype.char = '.';
    DesertCell.prototype.type = 'desert';
    DesertCell.prototype.occupy_action = desertOccupyAction;


    function MountainCell() {
        LandCell.call(this);
    }

    MountainCell.prototype = Object.create(LandCell.prototype);

    MountainCell.prototype.char = '^';
    MountainCell.prototype.type = 'mountain';
    MountainCell.prototype.can_occupy = false;


    function LavaCell() {
        LandCell.call(this);
    }

    LavaCell.prototype = Object.create(LandCell.prototype);

    LavaCell.prototype.char = '#';
    LavaCell.prototype.type = 'lava';
    LavaCell.prototype.occupy_action = lavaOccupyAction;


    function WaterCell() {
        LandCell.call(this);
    }

    WaterCell.prototype = Object.create(LandCell.prototype);

    WaterCell.prototype.char = '~';
    WaterCell.prototype.type = 'water';
    WaterCell.prototype.can_occupy = false;



    function getMapKey() {
        return {
            "-": PathCell,
            "%": ForestCell,
            ".": DesertCell,
            "^": MountainCell,
            "#": LavaCell,
            "~": WaterCell,
        };
    }



    function makeLandCells(map_key, instructs) {
        var map = [ ];

        for (var o = 0; o < instructs.length; o++) {
            var row = [ ];

            for (var i = 0; i < instructs[o].length; i++) {
                var cell = new map_key[instructs[o][i]]();
                cell.elem = makeLandCellElement(cell);
                cell.coords = [o, i];
                row.push(cell);
            }

            map.push(row);
        }

        return map;
    }



    function makeLandCellElement(cell) {
        var elem = document.createElement('div');
        elem.className = 'land__cell land__cell--' + cell.type;
        return elem;
    }



    function addLandCellsToMap(map) {
        map.elem.innerHTML = '';

        for (var o = 0; o < map.cells.length; o++) {
            for (var i = 0; i < map.cells[o].length; i++) {
                map.elem.appendChild(map.cells[o][i].elem);
            }
        }
    }



    function getEmptyMapCoords(cells, n) {
        // n = (n === undefined) ? 0 : n;
        // console.log("Getting random map position, attempt " + n);

        var row = getRandomIntInclusive(0, (cells.length - 1)),
            col = getRandomIntInclusive(0, (cells[0].length - 1));

        if (isMapCellEmpty(cells[row][col])) {
            return [row, col];
        }
        else {
            return getEmptyMapCoords(cells, (n + 1));
        }
    }



    function areCoordsLegal(cells, coords) {
        return ((cells[coords[0]]) && (cells[coords[0]][coords[1]]));
    }



    function isMapCellEmpty(cell) {
        return (cell.can_occupy && (cell.occupied_by === null));
    }



    function occupyMapCell(land, char) {
        land.occupied_by = char;

        if (land.occupy_action) {
            land.occupy_action(char);
        }
    }





    /*
     * Character cells.
     */

    function CharacterCell(conf) {
        if (conf !== undefined) {
            for (key in conf) {
                if (conf.hasOwnProperty(key)) {
                    this[key] = conf[key];
                }
            }
        }
    }

    CharacterCell.prototype.elem = null;
    CharacterCell.prototype.coords = null;


    function PlayerCharacter() {
        CharacterCell.call(this);
    }

    PlayerCharacter.prototype = Object.create(CharacterCell.prototype);

    PlayerCharacter.prototype.type = 'player';
    PlayerCharacter.prototype.char = '@';


    function EnemyCharacter() {
        CharacterCell.call(this);
    }

    EnemyCharacter.prototype = Object.create(CharacterCell.prototype);

    EnemyCharacter.prototype.type = 'enemy';
    EnemyCharacter.prototype.char = '!';



    function makePlayer() {
        return makeCharacter(PlayerCharacter);
    }



    function makeEnemies(count) {
        var chars = [ ];

        for (var o = 0; o < count; o++) {
            chars.push(makeCharacter(EnemyCharacter));
        }

        return chars;
    }



    function makeCharacter(type) {
        var char = new type();
        char.elem = makeCharacterElement(char);
        return char;
    }



    function makeCharacterElement(char) {
        var elem = document.createElement('div');
        elem.className = 'char__cell char__cell--' + char.type;
        return elem;
    }



    function moveCharacterToCell(char, land, map) {
        if (char.coords) {
            occupyMapCell(map.cells[char.coords[0]][char.coords[1]], null);
        }

        occupyMapCell(land, char);
        char.coords = land.coords;
        positionCharacterOnCell(char, land);
    }



    function positionCharacterOnCell(char, land) {
        // console.log(char);
        // console.log(land.elem);
        //         var pos = getScreenCoords(land.elem);
        // console.log(pos);
        // char.elem.style.left = pos.left + 'px';
        // char.elem.style.top = pos.top + 'px';

        char.elem.style.top = (land.coords[0] * 10) + 'vh';
        char.elem.style.left = (land.coords[1] * 10) + 'vw';
    }



    function moveCharacterToCoordsIfLegal(coords, char, map) {
        if ((areCoordsLegal(map.cells, coords)) &&
            (isMapCellEmpty(map.cells[coords[0]][coords[1]]))) {
            // console.log("Moving to:");
            // console.log(map.cells[coords[0]][coords[1]]);
            moveCharacterToCell(char, map.cells[coords[0]][coords[1]], map);
            return true;
        }
        else {
            return false;
        }
    }



    function moveCharacterByVector(vector, char, map) {
        var new_pos = [(char.coords[0] + vector[0]), (char.coords[1] + vector[1])];
        moveCharacterToCoordsIfLegal(new_pos, char, map);
    }



    function moveCharacterByRandom(char, map, n) {
        n = (n === undefined) ? 0 : n;

        if (n > 9) {
            // console.log("Too many tries to move, cancelling.");
            return null;
        }

        var pos_pos = $possible_moves[getRandomIntInclusive(0, ($possible_moves.length - 1))],
            new_pos = [(char.coords[0] + pos_pos[0]), (char.coords[1] + pos_pos[1])];

        // console.log("New position: " );
        // console.log(new_pos);

        if (!moveCharacterToCoordsIfLegal(new_pos, char, map)) {
            moveCharacterByRandom(char, map, (n + 1));
        }
    }



    function moveCharactersAtRandom(chars, map) {
        for (var o = 0; o < chars.length; o++) {
            // console.log("Moving character");
            // console.log(chars[o]);
            moveCharacterByRandom(chars[o], map, 0);
        }
    }



    function moveEnemies() {
        moveCharactersAtRandom($enemies, $map);
    }

    function movePlayerUp() {
        moveCharacterByVector($possible_moves[1], $player, $map);
    }

    function movePlayerDown() {
        moveCharacterByVector($possible_moves[7], $player, $map);
    }

    function movePlayerLeft() {
        moveCharacterByVector($possible_moves[3], $player, $map);
    }

    function movePlayerRight() {
        moveCharacterByVector($possible_moves[5], $player, $map);
    }



    function startMovingEnemies() {
        if ($enemies.length > 0) {
            $movement_interval_id = window.setInterval(moveEnemies, $time_tick);
            return $movement_interval_id;
        }
        else {
            return null;
        }
    }


    function stopMovingEnemies() {
        if ($movement_interval_id) {
            window.clearInterval($movement_interval_id);
            $movement_interval_id = null;
            return $movement_interval_id;
        }
        else {
            return null;
        }
    }





    /*
     * Game init.
     */

    var $enemies = [ ],
        $player = null,
        $map = {
            cells: [ ],
            elem: null
        };

    var $possible_moves = [
        [-1,-1], [-1,0], [-1,1],
        [0,-1],  [0,0],  [0,1],
        [1,-1],  [1,0],  [1,1],
    ];

    var $time_tick = 1000,
        $movement_interval_id = null,
        $is_paused = false;



    function init(conf) {
        $map = {
            cells: makeLandCells(getMapKey(), conf.map.instructions),
            elem: conf.map.element,
        };

        addLandCellsToMap($map);

        $player = makePlayer();
        $enemies = makeEnemies(conf.characters.enemy_count);
        positionCharacters($map, $enemies.concat([$player]));

        addEventListeners();
        startMovingEnemies();
    }



    function positionCharacters(map, chars) {
        var map_rows = (map.cells.length - 1),
            map_cols = (map.cells[0].length - 1);

        for (var o = 0; o < chars.length; o++) {
            var coords = getEmptyMapCoords(map.cells, 0),
                land = map.cells[coords[0]][coords[1]];

            map.elem.appendChild(chars[o].elem);
            moveCharacterToCell(chars[o], land, map);
        }
    }



    function addEventListeners() {
        window.addEventListener('keydown', handleKeyDown);
    }





    /*
     * Gameplay.
     */

    function handleKeyDown(evt) {
        switch (evt.key) {
        case "ArrowDown":
            console.log("arrow down");
            evt.preventDefault();
            movePlayerDown();
            break;
        case "ArrowUp":
            evt.preventDefault();
            console.log("arrow up");
            movePlayerUp();
            break;
        case "ArrowLeft":
            console.log("arrow left");
            evt.preventDefault();
            movePlayerLeft();
            break;
        case "ArrowRight":
            console.log("arrow right");
            evt.preventDefault();
            movePlayerRight();
            break;
        case " " || "Spacebar":
            evt.preventDefault();
            console.log("spacebar");
            togglePause();
            break;
        case "Escape":
            console.log("escape");
            break;
        }
    }



    function togglePause() {
        if ($is_paused) {
            startMovingEnemies();
        }
        else {
            stopMovingEnemies();
        }

        $is_paused = (!$is_paused);
    }





    /*
     * Utiity functions.
     */

    // via https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
    function getRandomIntInclusive(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }



    function getScreenCoords(elem) {
        var left = elem.offsetLeft,
            top = elem.offsetTop;

        if (elem.offsetParent) {
            while (elem = elem.offsetParent) {
			    left += elem.offsetLeft;
			    top += elem.offsetTop;
            }
        }

        return {
            left: left,
            top: top
        };
    }



    // via https://davidwalsh.name/function-debounce
    function debounce(func, wait, immediate) {
	    var timeout;

	    return function() {
		    var context = this,
                args = arguments;

		    var later = function() {
			    timeout = null;

			    if (!immediate) {
                    func.apply(context, args);
                }
		    };

		    var callNow = (immediate && !timeout);

		    clearTimeout(timeout);

		    timeout = setTimeout(later, wait);

		    if (callNow) {
                func.apply(context, args);
            }
	    };
    }





    function startFight() {
    }

    function pathOccupyAction() {
    }

    function forestOccupyAction() {
    }

    function desertOccupyAction() {
    }

    function mountainOccupyAction() {
    }

    function lavaOccupyAction() {
    }

    function waterOccupyAction() {
    }





    return init(conf);
}





var _map_instructions = [
    ['~','~','~','~','~','~','~','~','~','~'],
    ['~','^','^','^','%','%','%','%','-','~'],
    ['~','^','#','%','%','%','%','-','-','~'],
    ['~','^','^','%','%','%','-','-','.','.'],
    ['~','^','^','%','%','%','-','.','.','^'],
    ['~','%','%','%','%','-','-','.','^','^'],
    ['~','-','%','%','-','-','.','-','^','^'],
    ['~','-','-','-','-','.','^','-','-','^'],
    ['~','-','.','.','.','^','^','^','-','#'],
    ['~','.','.','.','^','^','^','^','^','#'],
];


var game = new Game({
    map: {
        element: document.querySelector('.map'),
        instructions: _map_instructions,
    },
    characters: {
        enemy_count: 3,
    },
});
