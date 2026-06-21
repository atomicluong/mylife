import React, { useState, useEffect, useRef } from 'react';
import {
  Undo2, Redo2, Save, Plus, Trash2,
  Eraser, ChevronLeft, ZoomIn, ZoomOut, Maximize2,
  Check, Menu, MousePointer2, Minus, Square, Download,
  Circle as CircleIcon,
} from 'lucide-react';
import { notesDb } from '../utils/notesDb';

const DEFAULT_PRESETS = [
  { type: 'pen',         color: '#1a1a2e', width: 2,  label: 'Mảnh' },
  { type: 'pen',         color: '#1e40af', width: 3,  label: 'Xanh' },
  { type: 'pen',         color: '#dc2626', width: 3,  label: 'Đỏ' },
  { type: 'pen',         color: '#15803d', width: 2,  label: 'Lá' },
  { type: 'highlighter', color: '#fbbf24', width: 12, label: 'Vàng' },
  { type: 'highlighter', color: '#86efac', width: 12, label: 'Xanh HL' },
];

const COLORS = [
  '#000000','#374151','#6b7280','#d1d5db',
  '#1e40af','#2563eb','#60a5fa','#bfdbfe',
  '#dc2626','#ef4444','#fca5a5','#fee2e2',
  '#15803d','#16a34a','#86efac','#dcfce7',
  '#92400e','#d97706','#fbbf24','#fef9c3',
  '#7c3aed','#8b5cf6','#c4b5fd','#ede9fe',
  '#be185d','#ec4899','#f9a8d4','#fce7f3',
  '#FFFFFF',
];

// Canvas background configs
const BG_OPTIONS = [
  { id: 'blank',       label: 'Trắng',              base: '#FEFDF8' },
  { id: 'dots',        label: 'Chấm bi',             base: '#FEFDF8' },
  { id: 'lines',       label: 'Dòng kẻ',             base: '#FEFDF8' },
  { id: 'grid',        label: 'Lưới ô',              base: '#FEFDF8' },
  { id: 'aged_plain',  label: 'Sách cũ — Trơn',      base: '#f2e8ce' },
  { id: 'aged',        label: 'Sách cũ — Kẻ dòng',   base: '#f2e8ce' },
  { id: 'aged_grid',   label: 'Sách cũ — Lưới',      base: '#f2e8ce' },
];

function ToolBtn({ active, onClick, title, children }) {
  return (
    <button onClick={onClick} title={title} style={{
      border: `2px solid ${active ? '#5c33c1' : 'transparent'}`,
      background: active ? '#ede9fb' : 'transparent',
      color: active ? '#5c33c1' : '#555',
      borderRadius: '7px', padding: '5px 7px', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'all 0.12s', minWidth: '32px', minHeight: '32px', flexShrink: 0,
    }}>
      {children}
    </button>
  );
}

function Sep() {
  return <div style={{ width: '1px', height: '28px', background: '#e5e5e5', margin: '0 6px', flexShrink: 0 }} />;
}

