export const LAYOUTS = {
  classic: { name: 'VICE CLASSIC', labels: ['HERO', 'SIDE A', 'SIDE B'] },
  double: { name: 'DOUBLE TAKE', labels: ['FRAME A', 'FRAME B'] },
  strip: { name: 'SUNSET STRIP', labels: ['STRIP 01', 'STRIP 02', 'STRIP 03', 'STRIP 04'] },
};

const clamp = (number, low, high) => Math.min(high, Math.max(low, number));

export function panelRects(layout, width, height, gutter) {
  const gap = Math.max(2, gutter);
  if (layout === 'double') {
    const part = (width - gap * 3) / 2;
    return [{ x: gap, y: gap, w: part, h: height - gap * 2 }, { x: gap * 2 + part, y: gap, w: part, h: height - gap * 2 }];
  }
  if (layout === 'strip') {
    const part = (width - gap * 5) / 4;
    return Array.from({ length: 4 }, (_, index) => ({ x: gap + index * (part + gap), y: gap, w: part, h: height - gap * 2 }));
  }
  const left = (width - gap * 3) * 0.61;
  const right = width - gap * 3 - left;
  const sideHeight = (height - gap * 3) / 2;
  return [
    { x: gap, y: gap, w: left, h: height - gap * 2 },
    { x: gap * 2 + left, y: gap, w: right, h: sideHeight },
    { x: gap * 2 + left, y: gap * 2 + sideHeight, w: right, h: sideHeight },
  ];
}

function imagePanel(ctx, rect, panel, index) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  if (panel?.image?.complete && panel.image.naturalWidth) {
    const image = panel.image;
    const coverScale = Math.max(rect.w / image.naturalWidth, rect.h / image.naturalHeight);
    const scale = coverScale * (panel.zoom || 1);
    const drawWidth = image.naturalWidth * scale;
    const drawHeight = image.naturalHeight * scale;
    const x = rect.x + (rect.w - drawWidth) / 2 + (panel.panX || 0) * rect.w;
    const y = rect.y + (rect.h - drawHeight) / 2 + (panel.panY || 0) * rect.h;
    ctx.drawImage(image, x, y, drawWidth, drawHeight);
    const shine = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
    shine.addColorStop(0, '#170d1b1f');
    shine.addColorStop(.55, '#00000000');
    shine.addColorStop(1, '#0b081743');
    ctx.fillStyle = shine;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  } else {
    const empty = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
    empty.addColorStop(0, index % 2 ? '#382137' : '#46263c');
    empty.addColorStop(.55, '#d55a77');
    empty.addColorStop(1, '#f1a85d');
    ctx.fillStyle = empty;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = '#fff2e7';
    ctx.globalAlpha = .35;
    ctx.beginPath();
    ctx.arc(rect.x + rect.w * .72, rect.y + rect.h * .25, Math.min(rect.w, rect.h) * .12, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#180f1a';
    ctx.font = `700 ${Math.max(12, rect.w * .042)}px Archivo, Arial, sans-serif`;
    ctx.fillText('DROP A PHOTO', rect.x + rect.w * .08, rect.y + rect.h * .82);
    ctx.fillStyle = '#ffffffb8';
    ctx.font = `600 ${Math.max(9, rect.w * .018)}px Archivo, Arial, sans-serif`;
    ctx.fillText('YOUR SCENE STARTS HERE', rect.x + rect.w * .08, rect.y + rect.h * .87);
  }
  ctx.restore();
}

function gradePoster(ctx, width, height, state) {
  const amount = clamp((state.strength ?? 68) / 100, 0, 1);
  if (amount > 0) {
    ctx.save();
    ctx.globalAlpha = amount;
    ctx.globalCompositeOperation = 'soft-light';
    const tint = ctx.createLinearGradient(0, height * .04, width, height);
    if (state.grade === 'neon') {
      tint.addColorStop(0, '#18d8d0');
      tint.addColorStop(.45, '#7e4079');
      tint.addColorStop(1, '#ff3781');
      ctx.fillStyle = tint;
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = amount * .16;
      const glow = ctx.createRadialGradient(width * .84, height * .18, 0, width * .84, height * .18, width * .5);
      glow.addColorStop(0, '#ff6bc6');
      glow.addColorStop(1, '#ff6bc600');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);
    } else if (state.grade === 'pastel') {
      tint.addColorStop(0, '#ffb9d1');
      tint.addColorStop(.5, '#efb3b8');
      tint.addColorStop(1, '#78dfce');
      ctx.fillStyle = tint;
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = amount * .1;
      ctx.fillStyle = '#fff0d4';
      ctx.fillRect(0, 0, width, height);
    } else {
      tint.addColorStop(0, '#df3f8a');
      tint.addColorStop(.42, '#ff8856');
      tint.addColorStop(.78, '#ffb65b');
      tint.addColorStop(1, '#433354');
      ctx.fillStyle = tint;
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = amount * .17;
      const warmth = ctx.createLinearGradient(0, 0, 0, height * .8);
      warmth.addColorStop(0, '#ffd896');
      warmth.addColorStop(.48, '#ff7c59');
      warmth.addColorStop(1, '#ff466300');
      ctx.fillStyle = warmth;
      ctx.fillRect(0, 0, width, height);
    }
    ctx.restore();
  }
  if (state.vignette) {
    const vignette = ctx.createRadialGradient(width * .5, height * .46, Math.min(width, height) * .24, width * .5, height * .5, Math.max(width, height) * .72);
    vignette.addColorStop(0, '#08040b00');
    vignette.addColorStop(.72, '#08040b22');
    vignette.addColorStop(1, '#08040bd1');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);
    ctx.save();
    ctx.globalCompositeOperation = 'soft-light';
    ctx.globalAlpha = .105;
    let seed = 827;
    const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    const count = Math.floor(width * height / 1450);
    for (let i = 0; i < count; i++) {
      const shade = random() > .5 ? 255 : 0;
      ctx.fillStyle = `rgba(${shade},${shade},${shade},${random() * .35})`;
      ctx.fillRect(random() * width, random() * height, Math.max(1, width / 800), Math.max(1, height / 800));
    }
    ctx.restore();
  }
}

