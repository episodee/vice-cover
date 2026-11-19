import { LAYOUTS, paintPoster, panelRects } from './art.js';
import { announceShotPainted, readShotScene } from './shots.js';

const SIZE_LABELS = {
  '1080x1080': ['1080', '1080', 'square'],
  '1080x1350': ['1080', '1350', 'portrait'],
  '1920x1080': ['1920', '1080', 'landscape'],
};
const SAMPLE_NAMES = {
  'pier.jpg': 'Pier lights',
  'boulevard.jpg': 'Ocean Drive',
  'neon-portrait.jpg': 'After hours',
  'sunset-drive.jpg': 'Last light',
};
const PANEL_TITLES = {
  classic: ['HERO', 'SIDE A', 'SIDE B'],
  double: ['FRAME A', 'FRAME B'],
  strip: ['STRIP 01', 'STRIP 02', 'STRIP 03', 'STRIP 04'],
};
const $ = (selector) => document.querySelector(selector);

function newPanel() {
  return { image: null, src: '', label: 'No photo', zoom: 1, panX: 0, panY: 0 };
}

const state = {
  layout: 'classic',
  panels: Array.from({ length: 3 }, newPanel),
  selected: 0,
  size: '1080x1350',
  title: 'VICE CITY',
  subtitle: 'Sunset Heist',
  titleColor: '#fffaf3',
  titleSize: 100,
  captionPosition: 'top',
  grade: 'sunset',
  strength: 68,
  vignette: true,
};

function dimension(size) {
  const [width, height] = size.split('x').map(Number);
  const scale = Math.min(960 / width, 960 / height, 1);
  return [Math.max(1, Math.round(width * scale)), Math.max(1, Math.round(height * scale))];
}

function showMessage(message = 'Saved') {
  $('#status').textContent = message;
}

function syncLayout() {
  const count = PANEL_TITLES[state.layout].length;
  state.panels = Array.from({ length: count }, (_, index) => state.panels[index] || newPanel());
  state.selected = Math.min(state.selected, count - 1);
  $('#panel-count').textContent = `${count} PANEL${count === 1 ? '' : 'S'}`;
  $('#preview-layout').textContent = LAYOUTS[state.layout].name;
  document.querySelectorAll('.layout-card').forEach((card) => card.classList.toggle('selected', card.dataset.layout === state.layout));
  syncPanels();
}

function syncPanels() {
  const list = $('#panel-list');
  list.replaceChildren();
  state.panels.forEach((panel, index) => {
    const row = document.createElement('button');
    row.type = 'button';
    row.className = `panel-row${index === state.selected ? ' selected' : ''}`;
    row.setAttribute('aria-label', `Select panel ${index + 1}, ${PANEL_TITLES[state.layout][index]}`);
    const thumb = document.createElement('span');
    thumb.className = `panel-thumb${panel.image ? '' : ' panel-empty'}`;
    if (panel.image) {
      const image = document.createElement('img');
      image.src = panel.src;
      image.alt = '';
      image.style.width = '100%';
      image.style.height = '100%';
      image.style.objectFit = 'cover';
      thumb.append(image);
    } else thumb.textContent = '+';
    const name = document.createElement('span');
    const strong = document.createElement('strong');
    strong.textContent = PANEL_TITLES[state.layout][index];
    const small = document.createElement('small');
    small.textContent = panel.label;
    name.append(strong, small);
    const number = document.createElement('span');
    number.className = 'row-index';
    number.textContent = String(index + 1).padStart(2, '0');
    row.append(thumb, name, number);
    row.addEventListener('click', () => selectPanel(index));
    list.append(row);
  });
  const selected = state.panels[state.selected];
  $('#selected-name').textContent = `PANEL ${String(state.selected + 1).padStart(2, '0')} · ${PANEL_TITLES[state.layout][state.selected]}`;
  $('#zoom').value = selected.zoom;
  $('#zoom-value').textContent = `${Number(selected.zoom).toFixed(1)}×`;
}

function selectPanel(index) {
  state.selected = index;
  syncPanels();
  paintPreview();
}

function paintPreview() {
  const canvas = $('#poster');
  const [width, height] = dimension(state.size);
  paintPoster(canvas, state, width, height);
  const wrapper = canvas.parentElement;
  wrapper.style.aspectRatio = `${SIZE_LABELS[state.size][0]} / ${SIZE_LABELS[state.size][1]}`;
  wrapper.style.width = 'auto';
  wrapper.style.maxWidth = '100%';
}

