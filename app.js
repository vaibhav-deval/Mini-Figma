const canvas = document.querySelector("#canvas");
const layers = document.querySelector("#layers");
const addTextBtn = document.querySelector("#addText");
const addRectangleBtn = document.querySelector("#addRectangle");
let isResizing = false;
let startX, startY;
let startW, startH;
let startLeft, startTop;
let isDragging = false;
let offsetX = 0;
let offsetY = 0;
let isRotating = false;
let startAngle = 0;
let startRotation = 0;
let selectedElem = null;
let resizeDir = null;
let startFontSize = null;
const moveStep = 5;
let allElements = [
  
];

const STORAGE_KEY = "mini-figma-state";
function saveToLocalStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(allElements));
}
function loadFromLocalStorage() {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return;

  allElements = JSON.parse(data);
}
function addResizeController(elem) {
  elem.querySelectorAll(".handle").forEach((h) => h.remove());

  elem.insertAdjacentHTML(
    "beforeend",
    `<div class="handle nw"></div>
     <div class="handle ne"></div>
     <div class="handle se"></div>
     <div class="handle sw"></div>
     <div class="handle rotate"></div>`,
  );
}
window.addEventListener("load", () => {
  loadFromLocalStorage();
  loadFromState();
});
function addElem(type) {
  const elem = createElem(type);
  allElements.push(elem);
  renderElement(elem);
  renderLayer(elem);
  saveToLocalStorage();
}

loadFromLocalStorage();

addTextBtn.addEventListener("click", () => addElem("text"));
addRectangleBtn.addEventListener("click", () => addElem("rect"));

function createElem(type) {
  let id = allElements.length;
  const base = {
    id,
    x: 100,
    y: 100,
    width: 120,
    height: 80,
    rotation: 0,
    zIndex: id + 1,
  };
  if (type === "text") {
    return {
      ...base,
      type: "text",
      text: "Enter Text",
      styles: {
        backgroundColor: "transparent",
        color: "#fff",
        fontSize: 16,
      },
    };
  }
  if (type === "rect") {
    return {
      ...base,
      type: "rect",
      text: "",
      styles: {
        backgroundColor: "#4b4a63",
      },
    };
  }
}

canvas.addEventListener("click", (e) => {
  if (e.target.classList.contains("elem")) {
    if (selectedElem) {
      selectedElem.classList.remove("selected");
      selectedElem.querySelectorAll(".handle").forEach((h) => h.remove());
    }
    selectedElem = e.target;
    selectedElem.classList.add("selected");
    addResizeController(selectedElem);
  }
});

canvas.addEventListener("mousedown", (e) => {
  if(!selectedElem)return
  if (e.target.classList.contains("elem")) {
    if (selectedElem) {
      
      selectedElem.classList.remove("selected");
      selectedElem.querySelectorAll(".handle").forEach((h) => h.remove());
    }
    selectedElem = e.target;
    isDragging = true;
    const elemRect = selectedElem.getBoundingClientRect();
    
    offsetX = e.clientX - elemRect.left;
    offsetY = e.clientY - elemRect.top;
    
    selectedElem.classList.add("selected");
  }
  
  else if (e.target.classList.contains("handle")) {
    const elemRect = selectedElem.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    if (selectedElem.classList.contains("text")) {
      startFontSize = parseFloat(
        window.getComputedStyle(selectedElem).fontSize,
      );
    }
    resizeDir = e.target.classList[1];
    startW = elemRect.width;
    startH = elemRect.height;
    startX = e.clientX;
    startY = e.clientY;
    startLeft = elemRect.left - canvasRect.left;
    startTop = elemRect.top - canvasRect.top;
    isResizing = true;

    if (e.target.classList.contains("rotate")) {
      isResizing = false;
      isRotating = true;
      const centerX = elemRect.left + elemRect.width / 2;
      const centerY = elemRect.top + elemRect.height / 2;
      startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
      startRotation = parseFloat(selectedElem.dataset.rotation || 0);
    }
  } else{
    if (selectedElem) {
      selectedElem.classList.remove("selected");
      selectedElem.querySelectorAll(".handle").forEach((h) => h.remove());
      selectedElem = null;
    }
  }
});