export default function HandwrittenNotes() {
  const [notes, setNotes]                     = useState([]);
  const [currentNoteId, setCurrentNoteId]     = useState(null);
  const [noteTitle, setNoteTitle]             = useState('');
  const [isEditingTitle, setIsEditingTitle]   = useState(false);
  const [titleInput, setTitleInput]           = useState('');

  const [strokes, setStrokes]                 = useState([]);
  const [tool, setTool]                       = useState('pen');
  const [activePenPreset, setActivePenPreset] = useState(0);
  const [penPresets]                          = useState(DEFAULT_PRESETS);
  const [color, setColor]                     = useState('#1a1a2e');
  const [lineWidth, setLineWidth]             = useState(3);
  const [background, setBackground]           = useState('dots');

  const [offsetX, setOffsetX]                 = useState(0);
  const [offsetY, setOffsetY]                 = useState(0);
  const [zoomScale, setZoomScale]             = useState(1);

  const [selectedIds, setSelectedIds]         = useState(new Set());
  const [saveStatus, setSaveStatus]           = useState('idle');
  const [isSidebarOpen, setIsSidebarOpen]     = useState(false);

  // Picker popups use position:fixed to escape overflowX:auto clipping
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [colorPickerPos, setColorPickerPos]   = useState({ top: 0, left: 0 });
  const [showBgPicker, setShowBgPicker]       = useState(false);
  const [bgPickerPos, setBgPickerPos]         = useState({ top: 0, left: 0 });
  const colorBtnRef = useRef(null);
  const bgBtnRef    = useRef(null);

  const [history, setHistory]                 = useState([[]]);
  const [historyIndex, setHistoryIndex]       = useState(0);

  // Canvas refs
  const canvasRef        = useRef(null);
  const containerRef     = useRef(null);
  const isDrawing        = useRef(false);
  const currentPoints    = useRef([]);
  const shapeStart       = useRef(null);
  const lassoPath        = useRef([]);
  const lastPointerPos   = useRef({ x: 0, y: 0 });
  const activePointers   = useRef(new Map());
  const initialPinchDist = useRef(0);
  const initialPinchZoom = useRef(1);
  const hasErased        = useRef(false);
  // Snapshot for low-latency live drawing (avoids full re-render on every pointermove)
  const snapshotRef      = useRef(null);

  // Mirror every state value into a ref for use inside event handlers
  const strokesRef      = useRef(strokes);
  const offsetXRef      = useRef(offsetX);
  const offsetYRef      = useRef(offsetY);
  const zoomRef         = useRef(zoomScale);
  const toolRef         = useRef(tool);
  const colorRef        = useRef(color);
  const lwRef           = useRef(lineWidth);
  const bgRef           = useRef(background);
  const selRef          = useRef(selectedIds);
  const histRef         = useRef(history);
  const histIdxRef      = useRef(historyIndex);

  useEffect(() => { strokesRef.current  = strokes; },       [strokes]);
  useEffect(() => { offsetXRef.current  = offsetX; },       [offsetX]);
  useEffect(() => { offsetYRef.current  = offsetY; },       [offsetY]);
  useEffect(() => { zoomRef.current     = zoomScale; },     [zoomScale]);
  useEffect(() => { toolRef.current     = tool; },          [tool]);
  useEffect(() => { colorRef.current    = color; },         [color]);
  useEffect(() => { lwRef.current       = lineWidth; },     [lineWidth]);
  useEffect(() => { bgRef.current       = background; },    [background]);
  useEffect(() => { selRef.current      = selectedIds; },   [selectedIds]);
  useEffect(() => { histRef.current     = history; },       [history]);
  useEffect(() => { histIdxRef.current  = historyIndex; },  [historyIndex]);

  // ── DB ──────────────────────────────────────────────────────────────
  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      const all = await notesDb.getAllNotes();
      setNotes(all);
      if (all.length > 0) { if (!currentNoteId) openNote(all[0]); }
      else createNote();
    } catch (e) { console.error(e); }
  };

  const openNote = (note) => {
    setCurrentNoteId(note.id);
    setNoteTitle(note.title);   setTitleInput(note.title);
    setStrokes(note.strokes || []);
    setOffsetX(note.offsetX || 0);   setOffsetY(note.offsetY || 0);
    setZoomScale(note.zoomScale || 1);
    setBackground(note.background || 'dots');
    setSelectedIds(new Set());
    setHistory([note.strokes || []]);  setHistoryIndex(0);
    setIsSidebarOpen(false);
  };

  const createNote = async () => {
    const note = {
      id: Math.random().toString(36).slice(2),
      title: `Ghi chú ${new Date().toLocaleDateString('vi-VN')}`,
      strokes: [], offsetX: 0, offsetY: 0, zoomScale: 1,
      background: 'dots', updatedAt: Date.now(),
    };
    try { await notesDb.saveNote(note); await loadAll(); openNote(note); }
    catch (e) { console.error(e); }
  };

  const deleteNote = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Xóa ghi chú này?')) return;
    try {
      await notesDb.deleteNote(id);
      const rest = notes.filter(n => n.id !== id);
      setNotes(rest);
      if (currentNoteId === id) rest.length > 0 ? openNote(rest[0]) : createNote();
    } catch (e) { console.error(e); }
  };

  const save = async (overrideStrokes) => {
    if (!currentNoteId) return;
    setSaveStatus('saving');
    try {
      await notesDb.saveNote({
        id: currentNoteId, title: noteTitle,
        strokes: overrideStrokes ?? strokesRef.current,
        offsetX: offsetXRef.current, offsetY: offsetYRef.current,
        zoomScale: zoomRef.current, background: bgRef.current,
        updatedAt: Date.now(),
      });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
      const all = await notesDb.getAllNotes();
      setNotes(all);
    } catch (e) { setSaveStatus('error'); setTimeout(() => setSaveStatus('idle'), 3000); }
  };

  const renameNote = async () => {
    if (!titleInput.trim()) return;
    setNoteTitle(titleInput);  setIsEditingTitle(false);
    if (currentNoteId) {
      await notesDb.saveNote({
        id: currentNoteId, title: titleInput,
        strokes: strokesRef.current,
        offsetX: offsetXRef.current, offsetY: offsetYRef.current,
        zoomScale: zoomRef.current, background: bgRef.current,
        updatedAt: Date.now(),
      });
      setNotes(await notesDb.getAllNotes());
    }
  };

  useEffect(() => {
    if (!currentNoteId) return;
    const t = setTimeout(() => save(), 8000);
    return () => clearTimeout(t);
  }, [strokes, offsetX, offsetY, zoomScale, background]);

  // ── History ─────────────────────────────────────────────────────────
  const pushHistory = (next) => {
    const h = histRef.current.slice(0, histIdxRef.current + 1);
    h.push(next);
    setHistory(h);  setHistoryIndex(h.length - 1);
  };

  const undo = () => {
    if (histIdxRef.current > 0) {
      const i = histIdxRef.current - 1;
      setHistoryIndex(i);  setStrokes(histRef.current[i]);  setSelectedIds(new Set());
    }
  };

  const redo = () => {
    if (histIdxRef.current < histRef.current.length - 1) {
      const i = histIdxRef.current + 1;
      setHistoryIndex(i);  setStrokes(histRef.current[i]);  setSelectedIds(new Set());
    }
  };

  // ── Canvas helpers ───────────────────────────────────────────────────
  const toWorld = (clientX, clientY) => {
    const r = canvasRef.current?.getBoundingClientRect();
    if (!r) return { worldX: 0, worldY: 0 };
    return {
      worldX: (clientX - r.left - offsetXRef.current) / zoomRef.current,
      worldY: (clientY - r.top  - offsetYRef.current) / zoomRef.current,
    };
  };

  // Snapshot: captures the committed canvas state so pointermove can restore + draw cheaply
  const takeSnapshot = () => {
    const c = canvasRef.current;
    if (!c) return;
    snapshotRef.current = c.getContext('2d').getImageData(0, 0, c.width, c.height);
  };

  const restoreSnapshot = () => {
    const c = canvasRef.current;
    if (!c || !snapshotRef.current) return false;
    c.getContext('2d').putImageData(snapshotRef.current, 0, 0);
    return true;
  };

  // ── Full render (committed state) ────────────────────────────────────
  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.width / dpr, H = canvas.height / dpr;

    ctx.clearRect(0, 0, W, H);

    const bg = bgRef.current;
    const baseBg = BG_OPTIONS.find(b => b.id === bg)?.base ?? '#FEFDF8';
    ctx.fillStyle = baseBg;
    ctx.fillRect(0, 0, W, H);

    drawBackground(ctx, W, H);

    ctx.save();
    ctx.translate(offsetXRef.current, offsetYRef.current);
    ctx.scale(zoomRef.current, zoomRef.current);

    paintStrokes(ctx, strokesRef.current);

    // Selection highlight
    if (selRef.current.size > 0) {
      strokesRef.current.forEach(s => {
        if (!selRef.current.has(s.id)) return;
        ctx.save();
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = (s.width + 8) / zoomRef.current;
        ctx.globalAlpha = 0.22;
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        if (s.points.length > 1) {
          ctx.beginPath();
          s.points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
          ctx.stroke();
        }
        ctx.restore();
      });
    }
    ctx.restore();
  };

  // ── Live draw (called on pointermove — restores snapshot then draws current stroke) ──
  const drawLive = () => {
    if (!restoreSnapshot()) { renderCanvas(); return; }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const t = toolRef.current;

    ctx.save();
    ctx.translate(offsetXRef.current, offsetYRef.current);
    ctx.scale(zoomRef.current, zoomRef.current);

    if (t === 'lasso' && lassoPath.current.length > 1) {
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 1.5 / zoomRef.current;
      ctx.setLineDash([5 / zoomRef.current, 4 / zoomRef.current]);
      ctx.fillStyle = 'rgba(37,99,235,0.06)';
      ctx.beginPath();
      lassoPath.current.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
      ctx.closePath();
      ctx.fill(); ctx.stroke();

    } else if ((t === 'line' || t === 'rect' || t === 'circle') && shapeStart.current && currentPoints.current.length > 0) {
      const s = shapeStart.current, e = currentPoints.current[0];
      ctx.strokeStyle = colorRef.current;
      ctx.lineWidth = lwRef.current;
      ctx.lineCap = 'round';
      ctx.setLineDash([6 / zoomRef.current, 4 / zoomRef.current]);
      ctx.beginPath();
      if (t === 'line') { ctx.moveTo(s.x, s.y); ctx.lineTo(e.x, e.y); }
      else if (t === 'rect') { ctx.rect(s.x, s.y, e.x - s.x, e.y - s.y); }
      else { ctx.ellipse((s.x + e.x) / 2, (s.y + e.y) / 2, Math.abs(e.x - s.x) / 2, Math.abs(e.y - s.y) / 2, 0, 0, Math.PI * 2); }
      ctx.stroke();

    } else if (currentPoints.current.length > 0) {
      paintStrokes(ctx, [{
        type: t === 'highlighter' ? 'highlighter' : 'pen',
        color: colorRef.current, width: lwRef.current,
        points: currentPoints.current,
      }]);
    }

    ctx.restore();
  };

  const drawBackground = (ctx, W, H) => {
    const bg = bgRef.current;
    if (bg === 'blank') return;

    const spacing = 24 * zoomRef.current;
    const sx = (offsetXRef.current % spacing) - spacing;
    const sy = (offsetYRef.current % spacing) - spacing;
    ctx.save();

    if (bg === 'dots') {
      ctx.fillStyle = 'rgba(0,0,0,0.13)';
      const r = Math.max(0.7, 1.2 * Math.min(zoomRef.current, 1.5));
      for (let x = sx; x < W + spacing; x += spacing)
        for (let y = sy; y < H + spacing; y += spacing) {
          ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        }

    } else if (bg === 'lines') {
      ctx.strokeStyle = 'rgba(0,0,0,0.09)';
      ctx.lineWidth = 0.8;
      for (let y = sy; y < H + spacing; y += spacing) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }
      const mx = 48 * zoomRef.current + offsetXRef.current;
      ctx.strokeStyle = 'rgba(220,80,80,0.22)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(mx, 0); ctx.lineTo(mx, H); ctx.stroke();

    } else if (bg === 'grid') {
      ctx.strokeStyle = 'rgba(0,0,0,0.08)';
      ctx.lineWidth = 0.8;
      for (let x = sx; x < W + spacing; x += spacing) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = sy; y < H + spacing; y += spacing) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }

    } else if (bg === 'aged_plain' || bg === 'aged' || bg === 'aged_grid') {
      // Shared aged vignette
      const grad = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.9);
      grad.addColorStop(0, 'rgba(160,110,50,0)');
      grad.addColorStop(1, 'rgba(120,75,20,0.1)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      if (bg === 'aged') {
        // Kẻ dòng + lề đỏ
        const lineSpacing = 22 * zoomRef.current;
        const ly = (offsetYRef.current % lineSpacing) - lineSpacing;
        ctx.strokeStyle = 'rgba(140,100,50,0.13)';
        ctx.lineWidth = 0.7;
        for (let y = ly; y < H + lineSpacing; y += lineSpacing) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
        }
        const mx = 48 * zoomRef.current + offsetXRef.current;
        ctx.strokeStyle = 'rgba(180,70,40,0.22)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(mx, 0); ctx.lineTo(mx, H); ctx.stroke();

      } else if (bg === 'aged_grid') {
        // Lưới ô sepia
        const gs = 22 * zoomRef.current;
        const gx = (offsetXRef.current % gs) - gs;
        const gy = (offsetYRef.current % gs) - gs;
        ctx.strokeStyle = 'rgba(140,100,50,0.11)';
        ctx.lineWidth = 0.7;
        for (let x = gx; x < W + gs; x += gs) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
        }
        for (let y = gy; y < H + gs; y += gs) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
        }
      }
      // aged_plain: chỉ vignette, không có đường kẻ
    }

    ctx.restore();
  };

  const paintStrokes = (ctx, list) => {
    list.forEach(stroke => {
      if (!stroke.points?.length) return;
      ctx.save();
      if (stroke.type === 'highlighter') {
        ctx.globalAlpha = 0.38;
        ctx.globalCompositeOperation = 'multiply';
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.width * 2.5;
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        const pts = stroke.points;
        ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length - 1; i++) {
          const xc = (pts[i].x + pts[i + 1].x) / 2;
          const yc = (pts[i].y + pts[i + 1].y) / 2;
          ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
        }
        if (pts.length > 1) ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
        ctx.stroke();
      } else {
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.strokeStyle = stroke.color;
        const pts = stroke.points;
        if (pts.length === 1) {
          ctx.fillStyle = stroke.color;
          ctx.beginPath(); ctx.arc(pts[0].x, pts[0].y, stroke.width / 2, 0, Math.PI * 2); ctx.fill();
        } else {
          for (let i = 1; i < pts.length; i++) {
            const p1 = pts[i - 1], p2 = pts[i];
            const pressure = ((p1.p ?? 0.5) + (p2.p ?? 0.5)) / 2;
            ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y);
            ctx.lineWidth = Math.max(0.5, stroke.width * (0.4 + pressure * 1.2));
            ctx.stroke();
          }
        }
      }
      ctx.restore();
    });
  };

  const renderRef = useRef(renderCanvas);
  renderRef.current = renderCanvas;

  // Resize canvas when container changes
  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current, cont = containerRef.current;
      if (!canvas || !cont) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width  = cont.clientWidth  * dpr;
      canvas.height = cont.clientHeight * dpr;
      canvas.style.width  = `${cont.clientWidth}px`;
      canvas.style.height = `${cont.clientHeight}px`;
      canvas.getContext('2d').scale(dpr, dpr);
      renderRef.current();
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // Full re-render when committed state changes
  useEffect(() => { renderRef.current(); snapshotRef.current = null; },
    [strokes, offsetX, offsetY, zoomScale, background, selectedIds]);

  // Mouse-wheel zoom
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
      setZoomScale(prev => Math.max(0.15, Math.min(6, prev * factor)));
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, []);

  // Close popups on outside click
  useEffect(() => {
    if (!showColorPicker && !showBgPicker) return;
    const close = () => { setShowColorPicker(false); setShowBgPicker(false); };
    const t = setTimeout(() => document.addEventListener('pointerdown', close), 10);
    return () => { clearTimeout(t); document.removeEventListener('pointerdown', close); };
  }, [showColorPicker, showBgPicker]);

  // ── Eraser ───────────────────────────────────────────────────────────
  const erase = (wx, wy) => {
    const threshold = 18 / zoomRef.current;
    const remaining = strokesRef.current.filter(s => {
      const hit = s.points.some(p => {
        const dx = p.x - wx, dy = p.y - wy;
        return dx * dx + dy * dy < threshold * threshold;
      });
      if (hit) hasErased.current = true;
      return !hit;
    });
    if (remaining.length !== strokesRef.current.length) setStrokes(remaining);
  };

  // ── Lasso ────────────────────────────────────────────────────────────
  const finalizeLasso = (path) => {
    if (path.length < 3) return;
    const xs = path.map(p => p.x), ys = path.map(p => p.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const ids = new Set();
    strokesRef.current.forEach(s => {
      if (s.points.some(p => p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY))
        ids.add(s.id);
    });
    setSelectedIds(ids);
  };

  const deleteSelected = () => {
    const remaining = strokesRef.current.filter(s => !selRef.current.has(s.id));
    setStrokes(remaining); pushHistory(remaining); setSelectedIds(new Set());
  };

  // ── Shape → points ───────────────────────────────────────────────────
  const shapeToPoints = (t, s, e) => {
    if (t === 'line') return [{ x: s.x, y: s.y, p: 0.5 }, { x: e.x, y: e.y, p: 0.5 }];
    if (t === 'rect') return [
      { x: s.x, y: s.y, p: 0.5 }, { x: e.x, y: s.y, p: 0.5 },
      { x: e.x, y: e.y, p: 0.5 }, { x: s.x, y: e.y, p: 0.5 },
      { x: s.x, y: s.y, p: 0.5 },
    ];
    if (t === 'circle') {
      const rx = Math.abs(e.x - s.x) / 2, ry = Math.abs(e.y - s.y) / 2;
      const cx = (s.x + e.x) / 2, cy = (s.y + e.y) / 2;
      return Array.from({ length: 65 }, (_, i) => {
        const a = (i / 64) * Math.PI * 2;
        return { x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a), p: 0.5 };
      });
    }
    return [];
  };

  // ── Pointer events ───────────────────────────────────────────────────
  const onPointerDown = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    lastPointerPos.current = { x: e.clientX, y: e.clientY };

    const { worldX, worldY } = toWorld(e.clientX, e.clientY);

    if (activePointers.current.size >= 2) {
      isDrawing.current = false; currentPoints.current = [];
      const [id1, id2] = Array.from(activePointers.current.keys());
      const p1 = activePointers.current.get(id1), p2 = activePointers.current.get(id2);
      initialPinchDist.current = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      initialPinchZoom.current = zoomRef.current;
      return;
    }

    if (e.pointerType === 'touch') { isDrawing.current = false; return; }
    if (toolRef.current === 'hand' || e.buttons === 4) { isDrawing.current = false; return; }

    const t = toolRef.current;

    // Clear selection immediately in ref so snapshot doesn't include highlight
    if (t !== 'lasso') { selRef.current = new Set(); setSelectedIds(new Set()); }

    isDrawing.current = true;
    hasErased.current = false;

    // Full render + snapshot so live drawing is cheap
    renderRef.current();
    takeSnapshot();

    if (t === 'lasso') {
      lassoPath.current = [{ x: worldX, y: worldY }];
    } else if (t === 'line' || t === 'rect' || t === 'circle') {
      shapeStart.current = { x: worldX, y: worldY };
      currentPoints.current = [{ x: worldX, y: worldY }];
    } else if (t === 'eraser') {
      erase(worldX, worldY);
    } else {
      const pressure = e.pressure > 0 ? e.pressure : 0.5;
      currentPoints.current = [{ x: worldX, y: worldY, p: pressure }];
      drawLive();
    }
  };

  const onPointerMove = (e) => {
    if (!activePointers.current.has(e.pointerId)) return;
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const { worldX, worldY } = toWorld(e.clientX, e.clientY);

    // Pinch zoom
    if (activePointers.current.size >= 2) {
      const [id1, id2] = Array.from(activePointers.current.keys());
      const p1 = activePointers.current.get(id1), p2 = activePointers.current.get(id2);
      const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      if (initialPinchDist.current > 0) {
        const nz = Math.max(0.15, Math.min(6, initialPinchZoom.current * (dist / initialPinchDist.current)));
        setZoomScale(nz);
      }
      const dx = e.clientX - lastPointerPos.current.x;
      const dy = e.clientY - lastPointerPos.current.y;
      setOffsetX(p => p + dx / 2);  setOffsetY(p => p + dy / 2);
      lastPointerPos.current = { x: e.clientX, y: e.clientY };
      return;
    }

    // Finger pan
    if (e.pointerType === 'touch') {
      const dx = e.clientX - lastPointerPos.current.x;
      const dy = e.clientY - lastPointerPos.current.y;
      setOffsetX(p => p + dx);  setOffsetY(p => p + dy);
      lastPointerPos.current = { x: e.clientX, y: e.clientY };
      return;
    }

    // Hand tool / middle mouse pan
    if (toolRef.current === 'hand' || e.buttons === 4) {
      const dx = e.clientX - lastPointerPos.current.x;
      const dy = e.clientY - lastPointerPos.current.y;
      setOffsetX(p => p + dx);  setOffsetY(p => p + dy);
      lastPointerPos.current = { x: e.clientX, y: e.clientY };
      return;
    }

    if (!isDrawing.current) return;
    const t = toolRef.current;

    if (t === 'lasso') {
      lassoPath.current.push({ x: worldX, y: worldY });
      drawLive();
    } else if (t === 'line' || t === 'rect' || t === 'circle') {
      currentPoints.current = [{ x: worldX, y: worldY }];
      drawLive();
    } else if (t === 'eraser') {
      erase(worldX, worldY);
    } else {
      const pressure = e.pressure > 0 ? e.pressure : 0.5;
      const pts = currentPoints.current;
      if (pts.length > 0) {
        const last = pts[pts.length - 1];
        if (Math.hypot(worldX - last.x, worldY - last.y) < 0.5) return; // lower threshold for smoother lines
      }
      currentPoints.current.push({ x: worldX, y: worldY, p: pressure });
      drawLive(); // fast: restore snapshot + draw current stroke only
    }
  };

  const onPointerUp = (e) => {
    canvasRef.current?.releasePointerCapture(e.pointerId);
    activePointers.current.delete(e.pointerId);
    if (activePointers.current.size < 2) initialPinchDist.current = 0;

    if (!isDrawing.current) return;
    isDrawing.current = false;
    snapshotRef.current = null;
    const t = toolRef.current;

    if (t === 'lasso') {
      finalizeLasso(lassoPath.current);
      lassoPath.current = [];
    } else if (t === 'eraser') {
      if (hasErased.current) pushHistory(strokesRef.current);
    } else if (t === 'line' || t === 'rect' || t === 'circle') {
      if (shapeStart.current && currentPoints.current.length > 0) {
        const pts = shapeToPoints(t, shapeStart.current, currentPoints.current[0]);
        if (pts.length > 0) {
          const ns = { id: Math.random().toString(36).slice(2), type: 'pen', color: colorRef.current, width: lwRef.current, points: pts };
          const next = [...strokesRef.current, ns];
          setStrokes(next); pushHistory(next);
        }
      }
      shapeStart.current = null; currentPoints.current = [];
    } else if (currentPoints.current.length > 0) {
      const ns = {
        id: Math.random().toString(36).slice(2),
        type: t === 'highlighter' ? 'highlighter' : 'pen',
        color: colorRef.current, width: lwRef.current,
        points: [...currentPoints.current],
      };
      const next = [...strokesRef.current, ns];
      setStrokes(next); pushHistory(next);
      currentPoints.current = [];
    }
  };

  const onPointerCancel = (e) => {
    activePointers.current.delete(e.pointerId);
    isDrawing.current = false;
    currentPoints.current = []; lassoPath.current = []; shapeStart.current = null;
    snapshotRef.current = null;
  };

  // ── Misc ─────────────────────────────────────────────────────────────
  const selectPreset = (idx) => {
    const p = penPresets[idx];
    setActivePenPreset(idx);
    setTool(p.type === 'highlighter' ? 'highlighter' : 'pen');
    setColor(p.color);
    setLineWidth(Math.round(p.width));
  };

  const zoom = (dir) => setZoomScale(prev => Math.max(0.15, Math.min(6, dir === 'in' ? prev * 1.25 : prev / 1.25)));
  const resetView = () => { setOffsetX(0); setOffsetY(0); setZoomScale(1); };

  const exportPng = () => {
    const url = canvasRef.current?.toDataURL('image/png');
    if (!url) return;
    const a = document.createElement('a');
    a.href = url; a.download = `${noteTitle || 'ghi-chu'}.png`; a.click();
  };

  const openColorPicker = (e) => {
    e.stopPropagation();
    const rect = colorBtnRef.current?.getBoundingClientRect();
    if (rect) setColorPickerPos({ top: rect.bottom + 6, left: rect.left });
    setShowColorPicker(v => !v);
    setShowBgPicker(false);
  };

  const openBgPicker = (e) => {
    e.stopPropagation();
    const rect = bgBtnRef.current?.getBoundingClientRect();
    if (rect) setBgPickerPos({ top: rect.bottom + 6, left: rect.left });
    setShowBgPicker(v => !v);
    setShowColorPicker(false);
  };

  const isPenActive = tool === 'pen' || tool === 'highlighter';
  const getCursor = () => tool === 'hand' ? 'grab' : tool === 'eraser' ? 'cell' : 'crosshair';

  // ── JSX ──────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', height: '100%', width: '100%', overflow: 'hidden', fontFamily: 'system-ui,-apple-system,sans-serif' }}>

      {/* ── SIDEBAR ── */}
      <div style={{ width: isSidebarOpen ? '240px' : '0px', transition: 'width 0.22s ease', overflow: 'hidden', flexShrink: 0, background: '#fff', borderRight: '1px solid #e8e8e8', display: 'flex', flexDirection: 'column' }}>
        <div style={{ width: '240px', height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '12px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 700, fontSize: '0.75rem', color: '#5c33c1', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Ghi chú</span>
            <button onClick={() => setIsSidebarOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#aaa', padding: '4px', borderRadius: '4px' }}>
              <ChevronLeft size={15} />
            </button>
          </div>
          <div style={{ padding: '8px' }}>
            <button onClick={createNote} style={{ width: '100%', padding: '7px 12px', background: '#5c33c1', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.76rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'center' }}>
              <Plus size={13} /> Tạo mới
            </button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '2px 8px' }}>
            {notes.map(note => {
              const active = note.id === currentNoteId;
              return (
                <div key={note.id} onClick={() => openNote(note)} style={{ padding: '8px 10px', borderRadius: '6px', cursor: 'pointer', marginBottom: '2px', background: active ? '#ede9fb' : 'transparent', borderLeft: `3px solid ${active ? '#5c33c1' : 'transparent'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: active ? 600 : 400, color: active ? '#5c33c1' : '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{note.title}</p>
                    <p style={{ margin: '2px 0 0', fontSize: '0.65rem', color: '#bbb' }}>{new Date(note.updatedAt).toLocaleDateString('vi-VN')}</p>
                  </div>
                  <button onClick={(e) => deleteNote(note.id, e)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ddd', padding: '2px', borderRadius: '4px', flexShrink: 0 }}
                    onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                    onMouseLeave={e => e.currentTarget.style.color = '#ddd'}>
                    <Trash2 size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── MAIN ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* Title bar */}
        <div style={{ background: '#fff', borderBottom: '1px solid #e8e8e8', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <button onClick={() => setIsSidebarOpen(v => !v)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#666', padding: '5px', borderRadius: '5px' }}>
            <Menu size={17} />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            {isEditingTitle
              ? <input value={titleInput} onChange={e => setTitleInput(e.target.value)} onBlur={renameNote} onKeyDown={e => e.key === 'Enter' && renameNote()} autoFocus
                  style={{ border: '1px solid #5c33c1', borderRadius: '4px', padding: '3px 8px', fontSize: '0.88rem', fontWeight: 600, outline: 'none', maxWidth: '280px', width: '100%' }} />
              : <span onClick={() => setIsEditingTitle(true)} style={{ fontSize: '0.88rem', fontWeight: 600, color: '#1a1a1a', cursor: 'text', padding: '3px 4px', borderRadius: '4px' }}>
                  {noteTitle || 'Ghi chú mới'}
                </span>
            }
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            <button onClick={undo} disabled={historyIndex <= 0} title="Undo" style={{ border: 'none', background: 'none', padding: '5px', borderRadius: '5px', cursor: historyIndex > 0 ? 'pointer' : 'default', color: historyIndex > 0 ? '#555' : '#d1d5db' }}>
              <Undo2 size={16} />
            </button>
            <button onClick={redo} disabled={historyIndex >= history.length - 1} title="Redo" style={{ border: 'none', background: 'none', padding: '5px', borderRadius: '5px', cursor: historyIndex < history.length - 1 ? 'pointer' : 'default', color: historyIndex < history.length - 1 ? '#555' : '#d1d5db' }}>
              <Redo2 size={16} />
            </button>
            <div style={{ width: '1px', height: '18px', background: '#e8e8e8', margin: '0 4px' }} />
            <button onClick={exportPng} title="Tải về PNG" style={{ border: 'none', background: 'none', padding: '5px', borderRadius: '5px', cursor: 'pointer', color: '#555' }}>
              <Download size={16} />
            </button>
            <button onClick={() => save()} style={{ border: 'none', background: '#5c33c1', color: '#fff', padding: '5px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.76rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              {saveStatus === 'saving'
                ? <span style={{ width: 12, height: 12, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'hn-spin 0.6s linear infinite' }} />
                : saveStatus === 'saved' ? <Check size={13} /> : <Save size={13} />}
              <span>{saveStatus === 'saved' ? 'Đã lưu' : 'Lưu'}</span>
            </button>
          </div>
        </div>

        {/* Tool ribbon — overflowX:auto; popups rendered via portal (position:fixed) */}
        <div style={{ background: '#fff', borderBottom: '1px solid #e8e8e8', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0, overflowX: 'auto' }}>
          <ToolBtn active={tool === 'lasso'} onClick={() => setTool('lasso')} title="Lasso chọn vùng"><MousePointer2 size={15} /></ToolBtn>
          <ToolBtn active={tool === 'hand'}  onClick={() => setTool('hand')}  title="Di chuyển"><span style={{ fontSize: '13px' }}>✋</span></ToolBtn>
          <Sep />

          {/* Pen presets */}
          {penPresets.map((preset, idx) => {
            const isActive = activePenPreset === idx && isPenActive;
            return (
              <button key={idx} onClick={() => selectPreset(idx)} title={preset.label} style={{
                border: `2px solid ${isActive ? '#5c33c1' : 'transparent'}`,
                background: isActive ? '#ede9fb' : 'transparent',
                borderRadius: '8px', padding: '3px 5px', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px', flexShrink: 0,
              }}>
                <svg width="32" height="18" viewBox="0 0 32 18" style={{ display: 'block' }}>
                  {preset.type === 'highlighter'
                    ? <path d="M2 13 Q16 9 30 13" stroke={preset.color} strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.5" />
                    : <path d="M2 15 Q12 3 30 7"  stroke={preset.color} strokeWidth={Math.min(preset.width * 1.4, 5)} strokeLinecap="round" fill="none" />}
                </svg>
                <span style={{ fontSize: '0.55rem', color: '#999', lineHeight: 1 }}>{preset.label}</span>
              </button>
            );
          })}
          <Sep />

          <ToolBtn active={tool === 'eraser'} onClick={() => setTool('eraser')} title="Tẩy"><Eraser size={15} /></ToolBtn>
          <Sep />
          <ToolBtn active={tool === 'line'}   onClick={() => setTool('line')}   title="Đường thẳng"><Minus size={15} /></ToolBtn>
          <ToolBtn active={tool === 'rect'}   onClick={() => setTool('rect')}   title="Hình chữ nhật"><Square size={15} /></ToolBtn>
          <ToolBtn active={tool === 'circle'} onClick={() => setTool('circle')} title="Hình tròn/Oval"><CircleIcon size={15} /></ToolBtn>
          <Sep />

          {/* Color button — opens fixed-position popup */}
          <button ref={colorBtnRef} onClick={openColorPicker} style={{ border: '1px solid #e8e8e8', borderRadius: '6px', padding: '5px 8px', cursor: 'pointer', background: '#fff', display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: color, border: '1px solid #ddd', flexShrink: 0 }} />
            <span style={{ fontSize: '0.72rem', color: '#555', whiteSpace: 'nowrap' }}>Màu</span>
          </button>

          {/* Size stepper: − number + */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
            <button
              onClick={() => setLineWidth(w => Math.max(1, Math.round(w) - 1))}
              style={{ width: '26px', height: '26px', border: '1px solid #e0e0e0', borderRadius: '6px', background: '#fafafa', cursor: 'pointer', fontSize: '14px', color: '#555', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
              −
            </button>
            <div style={{ minWidth: '34px', textAlign: 'center', fontSize: '0.8rem', fontWeight: 700, color: '#333', fontVariantNumeric: 'tabular-nums', userSelect: 'none' }}>
              {Math.round(lineWidth)}
            </div>
            <button
              onClick={() => setLineWidth(w => Math.min(20, Math.round(w) + 1))}
              style={{ width: '26px', height: '26px', border: '1px solid #e0e0e0', borderRadius: '6px', background: '#fafafa', cursor: 'pointer', fontSize: '14px', color: '#555', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
              +
            </button>
            <div style={{ width: `${Math.min(Math.max(4, Math.round(lineWidth) * 1.6), 20)}px`, height: `${Math.min(Math.max(4, Math.round(lineWidth) * 1.6), 20)}px`, borderRadius: '50%', background: color, border: '1px solid #ddd', flexShrink: 0, marginLeft: '4px' }} />
          </div>
          <Sep />

          {/* Background button */}
          <button ref={bgBtnRef} onClick={openBgPicker} style={{ border: '1px solid #e8e8e8', borderRadius: '6px', padding: '5px 9px', cursor: 'pointer', background: '#fff', fontSize: '0.72rem', color: '#555', whiteSpace: 'nowrap', flexShrink: 0 }}>
            Nền ▾
          </button>

          {/* Delete selected */}
          {selectedIds.size > 0 && (
            <>
              <Sep />
              <button onClick={deleteSelected} style={{ border: 'none', background: '#fef2f2', color: '#dc2626', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.74rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                <Trash2 size={13} /> Xóa {selectedIds.size} nét
              </button>
            </>
          )}
        </div>

        {/* Canvas */}
        <div ref={containerRef} style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <canvas ref={canvasRef} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerCancel}
            style={{ display: 'block', touchAction: 'none', cursor: getCursor() }} />

          {/* Zoom widget */}
          <div style={{ position: 'absolute', bottom: '16px', right: '16px', zIndex: 10, display: 'flex', alignItems: 'center', background: '#fff', border: '1px solid #e8e8e8', borderRadius: '8px', padding: '3px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
            <button onClick={() => zoom('out')} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#666', padding: '4px 5px', borderRadius: '5px' }}><ZoomOut size={14} /></button>
            <span onClick={resetView} style={{ fontSize: '0.72rem', color: '#555', fontWeight: 600, padding: '0 6px', cursor: 'pointer', fontVariantNumeric: 'tabular-nums', minWidth: '42px', textAlign: 'center' }}>
              {Math.round(zoomScale * 100)}%
            </span>
            <button onClick={() => zoom('in')} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#666', padding: '4px 5px', borderRadius: '5px' }}><ZoomIn size={14} /></button>
            <div style={{ width: '1px', height: '14px', background: '#e8e8e8', margin: '0 2px' }} />
            <button onClick={resetView} title="Reset view" style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#666', padding: '4px 5px', borderRadius: '5px' }}><Maximize2 size={12} /></button>
          </div>
        </div>
      </div>

      {/* ── COLOR PICKER (position:fixed — escapes toolbar overflow clipping) ── */}
      {showColorPicker && (
        <div onPointerDown={e => e.stopPropagation()} style={{
          position: 'fixed', top: colorPickerPos.top, left: colorPickerPos.left, zIndex: 9999,
          background: '#fff', border: '1px solid #e8e8e8', borderRadius: '12px',
          padding: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
          display: 'grid', gridTemplateColumns: 'repeat(7, 26px)', gap: '5px',
        }}>
          {COLORS.map(c => (
            <button key={c} onClick={() => { setColor(c); setShowColorPicker(false); }} style={{
              width: '26px', height: '26px', borderRadius: '50%', padding: 0, cursor: 'pointer',
              background: c, border: color === c ? '2.5px solid #5c33c1' : '1px solid #ddd',
              boxShadow: c === '#FFFFFF' ? 'inset 0 0 0 1px #ccc' : 'none',
            }} />
          ))}
          <div style={{ gridColumn: '1/-1', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px', borderTop: '1px solid #f0f0f0', paddingTop: '8px' }}>
            <span style={{ fontSize: '0.7rem', color: '#999' }}>Tùy chọn</span>
            <input type="color" value={color} onChange={e => setColor(e.target.value)}
              style={{ width: '30px', height: '24px', border: 'none', cursor: 'pointer', padding: 0, background: 'none' }} />
            <span style={{ fontSize: '0.7rem', color: '#999', fontFamily: 'monospace' }}>{color}</span>
          </div>
        </div>
      )}

      {/* ── BACKGROUND PICKER (position:fixed) ── */}
      {showBgPicker && (
        <div onPointerDown={e => e.stopPropagation()} style={{
          position: 'fixed', top: bgPickerPos.top, left: bgPickerPos.left, zIndex: 9999,
          background: '#fff', border: '1px solid #e8e8e8', borderRadius: '10px',
          padding: '6px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: '130px',
        }}>
          {BG_OPTIONS.map(({ id, label, base }) => (
            <button key={id} onClick={() => { setBackground(id); setShowBgPicker(false); }} style={{
              width: '100%', padding: '7px 10px', border: 'none', textAlign: 'left',
              background: background === id ? '#ede9fb' : 'transparent',
              color: background === id ? '#5c33c1' : '#333',
              borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem',
              fontWeight: background === id ? 600 : 400, display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <div style={{ width: '20px', height: '14px', borderRadius: '3px', background: base, border: '1px solid #ddd', flexShrink: 0 }} />
              {label}
            </button>
          ))}
        </div>
      )}

      <style>{`
        @keyframes hn-spin { to { transform: rotate(360deg); } }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
      `}</style>
    </div>
  );
}
