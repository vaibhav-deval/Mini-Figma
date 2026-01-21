const canvas = document.querySelector("#canvas");
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
let allElements = [
  {
    id: 0,
    type: "text",
    x: 100,
    y: 100,
    width: 120,
    height: 80,
    rotation: 0,
    text: "Hello",
    zIndex: 1,
  },
  {
    id: 1,
    type: "rect",
    x: 100,
    y: 100,
    width: 120,
    height: 80,
    rotation: 0,
    zIndex: 2,
  },
];
function addElem(elem) {
  const div = createElem(elem);
  canvas.appendChild(div);
  div.innerHTML += `<div class="handle nw"></div>
            <div class="handle ne"></div>
            <div class="handle se"></div>
            <div class="handle sw"></div>
            <div class="handle rotate"></div>
            `;
  selectedElem = div;
  console.log(allElements);
}

addTextBtn.addEventListener("click", () => addElem("text"));
addRectangleBtn.addEventListener("click", () => addElem("rect"));

function createElem(type) {
  if (type == "text") {
    const text = document.createElement("div");
    text.classList.add("text", "elem", "selected");
    text.textContent = "Enter Text";
    text.dataset.id = allElements.length;
    let newElem = {
      id: allElements.length,
      type: "text",
      x: 100,
      y: 100,
      width: 120,
      height: 80,
      rotation: 0,
      styles: {
        backgroundColor: "transparent",
        color: "#fff",
      },
      text: "Enter Text",
      zIndex: allElements.length + 1,
    };
    allElements.push(newElem);

    if (selectedElem) selectedElem.classList.remove("selected");

    return text;
  } else {
    const rect = document.createElement("div");
    rect.classList.add("rectangle", "elem", "selected");
    const newId = Math.max(...allElements.map((e) => e.id)) + 1;
    rect.dataset.id = newId;

    let newElem = {
      id: newId,
      type: "rect",
      x: 100,
      y: 100,
      width: 120,
      height: 80,
      rotation: 0,
      styles: {
        backgroundColor: "#4f46e5",
        color: "#fff",
        width: "20%",
        height: "10%",
      },
      text: "",
      zIndex: 1,
    };
    allElements.push(newElem);
    if (selectedElem) selectedElem.classList.remove("selected");
    return rect;
  }
}

canvas.addEventListener("click", (e) => {
  if (e.target.classList.contains("elem")) {
    const text = e.target;
    text.classList.add("selected");
    text.innerHTML += `<div class="handle nw"></div>
            <div class="handle ne"></div>
            <div class="handle se"></div>
            <div class="handle sw"></div>
            <div class="handle rotate"></div>
            `;
    selectedElem = text;
  } else {
    selectedElem.classList.remove("selected");
  }
});

canvas.addEventListener("mousedown", (e) => {
  if (e.target.classList.contains("elem")) {
    selectedElem.classList.remove("selected");
    selectedElem.innerHTML = selectedElem.innerText;
    selectedElem = e.target;
    isDragging = true;
    const elemRect = selectedElem.getBoundingClientRect();

    offsetX = e.clientX - elemRect.left;
    offsetY = e.clientY - elemRect.top;

    selectedElem.classList.add("selected");
  }

  if (e.target.classList.contains("handle")) {
    const elemRect = selectedElem.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
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
  }
});

canvas.addEventListener("mousemove", (e) => {
  if (isDragging && selectedElem) {
    const canvasRect = canvas.getBoundingClientRect();
    let x = e.clientX - canvasRect.left - offsetX;
    let y = e.clientY - canvasRect.top - offsetY;

    selectedElem.style.left = x + "px";
    selectedElem.style.top = y + "px";
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
    selectedElem.style.width = newW + "px";
    selectedElem.style.height = newH + "px";
    selectedElem.style.left = newLeft + "px";
    selectedElem.style.top = newTop + "px";
  }
  if (resizeDir.includes("rotate")) {
    if (isRotating) {
      const rect = selectedElem.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);

      const delta = currentAngle - startAngle;
      const deg = delta * (180 / Math.PI);

      const totalRotation = startRotation + deg;

      selectedElem.style.transform = `rotate(${totalRotation}deg)`;

      selectedElem.dataset.rotation = totalRotation;
    }
  }
});

document.addEventListener("mouseup", () => {
  isDragging = false;
  isResizing = false;
  offsetX = 0;
  offsetY = 0;
  isRotating = false;
  document.body.style.cursor = "default";
});