canvas.addEventListener("mousemove", (e) => {
  if (isDragging && selectedElem) {
    const canvasRect = canvas.getBoundingClientRect();
    let x = e.clientX - canvasRect.left - offsetX;
    let y = e.clientY - canvasRect.top - offsetY;

    selectedElem.style.left = x + "px";
    selectedElem.style.top = y + "px";
    allElements[selectedElem.dataset.id].x = x;
    allElements[selectedElem.dataset.id].y = y;
  }
  if (isResizing && selectedElem) {
    let dx = e.clientX - startX;
    let dy = e.clientY - startY;

    let newW = startW;
    let newH = startH;
    let newLeft = startLeft;
    let newTop = startTop;

    if (resizeDir.includes("ne")) {
      newW = startW + dx;
      newH = startH - dy;
      newTop = startTop + dy;
    }

    if (resizeDir.includes("se")) {
      newW = startW + dx;
      newH = startH + dy;
    }

    if (resizeDir.includes("sw")) {
      newLeft = startLeft + dx;
      newW = startW - dx;
      newH = startH + dy;
    }

    if (resizeDir.includes("nw")) {
      newH = startH - dy;
      newTop = startTop + dy;
      newLeft = startLeft + dx;
      newW = startW - dx;
    }

    allElements[selectedElem.dataset.id].width = newW;
    allElements[selectedElem.dataset.id].height = newH;
    allElements[selectedElem.dataset.id].x = newLeft;
    allElements[selectedElem.dataset.id].y = newTop;

    selectedElem.style.width = newW + "px";
    selectedElem.style.height = newH + "px";
    selectedElem.style.left = newLeft + "px";
    selectedElem.style.top = newTop + "px";
    if (selectedElem.classList.contains("text") && startFontSize) {
      const scaleX = newW / startW;
      const scaleY = newH / startH;
      const scale = Math.min(scaleX, scaleY);

      const newFontSize = startFontSize * scale;

      selectedElem.style.fontSize = Math.max(8, newFontSize) + "px";
    }
  }
  if (isRotating && selectedElem && resizeDir.includes("rotate")) {
    const rect = selectedElem.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);

    const delta = currentAngle - startAngle;
    const deg = delta * (180 / Math.PI);

    const totalRotation = startRotation + deg;

    selectedElem.style.transform = `rotate(${totalRotation}deg)`;

    selectedElem.dataset.rotation = totalRotation;
    allElements[selectedElem.dataset.id].rotation = totalRotation;

    console.log(allElements[selectedElem.dataset.id]);
  }
});

document.addEventListener("mouseup", () => {
  isDragging = false;
  isResizing = false;
  isRotating = false;
  startFontSize = null;
  offsetX = 0;
  offsetY = 0;
  document.body.style.cursor = "default";
  if (selectedElem && selectedElem.classList.contains("text")) {
    const id = selectedElem.dataset.id;
    const finalFontSize = parseFloat(
      window.getComputedStyle(selectedElem).fontSize,
    );
    allElements[id].styles.fontSize = finalFontSize;
  }
  saveToLocalStorage();
});

function selectElem(elem) {
  document
    .querySelectorAll(".elem")
    .forEach((e) => e.classList.remove("selected"));

  elem.classList.add("selected");
  selectedElem = elem;
}

function renderElement(elem) {
  console.log(allElements);

  const div = document.createElement("div");
  div.classList.add("elem");
  div.dataset.id = elem.id;

  div.style.left = elem.x + "px";
  div.style.top = elem.y + "px";
  div.style.width = elem.width + "px";
  div.style.height = elem.height + "px";
  div.style.zIndex = elem.zIndex;
  div.style.transform = `rotate(${elem.rotation}deg)`;

  if (elem.type === "text") {
    div.classList.add("text");
    div.textContent = elem.text;
    div.style.fontSize = elem.styles.fontSize + "px";
  }

  if (elem.type === "rect") {
    div.classList.add("rectangle");
    div.style.backgroundColor = elem.styles.backgroundColor;
  }

  div.addEventListener("click", () => selectElem(div));

  canvas.appendChild(div);
}

function renderLayer(elem) {
  const layer = document.createElement("div");
  layer.classList.add("layer");
  layer.dataset.id = elem.id;

  layer.innerText =
    elem.type === "text" ? `Text ${elem.id + 1}` : `Rectangle ${elem.id + 1}`;

  layer.addEventListener("click", () => {
    const domElem = document.querySelector(`.elem[data-id="${elem.id}"]`);
    selectElem(domElem);
  });

  layers.appendChild(layer);
}

function loadFromState() {
  canvas.innerHTML = "";
  layers.innerHTML = "";

  allElements.forEach((elem) => {
    renderElement(elem);
    renderLayer(elem);
  });
}

window.addEventListener("load", loadFromState);

document.addEventListener("keydown", (e) => {
  if (!selectedElem) return;

  if (
    e.target.tagName === "INPUT" ||
    e.target.tagName === "TEXTAREA" ||
    selectedElem.isContentEditable
  ) {
    return;
  }

  const data = allElements[selectedElem.dataset.id];
console.log(selectedElem.dataset.id);

  let x = data.x;
  let y = data.y;

  switch (e.key) {
    case "ArrowUp":
      y -= moveStep;
      break;
    case "ArrowDown":
      y += moveStep;
      break;
    case "ArrowLeft":
      x -= moveStep;
      break;
    case "ArrowRight":
      x += moveStep;
      break;
    case "Delete":
    case "Backspace":
      deleteElement(selectedElem.dataset.id);
      selectElem=null;
      return;
    default:
      return;
  }

  data.x = x;
  data.y = y;

  selectedElem.style.left = x + "px";
  selectedElem.style.top = y + "px";

  saveToLocalStorage();
});

function deleteElement(id) {
  allElements = allElements.filter((el) => el.id != id);

  const domElem = document.querySelector(`.elem[data-id="${id}"]`);
  const layerElem = document.querySelector(`.layer[data-id="${id}"]`);

  if (domElem) domElem.remove();
  if (layerElem) layerElem.remove();

  selectedElem = null;

  saveToLocalStorage();
}