function loadImage(source, label) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ image, src: source, label });
    image.onerror = () => reject(new Error(`Could not load photo: ${label}`));
    image.src = source;
  });
}

async function setPanelPhoto(index, source, label) {
  try {
    const photo = await loadImage(source, label);
    state.panels[index] = { ...state.panels[index], ...photo, zoom: 1, panX: 0, panY: 0 };
    state.selected = index;
    syncPanels();
    paintPreview();
    showMessage('Saved');
  } catch (error) {
    showMessage('Could not load photo');
    console.error(error);
  }
}

async function setEveryPanel(source, label) {
  try {
    const photo = await loadImage(source, label);
    state.panels = state.panels.map(() => ({ ...newPanel(), ...photo }));
    syncPanels();
    paintPreview();
    showMessage('Saved');
  } catch (error) {
    showMessage('Could not load photo');
    console.error(error);
  }
}

function updateSize(size) {
  state.size = size;
  document.querySelectorAll('.size-button').forEach((button) => button.classList.toggle('active', button.dataset.size === size));
  const [width, height, label] = SIZE_LABELS[size];
  $('#chosen-size').textContent = `${width} × ${height} px · ${label}`;
  paintPreview();
}

function pointerPanel(event) {
  const canvas = $('#poster');
  const box = canvas.getBoundingClientRect();
  const x = (event.clientX - box.left) * canvas.width / box.width;
  const y = (event.clientY - box.top) * canvas.height / box.height;
  const rects = panelRects(state.layout, canvas.width, canvas.height, Math.max(3, Math.round(Math.min(canvas.width, canvas.height) * .0065)));
  return rects.findIndex((rect) => x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h);
}

function initEditor() {
  const canvas = $('#poster');
  const fileInput = $('#file-input');
  document.querySelectorAll('.layout-card').forEach((button) => button.addEventListener('click', () => {
    state.layout = button.dataset.layout;
    syncLayout();
    paintPreview();
    showMessage('Saved');
  }));
  document.querySelectorAll('.size-button').forEach((button) => button.addEventListener('click', () => updateSize(button.dataset.size)));
  $('#upload').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (file) setPanelPhoto(state.selected, URL.createObjectURL(file), file.name);
    fileInput.value = '';
  });
  document.querySelectorAll('.sample').forEach((button) => button.addEventListener('click', () => {
    const file = button.dataset.sample;
    setPanelPhoto(state.selected, `samples/${file}`, SAMPLE_NAMES[file]);
  }));
  $('#all-panels').addEventListener('click', () => {
    const panel = state.panels[state.selected];
    if (panel.image) setEveryPanel(panel.src, panel.label);
    else showMessage('Choose a photo first');
  });
  $('#zoom').addEventListener('input', (event) => {
    const panel = state.panels[state.selected];
    panel.zoom = Number(event.target.value);
    $('#zoom-value').textContent = `${panel.zoom.toFixed(1)}×`;
    paintPreview();
    showMessage('Saved');
  });
  $('#fill').addEventListener('click', () => {
    Object.assign(state.panels[state.selected], { zoom: 1, panX: 0, panY: 0 });
    syncPanels();
    paintPreview();
    showMessage('Saved');
  });
  $('#clear').addEventListener('click', () => {
    state.panels[state.selected] = newPanel();
    syncPanels();
    paintPreview();
    showMessage('Panel cleared');
  });
  $('#title-input').addEventListener('input', (event) => { state.title = event.target.value; paintPreview(); showMessage(); });
  $('#subtitle-input').addEventListener('input', (event) => { state.subtitle = event.target.value; paintPreview(); showMessage(); });
  $('#title-size').addEventListener('input', (event) => {
    state.titleSize = Number(event.target.value);
    $('#size-value').textContent = `${state.titleSize}%`;
    paintPreview();
    showMessage();
  });
  document.querySelectorAll('.swatch').forEach((button) => button.addEventListener('click', () => {
    state.titleColor = button.dataset.color;
    document.querySelectorAll('.swatch').forEach((swatch) => swatch.classList.toggle('active', swatch === button));
    paintPreview();
    showMessage();
  }));
  document.querySelectorAll('.position').forEach((button) => button.addEventListener('click', () => {
    state.captionPosition = button.dataset.position;
    document.querySelectorAll('.position').forEach((item) => item.classList.toggle('active', item === button));
    paintPreview();
    showMessage();
  }));
  document.querySelectorAll('.grade-card').forEach((button) => button.addEventListener('click', () => {
    state.grade = button.dataset.grade;
    document.querySelectorAll('.grade-card').forEach((item) => item.classList.toggle('active', item === button));
    paintPreview();
    showMessage();
  }));
  $('#strength').addEventListener('input', (event) => {
    state.strength = Number(event.target.value);
    $('#strength-value').textContent = `${state.strength}%`;
    paintPreview();
    showMessage();
  });
  $('#vignette').addEventListener('change', (event) => { state.vignette = event.target.checked; paintPreview(); showMessage(); });
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  canvas.addEventListener('pointerdown', (event) => {
    const index = pointerPanel(event);
    if (index < 0) return;
    selectPanel(index);
    if (!state.panels[index].image) return;
    dragging = true;
    lastX = event.clientX;
    lastY = event.clientY;
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    const box = canvas.getBoundingClientRect();
    const panel = state.panels[state.selected];
    panel.panX += (event.clientX - lastX) / box.width;
    panel.panY += (event.clientY - lastY) / box.height;
    lastX = event.clientX;
    lastY = event.clientY;
    paintPreview();
  });
  const stopDrag = () => { dragging = false; };
  canvas.addEventListener('pointerup', stopDrag);
  canvas.addEventListener('pointercancel', stopDrag);
  canvas.addEventListener('dragover', (event) => event.preventDefault());
  canvas.addEventListener('drop', (event) => {
    event.preventDefault();
    const file = [...event.dataTransfer.files].find((item) => item.type.startsWith('image/'));
    const index = pointerPanel(event);
    if (file && index >= 0) setPanelPhoto(index, URL.createObjectURL(file), file.name);
  });
  $('#export').addEventListener('click', exportPoster);
  $('#export-bottom').addEventListener('click', exportPoster);
  syncLayout();
  updateSize(state.size);
}

