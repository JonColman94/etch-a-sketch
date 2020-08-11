let viewport = new Viewport( 16 );
let paintModes = new PaintModes();

main();

/* Viewport Object Constructor */
function Viewport( size ) {

    this.size = size;
    this.view = document.createElement("div");
    this.view.id = "viewport";
    this.paintedCells = [];
}

/* Paint Modes Map Wrapper */
function PaintModes() {

    this.map = new Map([
        ["black", () => { return "#000000" }],
        ["magenta", () => { return "#ff00ff" }],
        ["random", () => { return "#" + Math.floor(Math.random()*(2**24-1)).toString(16) }],
        ["pick a color", () => { return "#000000" }]
    ]);
    this.paintMode = this.map.get("black");

    this.setCurrentPaintMode = function(key) {
        let value = this.map.get(key);
        if (value) this.paintMode = value;
    }

    this.setPaintMode = function( key, func ) {
        this.map.set(key, func);
    }

    /* Carries out mapped function. In random's case, picks a random color*/
    this.getCurrentPaintMode = function() {
        return (this.paintMode)();
    }

}

function linkViewport( vp ) {
    (document.querySelector("#container")).appendChild(vp.view);
}

/* Generate Buttons to choose color schemes in PaintModes */
function createColorOptionButtons() {
    let div = document.querySelector("#color-option-buttons");
    paintModes.map.forEach((v, k) => {
        let btn = document.createElement("button");
        btn.className = "color-button";
        btn.id = k.replace(/\s/g, "-");
        btn.textContent = k;
        div.appendChild(btn);
        // Pick has a seperate mechanic
        if (k != "pick a color") btn.addEventListener("click", changePaintColor);
        else btn.addEventListener("click", createColorPickerDiv);
    })
}


function setGrid( vp ) {
    let size = (arguments[1] ? arguments[1] : vp.size);
    Array.from({length: size**2}, (_, i) => createCell( vp.view, size ));
}


function createCell( element, size ) {
    let cell = document.createElement("div");
    cell.style.width = `${100/size}%`;
    cell.style.height = `${100/size}%`;
    cell.style.backgroundColor = "#ffffff";
    element.appendChild(cell);
}


function paint() {
    let index = (arguments[0].type == "touchmove") ? translateTouchToIndex(arguments[0], this)
            : translateMouseCoordsToIndex( arguments[0], this );
    let cell = this.childNodes[index];
    cell.style.backgroundColor = (paintModes.getCurrentPaintMode)();
    viewport.paintedCells.push(cell);
}


function translateMouseCoordsToIndex( e, view ) {
    let size = view.childElementCount ** 0.5;

    let x = Math.min(size, Math.floor(size*(e.clientX - view.offsetLeft)/view.clientWidth));
    let y = Math.min(size, Math.floor(size*(e.clientY - view.offsetTop)/view.clientHeight));
    return y*size+x;
}

function translateTouchToIndex( e, view ) {
    let size = view.childElementCount ** 0.5;

    let x = Math.max(0, Math.min(size, Math.floor(size*(e.touches[0].clientX - view.offsetLeft)/view.clientWidth)));
    let y = Math.max(0, Math.min(size, Math.floor(size*(e.touches[0].clientY - view.offsetTop)/view.clientHeight)));

    x = (x == size ? size-1 : x);
    y = (y == size ? size-1 : y);
    return y*size+x;
}


function resetGrid() {
    viewport.paintedCells.forEach(x => x.style.backgroundColor = "#ffffff");
    viewport.paintedCells = [];
}


function changeGrid( newSize ) {
    // Grow grid
    if (newSize > viewport.size) {
        Array.from(viewport.view.childNodes, 
                x => { x.style.width = `${100/newSize}%`; x.style.height = `${100/newSize}%`; x.style.backgroundColor = "#ffffff"; });
        Array.from({length: newSize**2 - viewport.size**2}, (_, i) => createCell(viewport.view, newSize));
    }
    // Shrink Grid - delete and rebuild
    else if (newSize < viewport.size) {
        viewport.view.innerHTML = "";
        setGrid( viewport, newSize);
    }
    // Reset Grid
    else resetGrid();
    viewport.size = newSize;
}

/* Get User Input on desired Grid Size */
function changeSize() {
    let newSize = "";
    while (isNaN(newSize) || newSize < 1 || newSize > 100) {
        newSize = prompt(((newSize === "") ? "" : `${newSize} is invalid! `) 
                + "Please pick your desired grid size from 1 to 100");
        if (!newSize) return;
        newSize = (parseInt(newSize)) ? parseInt(newSize) : newSize;
    }
    changeGrid(newSize);
}

/*Instead of having listeners for every cell, have one listener for viewport*/
function addGridListener( vp ) {
    vp.view.addEventListener("mousemove", paint);
    vp.view.addEventListener("touchmove", paint); //Mobile support
}

function addClearButtonListener() {
    (document.querySelector("#clear")).addEventListener("click", resetGrid);
}

function addChangeSizeButtonListener() {
    (document.querySelector("#change")).addEventListener("click", changeSize);
}

/* Create a color picker. Used for "Pick Color" PaintMode */
function createColorPickerDiv() {
    paintModes.setCurrentPaintMode("pick a color");

    let div = document.querySelector("#color-options");
    let colorPickerDiv = document.createElement("div");
    colorPickerDiv.id = "color-picker-div";
    let colorPicker = document.createElement("input");
    colorPicker.id = "picker";
    colorPicker.type = "color";
    colorPicker.value = paintModes.getCurrentPaintMode();
    colorPickerDiv.appendChild(colorPicker);
    div.appendChild(colorPickerDiv);


    colorPicker.addEventListener("change", pickPaintColor);
}

function pickPaintColor() {
    paintModes.setPaintMode("pick a color", new Function(`return "${this.value}"`));
    paintModes.setCurrentPaintMode("pick a color");
}

function changePaintColor() {
    //Remove color picker
    let div = document.querySelector("#color-options");
    let pickerDiv = document.querySelector("#color-picker-div");
    if (pickerDiv) div.removeChild(pickerDiv);

    setPaintColor(this.id);
}

function setPaintColor() {
    paintModes.setCurrentPaintMode(arguments[0]);
}

function main() {
    linkViewport(viewport);
    addGridListener( viewport );
    addClearButtonListener();
    addChangeSizeButtonListener();
    setGrid( viewport );
    createColorOptionButtons();
}