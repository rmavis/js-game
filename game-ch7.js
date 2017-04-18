/*
  TODO
  - characters smaller than land cells
  - item cells
  - characters push each other, item cells, etc
  - items cells have other rules

  Could have compound land cells, passed in instructions as arrays, placed in ascending order. In this way items can be placed on land. Items don't need to have the shape/dimensions of land cells.
  Cells could have onOccupy, onLeave functions. Pushing a cell could called onOccupy.
  If no two non-land cells can occupy the same space, then the coordinates can be used as keys of an object that correlates coordiates with objects, which is an efficient structure for that.
  Can move chars by amounts unattached to char's dimensions.

  Plan for edge detection:
  - get the coordinates of the character/item's next movement
  - scan all chars/items, check their coordinates, bounds are top + height, left + width, check if new coords are within those (between top and (top + height), left and (left + width))
  - if within bounds, fire onOccupy action
  - else, not
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



    /*
     * IMPORTANT
     *
     * This object must contain an entry for every character legal
     * in the map instructions init parameter.
     *
     * THANK YOU
     */
    function getMapKey() {
        return {
            " ": LandCell,
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



    function areCoordsLegal(cells, coords) {
        return ((cells[coords[0]]) && (cells[coords[0]][coords[1]]));
    }



    function isMapCellEmpty(cell) {
        return (cell.can_occupy && (cell.occupied_by === null));
    }





    /*
     * Character cells.
     */

    // The generic character class.
    function CharacterCell(conf) {
        if (conf !== undefined) {
            for (key in conf) {
                if (conf.hasOwnProperty(key)) {
                    this[key] = conf[key];
                }
            }
        }
    }

    // In the browser, Character cells will be classed `char__cell`
    // and `char__cell--TYPE`, where TYPE is their `type`.
    CharacterCell.prototype.type = 'generic';
    // This will become a reference to the character's DOM element.
    CharacterCell.prototype.elem = null;
    // This will become a four-item array of two-item arrays that
    // together specify the character's x-y position on the map.
    CharacterCell.prototype.coords = null;


    function PlayerCharacter() {
        CharacterCell.call(this);
    }

    PlayerCharacter.prototype = Object.create(CharacterCell.prototype);

    PlayerCharacter.prototype.type = 'player';
    PlayerCharacter.prototype.char = '@';
    PlayerCharacter.prototype.onTouchAction = playerCaptureAction;


    function EnemyCharacter() {
        CharacterCell.call(this);
    }

    EnemyCharacter.prototype = Object.create(CharacterCell.prototype);

    EnemyCharacter.prototype.type = 'enemy';
    EnemyCharacter.prototype.char = '!';
    EnemyCharacter.prototype.onTouchAction = enemyCaptureAction;



    function playerCaptureAction(player, enemy) {
        addClassToElem(enemy.elem, 'char__cell--dead');
        removeEnemyFromLists(enemy);
        if ($enemies.length == 0) {
            winGame();
        }
    }

    function enemyCaptureAction(enemy, char) {
        addClassToElem(char.elem, 'char__cell--dead');
        removeEnemyFromLists(char);
        if (char === $player) {
            endGame();
        }
    }


    function removeEnemyFromLists(char) {
        var _enemies = [ ];

        for (var o = 0; o < $enemies.length; o++) {
            if ($enemies[o] !== char) {
                _enemies.push($enemies[o]);
            }
        }

        $enemies = _enemies;
        $characters = _enemies.concat([$player]);
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
        char.coords = getCharacterCoordsSet(char);
        return char;
    }



    function makeCharacterElement(char) {
        var elem = document.createElement('div');
        elem.className = 'char__cell char__cell--' + char.type;
        return elem;
    }



    function getCharacterCoordsSet(char, origin) {
        origin = (origin === undefined) ? [0,0] : origin;

        return [
            [origin[0], origin[1]],
            [(origin[0] + char.elem.offsetWidth), origin[1]],
            [origin[0], (origin[1] + char.elem.offsetHeight)],
            [(origin[0] + char.elem.offsetWidth), (origin[1] + char.elem.offsetHeight)]
        ];
    }



    function updateCharacterCoordsSet(char, origin) {
        char.coords = getCharacterCoordsSet(char, origin);
    }



    function positionCharacterByCoords(char) {
        char.elem.style.left = char.coords[0][0] + 'px';
        char.elem.style.top = char.coords[0][1] + 'px';
    }



    function positionCharacterByRandom(map, chars, char, n) {
        n = (n === undefined) ? 0 : n;

        if (n > 9) {
            console.log("Too many failed attempts to position character. Quitting.");
            return null;
        }

        var x = getRandomIntInclusive(0, (map.elem.offsetWidth - char.elem.offsetWidth)),
            y = getRandomIntInclusive(0, (map.elem.offsetHeight - char.elem.offsetHeight)),
            touch = false;

        out:
        for (var o = 0; o < chars.length; o++) {
            if (doCharactersTouch(chars[o], char)) {
                touch = true;
                break out;
            }
        }

        if (touch) {
            return positionCharacterByRandom(map, char, (n + 1));
        }
        else {
            updateCharacterCoordsSet(char, [x, y]);
            positionCharacterByCoords(char);
            return true;
        }
    }



    function doCharactersTouch(char_ref, char_act) {
        var x_min = char_ref.coords[0][0],
            x_max = char_ref.coords[1][0],
            y_min = char_ref.coords[0][1],
            y_max = char_ref.coords[2][1];

        for (var o = 0; o < char_act.coords.length; o++) {
            if ((char_act.coords[o][0] >= x_min) &&
                (char_act.coords[o][0] <= x_max) &&
                (char_act.coords[o][1] >= y_min) &&
                (char_act.coords[o][1] <= y_max)) {
                return true;
            }
        }

        return false;
    }



    function moveCharacterToCoordsIfLegal(coords, char, map) {
        if ((areCoordsLegal(map.cells, coords)) &&
            (isMapCellEmpty(map.cells[coords[0]][coords[1]]))) {
            moveCharacterToCell(char, map.cells[coords[0]][coords[1]], map);
            return true;
        }
        else {
            return false;
        }
    }



    function moveCharacterByVector(vector, char, map) {
        var new_pos = [
            (char.coords[0][0] + (vector[0] * char.elem.offsetWidth)),
            (char.coords[0][1] + (vector[1] * char.elem.offsetHeight))
        ];

        if (new_pos[0] < 0) {
            new_pos[0] = 0;
        }
        if (new_pos[1] < 0) {
            new_pos[1] = 0;
        }
        if (new_pos[0] >= (map.elem.offsetWidth - char.elem.offsetWidth)) {
            new_pos[0] = (map.elem.offsetWidth - char.elem.offsetWidth);
        }
        if (new_pos[1] >= (map.elem.offsetHeight - char.elem.offsetHeight)) {
            new_pos[1] = (map.elem.offsetHeight - char.elem.offsetHeight);
        }

        updateCharacterCoordsSet(char, new_pos);
        positionCharacterByCoords(char);

        for (var o = 0; o < $characters.length; o++) {
            if (($characters[o] !== char) &&
                (doCharactersTouch($characters[o], char))) {
                console.log("Character " + char.elem.className + " touched " + $characters[o].elem.classname);
                char.onTouchAction(char, $characters[o]);
            }
        }
    }



    function moveCharacterByRandom(char, map, n) {
        n = (n === undefined) ? 0 : n;

        if (n > 9) {
            // console.log("Too many tries to move, cancelling.");
            return null;
        }

        moveCharacterByVector(
            $possible_moves[getRandomIntInclusive(0, ($possible_moves.length - 1))],
            char,
            map
        );
    }



    function moveCharactersAtRandom(chars, map) {
        for (var o = 0; o < chars.length; o++) {
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

    var $characters = [ ],
        $enemies = [ ],
        $player = null,        
        $map = {
            cells: [ ],
            elem: null
        };

    // These are (y, x)
    var $possible_moves = [
        [-1,-1], [0,-1], [1,-1],
        [-1,0],  [0,0],  [1,0],
        [-1,1],  [0,1],  [1,1],
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
        $characters = $enemies.concat([$player]);

        positionCharacters($map, $characters);
        addEventListeners();
        pauseGame();
    }



    function positionCharacters(map, chars) {
        var positioned = [ ];

        for (var o = 0; o < chars.length; o++) {
            map.elem.appendChild(chars[o].elem);
            updateCharacterCoordsSet(chars[o]);
            positionCharacterByRandom(map, positioned, chars[o]);
            positioned.push(chars[o]);
        }
    }



    function addEventListeners() {
        window.addEventListener('keydown', handleKeyDown);
    }



    function removeEventListeners() {
        window.removeEventListener('keydown', handleKeyDown);
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
        case " " || "Spacebar" || "Escape":
            evt.preventDefault();
            console.log("spacebar / esc");
            togglePause();
            break;
        }
    }



    function togglePause() {
        if ($is_paused) {
            resumeGame();
        }
        else {
            pauseGame();
        }
    }



    function pauseGame() {
        $is_paused = true;

        stopMovingEnemies();

        removeClassFromElem(
            document.querySelector('.info__wrap--general'),
            'info__wrap--hide'
        );
    }



    function resumeGame() {
        $is_paused = false;

        startMovingEnemies();

        addClassToElem(
            document.querySelector('.info__wrap--general'),
            'info__wrap--hide'
        );
    }



    function endGame() {
        removeEventListeners();

        stopMovingEnemies();

        removeClassFromElem(
            document.querySelector('.info__wrap--game-over'),
            'info__wrap--hide'
        );
    }



    function winGame() {
        removeEventListeners();

        stopMovingEnemies();

        removeClassFromElem(
            document.querySelector('.info__wrap--game-won'),
            'info__wrap--hide'
        );
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



    function addClassToElem(elem, _class) {
        var arr = elem.className.split(' ');

        if (arr.indexOf(_class) === -1) {
            arr.push(_class);
            elem.className = arr.join(' ');
        }
    }



    function removeClassFromElem(elem, _class) {
        var regex = new RegExp("[ ]*" + _class, 'g');
        elem.className = elem.className.replace(regex, '');
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





    return init(conf);
}





var _map_instructions = [
    [' ',' ',' ',' ',' ',' ',' ',' ',' ',' '],
    [' ',' ',' ',' ',' ',' ',' ',' ',' ',' '],
    [' ',' ',' ',' ',' ',' ',' ',' ',' ',' '],
    [' ',' ',' ',' ',' ',' ',' ',' ',' ',' '],
    [' ',' ',' ',' ',' ',' ',' ',' ',' ',' '],
    [' ',' ',' ',' ',' ',' ',' ',' ',' ',' '],
    [' ',' ',' ',' ',' ',' ',' ',' ',' ',' '],
    [' ',' ',' ',' ',' ',' ',' ',' ',' ',' '],
    [' ',' ',' ',' ',' ',' ',' ',' ',' ',' '],
    [' ',' ',' ',' ',' ',' ',' ',' ',' ',' '],
];

/*
[
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
*/


var game = new Game({
    map: {
        element: document.querySelector('.map'),
        instructions: _map_instructions,
    },
    characters: {
        enemy_count: 10,
    },
});
