const canvas = document.querySelector("#canvas");
const layers = document.querySelector("#layers");
const addTextBtn = document.querySelector("#addText");
const addRectangleBtn = document.querySelector("#addRectangle");

let isDragging = false;
let isResizing = false;
let isRotating = false;

let startX, startY, startW, startH, startLeft, startTop;
let offsetX = 0,
  offsetY = 0;
let startAngle = 0,
  startRotation = 0;
let resizeDir = null;
let startFontSize = null;

let selectedElem = null;
let selectedId = null;

const moveStep = 5;
const STORAGE_KEY = "mini-figma-state";

let allElements = [];

/* ================= HELPERS ================= */

const uid = () => crypto.randomUUID();

const getElemData = (id) => allElements.find((el) => el.id === id);

/* ================= STORAGE ================= */

function saveToLocalStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(allElements));
}

function loadFromLocalStorage() {
  const data = localStorage.getItem(STORAGE_KEY);
  if (data) allElements = JSON.parse(data);
}

/* ================= CREATE ================= */

function createElem(type) {
  const id = uid();

  const base = {
    id,
    x: 100,
    y: 100,
    width: 120,
    height: 80,
    rotation: 0,
    zIndex: allElements.length + 1,
  };

  if (type === "text") {
    return {
      ...base,
      type: "text",
      text: "Enter Text",
      styles: {
        color: "#fff",
        fontSize: 16,
      },
    };
  }

  return {
    ...base,
    type: "rect",
    styles: {
      backgroundColor: "#4b4a63",
    },
  };
}

function addElem(type) {
  const elem = createElem(type);
  allElements.push(elem);
  renderElement(elem);
  renderLayer(elem);
  saveToLocalStorage();
}

/* ================= RENDER ================= */

function renderElement(elem) {
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
  } else {
    div.classList.add("rectangle");
    div.style.backgroundColor = elem.styles.backgroundColor;
  }

  canvas.appendChild(div);
}

function renderLayer(elem) {
  const layer = document.createElement("div");
  layer.classList.add("layer");
  layer.dataset.id = elem.id;
  layer.textContent = elem.type === "text" ? "Text" : "Rectangle";

  layer.onclick = () => {
    const domElem = document.querySelector(`.elem[data-id="${elem.id}"]`);
    selectElement(domElem);
  };

  layers.appendChild(layer);
}

function loadFromState() {
  canvas.innerHTML = "";
  layers.innerHTML = "";
  allElements.forEach((el) => {
    renderElement(el);
    renderLayer(el);
  });
}

/* ================= SELECTION ================= */

function selectElement(elem) {
  document.querySelectorAll(".elem").forEach((e) => {
    e.classList.remove("selected");
    e.querySelectorAll(".handle").forEach((h) => h.remove());
  });

  if (!elem) {
    selectedElem = null;
    selectedId = null;
    return;
  }

  selectedElem = elem;
  selectedId = elem.dataset.id;
  selectedElem.classList.add("selected");
  addResizeController(selectedElem);
}

/* ================= HANDLES ================= */

function addResizeController(elem) {
  elem.insertAdjacentHTML(
    "beforeend",
    `<div class="handle nw"></div>
     <div class="handle ne"></div>
     <div class="handle se"></div>
     <div class="handle sw"></div>
     <div class="handle rotate"></div>`,
  );
}

/* ================= EVENTS ================= */

canvas.addEventListener("mousedown", (e) => {
  const elem = e.target.closest(".elem");

  if (elem) {
    selectElement(elem);
    isDragging = true;

    const rect = elem.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
  }

  if (e.target.classList.contains("handle")) {
    isDragging = false;
    isResizing = true;
    resizeDir = e.target.classList[1];

    const rect = selectedElem.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();

    startX = e.clientX;
    startY = e.clientY;
    startW = rect.width;
    startH = rect.height;
    startLeft = rect.left - canvasRect.left;
    startTop = rect.top - canvasRect.top;

    if (resizeDir === "rotate") {
      isResizing = false;
      isRotating = true;
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      startAngle = Math.atan2(e.clientY - cy, e.clientX - cx);
      startRotation = getElemData(selectedId).rotation;
    }

    if (selectedElem.classList.contains("text")) {
      startFontSize = parseFloat(getComputedStyle(selectedElem).fontSize);
    }
  }
});

canvas.addEventListener("mousemove", (e) => {
  if (!selectedElem) return;

  const data = getElemData(selectedId);
  if (!data) return;

  const canvasRect = canvas.getBoundingClientRect();

  if (isDragging) {
    const x = e.clientX - canvasRect.left - offsetX;
    const y = e.clientY - canvasRect.top - offsetY;

    data.x = x;
    data.y = y;
    selectedElem.style.left = x + "px";
    selectedElem.style.top = y + "px";
  }

  if (isResizing) {
    let dx = e.clientX - startX;
    let dy = e.clientY - startY;

    let w = startW;
    let h = startH;
    let l = startLeft;
    let t = startTop;

    if (resizeDir.includes("se")) {
      w += dx;
      h += dy;
    }
    if (resizeDir.includes("sw")) {
      w -= dx;
      h += dy;
      l += dx;
    }
    if (resizeDir.includes("ne")) {
      w += dx;
      h -= dy;
      t += dy;
    }
    if (resizeDir.includes("nw")) {
      w -= dx;
      h -= dy;
      l += dx;
      t += dy;
    }

    data.width = w;
    data.height = h;
    data.x = l;
    data.y = t;

    selectedElem.style.width = w + "px";
    selectedElem.style.height = h + "px";
    selectedElem.style.left = l + "px";
    selectedElem.style.top = t + "px";

    if (data.type === "text") {
      const scale = Math.min(w / startW, h / startH);
      const fs = Math.max(8, startFontSize * scale);
      data.styles.fontSize = fs;
      selectedElem.style.fontSize = fs + "px";
    }
  }

  if (isRotating) {
    const rect = selectedElem.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const angle = Math.atan2(e.clientY - cy, e.clientX - cx);
    const deg = (angle - startAngle) * (180 / Math.PI);

    data.rotation = startRotation + deg;
    selectedElem.style.transform = `rotate(${data.rotation}deg)`;
  }
});

document.addEventListener("mouseup", () => {
  isDragging = isResizing = isRotating = false;
  saveToLocalStorage();
});

/* ================= KEYBOARD ================= */

document.addEventListener("keydown", (e) => {
  if (!selectedElem) return;

  const data = getElemData(selectedId);
  if (!data) return;

  switch (e.key) {
    case "ArrowUp":
      data.y -= moveStep;
      break;
    case "ArrowDown":
      data.y += moveStep;
      break;
    case "ArrowLeft":
      data.x -= moveStep;
      break;
    case "ArrowRight":
      data.x += moveStep;
      break;
    case "Delete":
    case "Backspace":
      deleteElement(selectedId);
      return;
    default:
      return;
  }

  selectedElem.style.left = data.x + "px";
  selectedElem.style.top = data.y + "px";
  saveToLocalStorage();
});

/* ================= DELETE ================= */

function deleteElement(id) {
  allElements = allElements.filter((el) => el.id !== id);

  document.querySelector(`.elem[data-id="${id}"]`)?.remove();
  document.querySelector(`.layer[data-id="${id}"]`)?.remove();

  selectedElem = null;
  selectedId = null;

  saveToLocalStorage();
}

/* ================= INIT ================= */

addTextBtn.onclick = () => addElem("text");
addRectangleBtn.onclick = () => addElem("rect");

window.addEventListener("load", () => {
  loadFromLocalStorage();
  loadFromState();
});