function exportPoster() {
  const [width, height] = state.size.split('x').map(Number);
  const output = document.createElement('canvas');
  paintPoster(output, state, width, height);
  downloadCanvas(output, width, height);
}

function downloadCanvas(output, width, height) {
  output.toBlob((blob) => {
    if (!blob) {
      showMessage('Export failed');
      return;
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cover-${width}x${height}.png`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    showMessage(`Saved cover-${width}x${height}.png`);
  }, 'image/png');
}

async function prepareShot(scene) {
  await document.fonts.ready;
  state.layout = scene.layout;
  state.size = scene.size;
  state.title = scene.caption;
  state.subtitle = scene.mode === 'editor' ? 'SUNSET HEIST' : (scene.caption.toUpperCase() === 'SUNSET HEIST' ? 'VICE CITY  ·  FL' : 'SUNSET HEIST');
  state.grade = scene.grade;
  const fileNames = scene.photo.split(',').map((name) => name.trim());
  const count = PANEL_TITLES[state.layout].length;
  state.panels = Array.from({ length: count }, newPanel);
  for (let index = 0; index < count; index++) {
    const photo = fileNames[Math.min(index, fileNames.length - 1)];
    if (photo) {
      const path = photo.startsWith('samples/') ? photo : `samples/${photo}`;
      try {
        const loaded = await loadImage(path, SAMPLE_NAMES[photo.replace('samples/', '')] || photo);
        state.panels[index] = { ...newPanel(), ...loaded };
      } catch (error) {
        console.error(error);
      }
    }
  }
  return count;
}

const scene = readShotScene();
if (scene?.mode === 'cover') {
  document.body.classList.add('cover-shot');
  document.querySelector('#editor').hidden = true;
  $('#shot-stage').hidden = false;
  await prepareShot(scene);
  const canvas = $('#shot-canvas');
  const [width, height] = scene.size.split('x').map(Number);
  paintPoster(canvas, state, width, height);
  window.__exportCover = () => downloadCanvas(canvas, width, height);
  announceShotPainted();
} else {
  if (scene?.mode === 'editor') {
    state.size = scene.size;
    state.layout = scene.layout;
    state.title = scene.caption;
  }
  await document.fonts.ready;
  initEditor();
  if (scene?.mode === 'editor') {
    await prepareShot(scene);
    syncLayout();
    updateSize(scene.size);
    announceShotPainted();
  } else {
    window.__shotReady = true;
  }
}