function drawLettering(ctx, width, height, state) {
  const isStrips = state.layout === 'strip';
  const sideMargins = width * (isStrips ? .065 : .075);
  const title = (state.title || 'VICE CITY').trim().toUpperCase();
  const subtitle = (state.subtitle || '').trim();
  const size = Math.min(width * .125, height * .14) * (state.titleSize || 100) / 100;
  const safeSize = Math.max(22, size);
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `${safeSize}px Anton, Impact, sans-serif`;
  let titleSize = safeSize;
  while (ctx.measureText(title).width > width - sideMargins * 2 && titleSize > 14) {
    titleSize *= .94;
    ctx.font = `${titleSize}px Anton, Impact, sans-serif`;
  }
  const top = state.captionPosition !== 'bottom';
  const baseline = top ? height * .205 : height * .865;
  const subtitleY = top ? baseline + titleSize * .37 : baseline + titleSize * .38;
  const upperShadow = ctx.createLinearGradient(0, top ? 0 : height * .62, 0, top ? height * .37 : height);
  upperShadow.addColorStop(0, '#07050b9c');
  upperShadow.addColorStop(.72, '#07050b31');
  upperShadow.addColorStop(1, '#07050b00');
  ctx.fillStyle = upperShadow;
  ctx.fillRect(0, top ? 0 : height * .61, width, height * .39);
  ctx.shadowColor = '#100b16cc';
  ctx.shadowBlur = Math.max(8, width * .016);
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = Math.max(4, width * .006);
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#17101b';
  ctx.lineWidth = Math.max(5, titleSize * .115);
  ctx.strokeText(title, sideMargins, baseline, width - sideMargins * 2);
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = state.titleColor || '#fffaf3';
  ctx.fillText(title, sideMargins, baseline, width - sideMargins * 2);
  const accent = state.titleColor || '#fffaf3';
  if (subtitle) {
    ctx.font = `700 ${Math.max(13, width * .021)}px Archivo, Arial, sans-serif`;
    ctx.letterSpacing = `${Math.max(1, width * .0018)}px`;
    ctx.fillStyle = '#fffaf3';
    ctx.shadowColor = '#0c0811';
    ctx.shadowBlur = Math.max(4, width * .007);
    ctx.fillText(subtitle, sideMargins + 2, subtitleY, width - sideMargins * 2);
    ctx.shadowColor = 'transparent';
  }
  const lineY = top ? subtitleY + Math.max(10, width * .024) : baseline + Math.max(11, width * .022);
  ctx.fillStyle = accent;
  ctx.fillRect(sideMargins, lineY, Math.max(31, width * .052), Math.max(2, width * .003));
  ctx.fillStyle = '#fffaf3d9';
  ctx.font = `700 ${Math.max(8, width * .009)}px Archivo, Arial, sans-serif`;
  ctx.letterSpacing = `${Math.max(1, width * .002)}px`;
  ctx.textAlign = 'right';
  ctx.fillText('VICE DISTRICT  ·  FL', width - sideMargins, height * .955);
  ctx.textAlign = 'left';
  ctx.fillText('NO. 06  /  AFTER DARK', sideMargins, height * .955);
  ctx.restore();
}

export function paintPoster(canvas, state, width = canvas.width, height = canvas.height) {
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: false });
  ctx.fillStyle = '#f8f1e8';
  ctx.fillRect(0, 0, width, height);
  const gutter = Math.max(3, Math.round(Math.min(width, height) * .0065));
  const rects = panelRects(state.layout, width, height, gutter);
  rects.forEach((rect, index) => imagePanel(ctx, rect, state.panels[index], index));
  gradePoster(ctx, width, height, state);
  drawLettering(ctx, width, height, state);
  ctx.save();
  ctx.strokeStyle = '#fffaf3';
  ctx.lineWidth = Math.max(2, gutter * .7);
  ctx.strokeRect(gutter / 2, gutter / 2, width - gutter, height - gutter);
  ctx.restore();
  return rects;
}
