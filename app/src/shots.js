const SIZES = ['1080x1080', '1080x1350', '1920x1080'];

export function readShotScene() {
  const query = new URLSearchParams(location.search);
  const mode = query.get('shot');
  if (mode !== 'cover' && mode !== 'editor') return null;
  const requested = query.get('size') || (mode === 'cover' ? '1920x1080' : '1080x1350');
  const size = SIZES.includes(requested) ? requested : '1920x1080';
  const layoutNames = { 'vice-classic': 'classic', classic: 'classic', 'double-take': 'double', double: 'double', 'sunset-strip': 'strip', strip: 'strip' };
  return {
    mode,
    layout: layoutNames[(query.get('layout') || 'classic').toLowerCase()] || 'classic',
    photo: query.get('photo') || (mode === 'editor' ? 'neon-portrait.jpg' : 'sunset-drive.jpg'),
    caption: query.get('caption') || (mode === 'editor' ? 'VICE CITY' : 'VICE CITY'),
    size,
    grade: query.get('grade') || 'sunset',
  };
}

export function announceShotPainted() {
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
