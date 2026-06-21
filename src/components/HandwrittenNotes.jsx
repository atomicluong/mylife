import React, { useState, useEffect, useRef } from 'react';
import {
  Undo2, Redo2, Save, Plus, Trash2,
  Eraser, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2,
  Check, Menu, MousePointer2, Minus, Square, Download,
  Circle as CircleIcon, ChevronDown, BookOpen, Pencil, X,
} from 'lucide-react';
import { notesDb } from '../utils/notesDb';

// ── Constants ────────────────────────────────────────────────────────────────
const DEFAULT_PRESETS = [
  { type: 'pen',         color: '#1a1a2e', width: 2,  label: 'Mảnh' },
  { type: 'pen',         color: '#1e40af', width: 4,  label: 'Xanh' },
  { type: 'pen',         color: '#dc2626', width: 4,  label: 'Đỏ' },
  { type: 'pen',         color: '#15803d', width: 3,  label: 'Lá' },
  { type: 'highlighter', color: '#fbbf24', width: 12, label: 'Vàng HL' },
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

const BG_OPTIONS = [
  { id: 'blank',      label: 'Trắng',              base: '#FEFDF8' },
  { id: 'dots',       label: 'Chấm bi',             base: '#FEFDF8' },
  { id: 'lines',      label: 'Dòng kẻ',             base: '#FEFDF8' },
  { id: 'grid',       label: 'Lưới ô',              base: '#FEFDF8' },
  { id: 'aged_plain', label: 'Sách cũ — Trơn',      base: '#f2e8ce' },
  { id: 'aged',       label: 'Sách cũ — Kẻ dòng',  base: '#f2e8ce' },
  { id: 'aged_grid',  label: 'Sách cũ — Lưới',      base: '#f2e8ce' },
];

const SHAPE_OPTIONS = [
  { id: 'line',   label: 'Đường thẳng', Icon: Minus },
  { id: 'rect',   label: 'Chữ nhật',   Icon: Square },
  { id: 'circle', label: 'Hình tròn',  Icon: CircleIcon },
];

const SIZE_OPTIONS = [1, 2, 3, 5, 7, 10, 14, 20];

const NOTEBOOKS_KEY  = 'hn-notebooks';
const PEN_KEY        = 'hn-pen-settings';
const INITIAL_NB     = [{ id: 'default', name: 'Mặc định' }];

const loadNb = () => { try { return JSON.parse(localStorage.getItem(NOTEBOOKS_KEY)) ?? INITIAL_NB; } catch { return INITIAL_NB; } };
const loadPen = () => { try { return JSON.parse(localStorage.getItem(PEN_KEY)) ?? {}; } catch { return {}; } };

// ── Helpers ──────────────────────────────────────────────────────────────────
function ToolBtn({ active, onClick, title, children }) {
  return (
    <button onClick={onClick} title={title} style={{
      border: `2px solid ${active ? '#5c33c1' : 'transparent'}`,
      background: active ? '#ede9fb' : 'transparent',
      color: active ? '#5c33c1' : '#555',
      borderRadius: '7px', padding: '5px 7px', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'all 0.1s', minWidth: '30px', minHeight: '30px', flexShrink: 0,
    }}>
      {children}
    </button>
  );
}

function Sep() {
  return <div style={{ width: '1px', height: '26px', background: '#e5e5e5', margin: '0 4px', flexShrink: 0 }} />;
}

function calcPopupPos(btnRef, approxH = 300, approxW = 200) {
  const r = btnRef.current?.getBoundingClientRect();
  if (!r) return { top: 60, left: 8 };
  const spaceBelow = window.innerHeight - r.bottom - 8;
  const top = spaceBelow >= approxH ? r.bottom + 5 : r.top - approxH - 5;
  const left = Math.min(r.left, window.innerWidth - approxW - 8);
  return { top: Math.max(8, top), left: Math.max(8, left) };
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function HandwrittenNotes() {
  // Notebooks (localStorage)
  const [notebooks, setNotebooks]             = useState(loadNb);
  const [currentNbId, setCurrentNbId]         = useState('default');
  const [openNbs, setOpenNbs]                 = useState(() => new Set(['default']));
  const [editingNbId, setEditingNbId]         = useState(null);
  const [editingNbName, setEditingNbName]     = useState('');

  // Notes
  const [notes, setNotes]                     = useState([]);
  const [currentNoteId, setCurrentNoteId]     = useState(null);
  const [noteTitle, setNoteTitle]             = useState('');
  const [isEditingTitle, setIsEditingTitle]   = useState(false);
  const [titleInput, setTitleInput]           = useState('');

  // Strokes + canvas state
  const [strokes, setStrokes]                 = useState([]);
  const [background, setBackground]           = useState('dots');
  const [offsetX, setOffsetX]                 = useState(0);
  const [offsetY, setOffsetY]                 = useState(0);
  const [zoomScale, setZoomScale]             = useState(1);
  const [selectedIds, setSelectedIds]         = useState(new Set());
  const [saveStatus, setSaveStatus]           = useState('idle');
  const [isSidebarOpen, setIsSidebarOpen]     = useState(false);

  // Pen settings (localStorage-persisted)
  const _saved = loadPen();
  const validTools = ['pen', 'highlighter', 'lasso', 'hand', 'eraser', 'line', 'rect', 'circle'];
  const [tool, setTool]                       = useState(validTools.includes(_saved.tool) ? _saved.tool : 'pen');
  const [activePenPreset, setActivePenPreset] = useState(_saved.activePenPreset ?? 0);
  const [color, setColor]                     = useState(_saved.color ?? '#1a1a2e');
  const [lineWidth, setLineWidth]             = useState(_saved.lineWidth ?? 7);

  // History
  const [history, setHistory]                 = useState([[]]);
  const [historyIndex, setHistoryIndex]       = useState(0);

  // Popups
  const [showPenMenu, setShowPenMenu]         = useState(false);
  const [penMenuPos, setPenMenuPos]           = useState({ top: 0, left: 0 });
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [colorPickerPos, setColorPickerPos]   = useState({ top: 0, left: 0 });
  const [showSizeMenu, setShowSizeMenu]       = useState(false);
  const [sizeMenuPos, setSizeMenuPos]         = useState({ top: 0, left: 0 });
  const [showBgPicker, setShowBgPicker]       = useState(false);
  const [bgPickerPos, setBgPickerPos]         = useState({ top: 0, left: 0 });
  const [showShapePicker, setShowShapePicker] = useState(false);
  const [shapePickerPos, setShapePickerPos]   = useState({ top: 0, left: 0 });

  const penMenuBtnRef   = useRef(null);
  const colorBtnRef     = useRef(null);
  const sizeBtnRef      = useRef(null);
  const bgBtnRef        = useRef(null);
  const shapeBtnRef     = useRef(null);

  // Two canvas layers
  const committedCanvasRef = useRef(null);
  const liveCanvasRef      = useRef(null);
  const containerRef       = useRef(null);

  // Pointer / drawing state refs
  const isDrawing        = useRef(false);
  const currentPoints    = useRef([]);
  const shapeStart       = useRef(null);
  const lassoPath        = useRef([]);
  const lastPointerPos   = useRef({ x: 0, y: 0 });
  const activePointers   = useRef(new Map());
  const initialPinchDist = useRef(0);
  const initialPinchZoom = useRef(1);
  const hasErased        = useRef(false);

  // Mirror state → refs (stable for pointer event handlers)
  const strokesRef  = useRef(strokes);
  const offsetXRef  = useRef(offsetX);
  const offsetYRef  = useRef(offsetY);
  const zoomRef     = useRef(zoomScale);
  const toolRef     = useRef(tool);
  const colorRef    = useRef(color);
  const lwRef       = useRef(lineWidth);
  const bgRef       = useRef(background);
  const selRef      = useRef(selectedIds);
  const histRef     = useRef(history);
  const histIdxRef  = useRef(historyIndex);

  useEffect(() => { strokesRef.current = strokes; },      [strokes]);
  useEffect(() => { offsetXRef.current = offsetX; },      [offsetX]);
  useEffect(() => { offsetYRef.current = offsetY; },      [offsetY]);
  useEffect(() => { zoomRef.current    = zoomScale; },    [zoomScale]);
  useEffect(() => { toolRef.current    = tool; },         [tool]);
  useEffect(() => { colorRef.current   = color; },        [color]);
  useEffect(() => { lwRef.current      = lineWidth; },    [lineWidth]);
  useEffect(() => { bgRef.current      = background; },   [background]);
  useEffect(() => { selRef.current     = selectedIds; },  [selectedIds]);
  useEffect(() => { histRef.current    = history; },      [history]);
  useEffect(() => { histIdxRef.current = historyIndex; }, [historyIndex]);

  // Persist notebooks
  useEffect(() => { localStorage.setItem(NOTEBOOKS_KEY, JSON.stringify(notebooks)); }, [notebooks]);

  // Persist pen settings
  useEffect(() => {
    localStorage.setItem(PEN_KEY, JSON.stringify({ tool, color, lineWidth, activePenPreset }));
  }, [tool, color, lineWidth, activePenPreset]);

  // ── DB ─────────────────────────────────────────────────────────────────────
  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      const all = await notesDb.getAllNotes();
      setNotes(all);
      if (all.length > 0) { if (!currentNoteId) openNote(all[0]); }
      else createNote('default');
    } catch (e) { console.error(e); }
  };

  const openNote = (note) => {
    setCurrentNoteId(note.id);
    setNoteTitle(note.title);  setTitleInput(note.title);
    setStrokes(note.strokes || []);
    setOffsetX(note.offsetX || 0);  setOffsetY(note.offsetY || 0);
    setZoomScale(note.zoomScale || 1);
    setBackground(note.background || 'dots');
    setSelectedIds(new Set());
    setHistory([note.strokes || []]);  setHistoryIndex(0);
    setIsSidebarOpen(false);
    const nbId = note.notebookId || 'default';
    setCurrentNbId(nbId);
    setOpenNbs(prev => new Set([...prev, nbId]));
  };

  const createNote = async (nbId) => {
    const targetNb = nbId ?? currentNbId ?? 'default';
    const note = {
      id: Math.random().toString(36).slice(2),
      title: `Ghi chú ${new Date().toLocaleDateString('vi-VN')}`,
      notebookId: targetNb,
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
        notebookId: currentNbId,
        strokes: overrideStrokes ?? strokesRef.current,
        offsetX: offsetXRef.current, offsetY: offsetYRef.current,
        zoomScale: zoomRef.current, background: bgRef.current,
        updatedAt: Date.now(),
      });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
      setNotes(await notesDb.getAllNotes());
    } catch { setSaveStatus('error'); setTimeout(() => setSaveStatus('idle'), 3000); }
  };

  const renameNote = async () => {
    if (!titleInput.trim()) return;
    setNoteTitle(titleInput);  setIsEditingTitle(false);
    if (currentNoteId) {
      await notesDb.saveNote({
        id: currentNoteId, title: titleInput,
        notebookId: currentNbId,
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

  // ── Notebooks ──────────────────────────────────────────────────────────────
  const createNotebook = () => {
    const name = window.prompt('Tên sổ tay mới:');
    if (!name?.trim()) return;
    const nb = { id: Math.random().toString(36).slice(2), name: name.trim() };
    setNotebooks(prev => [...prev, nb]);
    setCurrentNbId(nb.id);
    setOpenNbs(prev => new Set([...prev, nb.id]));
  };

  const renameNotebook = (id) => {
    if (!editingNbName.trim()) { setEditingNbId(null); return; }
    setNotebooks(prev => prev.map(nb => nb.id === id ? { ...nb, name: editingNbName.trim() } : nb));
    setEditingNbId(null);
  };

  const deleteNotebook = (id) => {
    if (id === 'default') return;
    const count = notes.filter(n => (n.notebookId || 'default') === id).length;
    if (!window.confirm(count > 0
      ? `Xóa sổ tay này? ${count} ghi chú sẽ chuyển về "Mặc định".`
      : 'Xóa sổ tay này?')) return;
    // Move notes to default
    notes.filter(n => (n.notebookId || 'default') === id).forEach(note =>
      notesDb.saveNote({ ...note, notebookId: 'default' })
    );
    setNotebooks(prev => prev.filter(nb => nb.id !== id));
    if (currentNbId === id) setCurrentNbId('default');
    loadAll();
  };

  const toggleNb = (id) => {
    setOpenNbs(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    setCurrentNbId(id);
  };

  // ── History ─────────────────────────────────────────────────────────────────
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

  // ── Canvas geometry ─────────────────────────────────────────────────────────
  const toWorld = (cx, cy) => {
    const r = liveCanvasRef.current?.getBoundingClientRect();
    if (!r) return { worldX: 0, worldY: 0 };
    return {
      worldX: (cx - r.left - offsetXRef.current) / zoomRef.current,
      worldY: (cy - r.top  - offsetYRef.current) / zoomRef.current,
    };
  };

  // ── Render committed canvas (background + saved strokes) ────────────────────
  const renderCommitted = () => {
    const canvas = committedCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.width / dpr, H = canvas.height / dpr;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = BG_OPTIONS.find(b => b.id === bgRef.current)?.base ?? '#FEFDF8';
    ctx.fillRect(0, 0, W, H);
    drawBackground(ctx, W, H);

    ctx.save();
    ctx.translate(offsetXRef.current, offsetYRef.current);
    ctx.scale(zoomRef.current, zoomRef.current);
    paintStrokes(ctx, strokesRef.current);

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

  const clearLive = () => {
    const c = liveCanvasRef.current;
    if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    c.getContext('2d').clearRect(0, 0, c.width / dpr, c.height / dpr);
  };

  // Copy committed → live then draw preview (lasso / shapes)
  const drawLivePreview = () => {
    const live = liveCanvasRef.current, committed = committedCanvasRef.current;
    if (!live || !committed) return;
    const ctx = live.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const W = live.width / dpr, H = live.height / dpr;

    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(committed, 0, 0, W, H); // GPU copy

    ctx.save();
    ctx.translate(offsetXRef.current, offsetYRef.current);
    ctx.scale(zoomRef.current, zoomRef.current);

    const t = toolRef.current;
    if (t === 'lasso' && lassoPath.current.length > 1) {
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 1.5 / zoomRef.current;
      ctx.setLineDash([5 / zoomRef.current, 4 / zoomRef.current]);
      ctx.fillStyle = 'rgba(37,99,235,0.06)';
      ctx.beginPath();
      lassoPath.current.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
      ctx.closePath(); ctx.fill(); ctx.stroke();
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
    }
    ctx.restore();
  };

  // Append one segment to live canvas (no clear — zero-latency)
  const appendLiveSegment = (p1, p2) => {
    const canvas = liveCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.translate(offsetXRef.current, offsetYRef.current);
    ctx.scale(zoomRef.current, zoomRef.current);
    if (toolRef.current === 'highlighter') {
      ctx.globalAlpha = 0.38;
      ctx.globalCompositeOperation = 'multiply';
      ctx.strokeStyle = colorRef.current;
      ctx.lineWidth = lwRef.current * 2.5;
    } else {
      const pressure = ((p1.p ?? 0.5) + (p2.p ?? 0.5)) / 2;
      ctx.strokeStyle = colorRef.current;
      ctx.lineWidth = Math.max(0.5, lwRef.current * (0.4 + pressure * 1.2));
    }
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
    ctx.restore();
  };

  const drawBackground = (ctx, W, H) => {
    const bg = bgRef.current;
    if (bg === 'blank') return;
    if (bg === 'aged_plain') { drawAgedVignette(ctx, W, H); return; }

    const sp = 24 * zoomRef.current;
    const sx = (offsetXRef.current % sp) - sp;
    const sy = (offsetYRef.current % sp) - sp;
    ctx.save();

    if (bg === 'dots') {
      ctx.fillStyle = 'rgba(0,0,0,0.13)';
      const r = Math.max(0.7, 1.2 * Math.min(zoomRef.current, 1.5));
      for (let x = sx; x < W + sp; x += sp)
        for (let y = sy; y < H + sp; y += sp) {
          ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        }
    } else if (bg === 'lines') {
      ctx.strokeStyle = 'rgba(0,0,0,0.09)'; ctx.lineWidth = 0.8;
      for (let y = sy; y < H + sp; y += sp) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      const mx = 48 * zoomRef.current + offsetXRef.current;
      ctx.strokeStyle = 'rgba(220,80,80,0.22)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(mx, 0); ctx.lineTo(mx, H); ctx.stroke();
    } else if (bg === 'grid') {
      ctx.strokeStyle = 'rgba(0,0,0,0.08)'; ctx.lineWidth = 0.8;
      for (let x = sx; x < W + sp; x += sp) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = sy; y < H + sp; y += sp) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    } else if (bg === 'aged' || bg === 'aged_grid') {
      const ls = 22 * zoomRef.current;
      const lx = (offsetXRef.current % ls) - ls;
      const ly = (offsetYRef.current % ls) - ls;
      ctx.strokeStyle = 'rgba(140,100,50,0.13)'; ctx.lineWidth = 0.7;
      if (bg === 'aged') {
        for (let y = ly; y < H + ls; y += ls) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
        const mx = 48 * zoomRef.current + offsetXRef.current;
        ctx.strokeStyle = 'rgba(180,70,40,0.22)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(mx, 0); ctx.lineTo(mx, H); ctx.stroke();
      } else {
        for (let x = lx; x < W + ls; x += ls) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
        for (let y = ly; y < H + ls; y += ls) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      }
      drawAgedVignette(ctx, W, H);
    }
    ctx.restore();
  };

  const drawAgedVignette = (ctx, W, H) => {
    const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.9);
    g.addColorStop(0, 'rgba(160,110,50,0)');
    g.addColorStop(1, 'rgba(120,75,20,0.1)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  };

  const paintStrokes = (ctx, list) => {
    list.forEach(stroke => {
      if (!stroke.points?.length) return;
      ctx.save();
      if (stroke.type === 'highlighter') {
        ctx.globalAlpha = 0.38; ctx.globalCompositeOperation = 'multiply';
        ctx.strokeStyle = stroke.color; ctx.lineWidth = stroke.width * 2.5;
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        const pts = stroke.points;
        ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length - 1; i++) {
          const xc = (pts[i].x + pts[i + 1].x) / 2, yc = (pts[i].y + pts[i + 1].y) / 2;
          ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
        }
        if (pts.length > 1) ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
        ctx.stroke();
      } else {
        ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = stroke.color;
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

  const renderCommittedRef = useRef(renderCommitted);
  renderCommittedRef.current = renderCommitted;

  // Resize both canvases
  useEffect(() => {
    const resize = () => {
      const cont = containerRef.current;
      if (!cont) return;
      const dpr = window.devicePixelRatio || 1;
      const W = cont.clientWidth, H = cont.clientHeight;
      [committedCanvasRef, liveCanvasRef].forEach(ref => {
        const c = ref.current; if (!c) return;
        c.width = W * dpr; c.height = H * dpr;
        c.style.width = `${W}px`; c.style.height = `${H}px`;
        c.getContext('2d').scale(dpr, dpr);
      });
      renderCommittedRef.current();
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => { renderCommittedRef.current(); clearLive(); },
    [strokes, offsetX, offsetY, zoomScale, background, selectedIds]);

  useEffect(() => {
    const c = liveCanvasRef.current; if (!c) return;
    const fn = (e) => { e.preventDefault(); setZoomScale(p => Math.max(0.15, Math.min(6, p * (e.deltaY < 0 ? 1.1 : 1 / 1.1)))); };
    c.addEventListener('wheel', fn, { passive: false });
    return () => c.removeEventListener('wheel', fn);
  }, []);

  // Close all popups on outside click
  const anyPopup = showPenMenu || showColorPicker || showSizeMenu || showBgPicker || showShapePicker;
  useEffect(() => {
    if (!anyPopup) return;
    const close = () => { setShowPenMenu(false); setShowColorPicker(false); setShowSizeMenu(false); setShowBgPicker(false); setShowShapePicker(false); };
    const t = setTimeout(() => document.addEventListener('pointerdown', close), 10);
    return () => { clearTimeout(t); document.removeEventListener('pointerdown', close); };
  }, [anyPopup]);

  // ── Eraser ─────────────────────────────────────────────────────────────────
  const erase = (wx, wy) => {
    const thr = 18 / zoomRef.current;
    const rem = strokesRef.current.filter(s => {
      const hit = s.points.some(p => { const dx = p.x - wx, dy = p.y - wy; return dx*dx + dy*dy < thr*thr; });
      if (hit) hasErased.current = true;
      return !hit;
    });
    if (rem.length !== strokesRef.current.length) setStrokes(rem);
  };

  // ── Lasso ──────────────────────────────────────────────────────────────────
  const finalizeLasso = (path) => {
    if (path.length < 3) return;
    const xs = path.map(p => p.x), ys = path.map(p => p.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const ids = new Set();
    strokesRef.current.forEach(s => {
      if (s.points.some(p => p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY)) ids.add(s.id);
    });
    setSelectedIds(ids);
  };

  const deleteSelected = () => {
    const rem = strokesRef.current.filter(s => !selRef.current.has(s.id));
    setStrokes(rem); pushHistory(rem); setSelectedIds(new Set());
  };

  // ── Shape to points ────────────────────────────────────────────────────────
  const shapeToPoints = (t, s, e) => {
    if (t === 'line') return [{ x: s.x, y: s.y, p: 0.5 }, { x: e.x, y: e.y, p: 0.5 }];
    if (t === 'rect') return [
      { x: s.x, y: s.y, p: 0.5 }, { x: e.x, y: s.y, p: 0.5 },
      { x: e.x, y: e.y, p: 0.5 }, { x: s.x, y: e.y, p: 0.5 },
      { x: s.x, y: s.y, p: 0.5 },
    ];
    const rx = Math.abs(e.x - s.x) / 2, ry = Math.abs(e.y - s.y) / 2;
    const cx = (s.x + e.x) / 2, cy = (s.y + e.y) / 2;
    return Array.from({ length: 65 }, (_, i) => {
      const a = (i / 64) * Math.PI * 2;
      return { x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a), p: 0.5 };
    });
  };

  // ── Pointer events ─────────────────────────────────────────────────────────
  const onPointerDown = (e) => {
    e.preventDefault();
    const canvas = liveCanvasRef.current; if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    lastPointerPos.current = { x: e.clientX, y: e.clientY };
    const { worldX, worldY } = toWorld(e.clientX, e.clientY);

    if (activePointers.current.size >= 2) {
      isDrawing.current = false; currentPoints.current = [];
      const [a, b] = Array.from(activePointers.current.keys());
      const pa = activePointers.current.get(a), pb = activePointers.current.get(b);
      initialPinchDist.current = Math.hypot(pa.x - pb.x, pa.y - pb.y);
      initialPinchZoom.current = zoomRef.current;
      return;
    }
    if (e.pointerType === 'touch') { isDrawing.current = false; return; }
    if (toolRef.current === 'hand' || e.buttons === 4) { isDrawing.current = false; return; }

    const t = toolRef.current;
    if (t !== 'lasso') { selRef.current = new Set(); setSelectedIds(new Set()); }
    isDrawing.current = true; hasErased.current = false;

    if (t === 'lasso') { lassoPath.current = [{ x: worldX, y: worldY }]; }
    else if (t === 'line' || t === 'rect' || t === 'circle') { shapeStart.current = { x: worldX, y: worldY }; currentPoints.current = [{ x: worldX, y: worldY }]; }
    else if (t === 'eraser') { erase(worldX, worldY); }
    else { currentPoints.current = [{ x: worldX, y: worldY, p: e.pressure > 0 ? e.pressure : 0.5 }]; }
  };

  const onPointerMove = (e) => {
    if (!activePointers.current.has(e.pointerId)) return;
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const { worldX, worldY } = toWorld(e.clientX, e.clientY);

    if (activePointers.current.size >= 2) {
      const [a, b] = Array.from(activePointers.current.keys());
      const pa = activePointers.current.get(a), pb = activePointers.current.get(b);
      const dist = Math.hypot(pa.x - pb.x, pa.y - pb.y);
      if (initialPinchDist.current > 0)
        setZoomScale(Math.max(0.15, Math.min(6, initialPinchZoom.current * (dist / initialPinchDist.current))));
      const dx = e.clientX - lastPointerPos.current.x, dy = e.clientY - lastPointerPos.current.y;
      setOffsetX(p => p + dx / 2); setOffsetY(p => p + dy / 2);
      lastPointerPos.current = { x: e.clientX, y: e.clientY };
      return;
    }
    if (e.pointerType === 'touch') {
      const dx = e.clientX - lastPointerPos.current.x, dy = e.clientY - lastPointerPos.current.y;
      setOffsetX(p => p + dx); setOffsetY(p => p + dy);
      lastPointerPos.current = { x: e.clientX, y: e.clientY };
      return;
    }
    if (toolRef.current === 'hand' || e.buttons === 4) {
      const dx = e.clientX - lastPointerPos.current.x, dy = e.clientY - lastPointerPos.current.y;
      setOffsetX(p => p + dx); setOffsetY(p => p + dy);
      lastPointerPos.current = { x: e.clientX, y: e.clientY };
      return;
    }
    if (!isDrawing.current) return;
    const t = toolRef.current;

    if (t === 'lasso') { lassoPath.current.push({ x: worldX, y: worldY }); drawLivePreview(); }
    else if (t === 'line' || t === 'rect' || t === 'circle') { currentPoints.current = [{ x: worldX, y: worldY }]; drawLivePreview(); }
    else if (t === 'eraser') { erase(worldX, worldY); }
    else {
      const pressure = e.pressure > 0 ? e.pressure : 0.5;
      const pts = currentPoints.current;
      if (pts.length > 0) {
        const last = pts[pts.length - 1];
        if (Math.hypot(worldX - last.x, worldY - last.y) < 0.5) return;
        appendLiveSegment(last, { x: worldX, y: worldY, p: pressure });
      }
      currentPoints.current.push({ x: worldX, y: worldY, p: pressure });
    }
  };

  const onPointerUp = (e) => {
    liveCanvasRef.current?.releasePointerCapture(e.pointerId);
    activePointers.current.delete(e.pointerId);
    if (activePointers.current.size < 2) initialPinchDist.current = 0;
    if (!isDrawing.current) return;
    isDrawing.current = false;
    const t = toolRef.current;

    if (t === 'lasso') { finalizeLasso(lassoPath.current); lassoPath.current = []; }
    else if (t === 'eraser') { if (hasErased.current) pushHistory(strokesRef.current); }
    else if (t === 'line' || t === 'rect' || t === 'circle') {
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
      const ns = { id: Math.random().toString(36).slice(2), type: t === 'highlighter' ? 'highlighter' : 'pen', color: colorRef.current, width: lwRef.current, points: [...currentPoints.current] };
      const next = [...strokesRef.current, ns];
      setStrokes(next); pushHistory(next);
      currentPoints.current = [];
    }
  };

  const onPointerCancel = (e) => {
    activePointers.current.delete(e.pointerId);
    isDrawing.current = false;
    currentPoints.current = []; lassoPath.current = []; shapeStart.current = null;
    clearLive();
  };

  // ── Misc ───────────────────────────────────────────────────────────────────
  const selectPreset = (idx) => {
    const p = DEFAULT_PRESETS[idx];
    setActivePenPreset(idx);
    setTool(p.type === 'highlighter' ? 'highlighter' : 'pen');
    setColor(p.color);
    setLineWidth(p.width);
  };

  const zoom = (dir) => setZoomScale(p => Math.max(0.15, Math.min(6, dir === 'in' ? p * 1.25 : p / 1.25)));
  const resetView = () => { setOffsetX(0); setOffsetY(0); setZoomScale(1); };

  const exportPng = () => {
    const url = committedCanvasRef.current?.toDataURL('image/png');
    if (!url) return;
    const a = document.createElement('a'); a.href = url; a.download = `${noteTitle || 'ghi-chu'}.png`; a.click();
  };

  const openPopup = (btnRef, setPos, setShow, h = 300, w = 200) => (e) => {
    e.stopPropagation();
    setPos(calcPopupPos(btnRef, h, w));
    setShow(v => !v);
    [setShowPenMenu, setShowColorPicker, setShowSizeMenu, setShowBgPicker, setShowShapePicker]
      .filter(fn => fn !== setShow).forEach(fn => fn(false));
  };

  const isPenActive = tool === 'pen' || tool === 'highlighter';
  const isShapeActive = tool === 'line' || tool === 'rect' || tool === 'circle';
  const currentPreset = DEFAULT_PRESETS[activePenPreset];
  const currentShapeOpt = SHAPE_OPTIONS.find(s => s.id === tool);
  const getCursor = () => tool === 'hand' ? 'grab' : tool === 'eraser' ? 'cell' : 'crosshair';

  // ── JSX ────────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', height: '100%', width: '100%', overflow: 'hidden', fontFamily: 'system-ui,-apple-system,sans-serif' }}>

      {/* ── SIDEBAR ── */}
      <div style={{ width: isSidebarOpen ? '250px' : '0px', transition: 'width 0.22s ease', overflow: 'hidden', flexShrink: 0, background: '#fff', borderRight: '1px solid #e8e8e8', display: 'flex', flexDirection: 'column' }}>
        <div style={{ width: '250px', height: '100%', display: 'flex', flexDirection: 'column' }}>

          {/* Sidebar header */}
          <div style={{ padding: '10px 12px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <BookOpen size={14} style={{ color: '#5c33c1' }} />
              <span style={{ fontWeight: 700, fontSize: '0.74rem', color: '#5c33c1', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sổ ghi chú</span>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#aaa', padding: '3px', borderRadius: '4px' }}>
              <X size={14} />
            </button>
          </div>

          {/* Sidebar actions */}
          <div style={{ padding: '8px', display: 'flex', gap: '6px', borderBottom: '1px solid #f0f0f0', flexShrink: 0 }}>
            <button onClick={() => createNote()} style={{ flex: 1, padding: '6px 8px', background: '#5c33c1', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
              <Plus size={12} /> Ghi chú mới
            </button>
            <button onClick={createNotebook} title="Tạo sổ tay mới" style={{ padding: '6px 9px', background: '#f5f3ff', color: '#5c33c1', border: '1px solid #ede9fb', borderRadius: '6px', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
              <BookOpen size={12} /> Sổ tay
            </button>
          </div>

          {/* Notebooks + notes list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '4px 6px' }}>
            {notebooks.map(nb => {
              const nbNotes = notes.filter(n => (n.notebookId || 'default') === nb.id);
              const isExpanded = openNbs.has(nb.id);
              const isCurrent = currentNbId === nb.id;

              return (
                <div key={nb.id} style={{ marginBottom: '2px' }}>
                  {/* Notebook header */}
                  <div style={{ display: 'flex', alignItems: 'center', padding: '5px 6px', borderRadius: '6px', cursor: 'pointer', background: isCurrent ? '#f5f3ff' : 'transparent', gap: '4px' }}>
                    <span onClick={() => toggleNb(nb.id)} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '5px', minWidth: 0 }}>
                      {isExpanded ? <ChevronDown size={11} style={{ color: '#888', flexShrink: 0 }} /> : <ChevronRight size={11} style={{ color: '#888', flexShrink: 0 }} />}
                      {editingNbId === nb.id
                        ? <input autoFocus value={editingNbName}
                            onChange={e => setEditingNbName(e.target.value)}
                            onBlur={() => renameNotebook(nb.id)}
                            onKeyDown={e => { if (e.key === 'Enter') renameNotebook(nb.id); if (e.key === 'Escape') setEditingNbId(null); }}
                            onClick={e => e.stopPropagation()}
                            style={{ border: '1px solid #5c33c1', borderRadius: '3px', padding: '1px 4px', fontSize: '0.75rem', fontWeight: 600, outline: 'none', width: '100%' }} />
                        : <span style={{ fontSize: '0.75rem', fontWeight: isCurrent ? 700 : 600, color: isCurrent ? '#5c33c1' : '#444', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {nb.name}
                          </span>
                      }
                      <span style={{ fontSize: '0.62rem', color: '#bbb', flexShrink: 0 }}>{nbNotes.length}</span>
                    </span>
                    <button onClick={e => { e.stopPropagation(); setEditingNbId(nb.id); setEditingNbName(nb.name); }}
                      style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ccc', padding: '2px', borderRadius: '3px', flexShrink: 0, opacity: 0, transition: 'opacity 0.1s' }}
                      onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = '#5c33c1'; }}
                      onMouseLeave={e => { e.currentTarget.style.opacity = '0'; }}>
                      <Pencil size={10} />
                    </button>
                    {nb.id !== 'default' && (
                      <button onClick={e => { e.stopPropagation(); deleteNotebook(nb.id); }}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ccc', padding: '2px', borderRadius: '3px', flexShrink: 0, opacity: 0 }}
                        onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = '#ef4444'; }}
                        onMouseLeave={e => { e.currentTarget.style.opacity = '0'; }}>
                        <X size={10} />
                      </button>
                    )}
                  </div>

                  {/* Notes under this notebook */}
                  {isExpanded && (
                    <div style={{ paddingLeft: '16px' }}>
                      {nbNotes.length === 0
                        ? <p style={{ fontSize: '0.68rem', color: '#d1d5db', padding: '4px 8px', margin: 0 }}>Chưa có ghi chú</p>
                        : nbNotes.map(note => {
                          const active = note.id === currentNoteId;
                          return (
                            <div key={note.id} onClick={() => openNote(note)} style={{ padding: '6px 8px', borderRadius: '6px', cursor: 'pointer', marginBottom: '1px', background: active ? '#ede9fb' : 'transparent', borderLeft: `2px solid ${active ? '#5c33c1' : 'transparent'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ margin: 0, fontSize: '0.76rem', fontWeight: active ? 600 : 400, color: active ? '#5c33c1' : '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{note.title}</p>
                                <p style={{ margin: '1px 0 0', fontSize: '0.62rem', color: '#bbb' }}>{new Date(note.updatedAt).toLocaleDateString('vi-VN')}</p>
                              </div>
                              <button onClick={ev => deleteNote(note.id, ev)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ddd', padding: '2px', borderRadius: '3px', flexShrink: 0 }}
                                onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                                onMouseLeave={e => e.currentTarget.style.color = '#ddd'}>
                                <Trash2 size={11} />
                              </button>
                            </div>
                          );
                        })
                      }
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── MAIN ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* Title bar */}
        <div style={{ background: '#fff', borderBottom: '1px solid #e8e8e8', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          <button onClick={() => setIsSidebarOpen(v => !v)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#666', padding: '5px', borderRadius: '5px' }}>
            <Menu size={16} />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            {isEditingTitle
              ? <input value={titleInput} onChange={e => setTitleInput(e.target.value)} onBlur={renameNote} onKeyDown={e => e.key === 'Enter' && renameNote()} autoFocus
                  style={{ border: '1px solid #5c33c1', borderRadius: '4px', padding: '2px 7px', fontSize: '0.85rem', fontWeight: 600, outline: 'none', maxWidth: '260px', width: '100%' }} />
              : <span onClick={() => setIsEditingTitle(true)} style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1a1a1a', cursor: 'text', padding: '2px 4px' }}>
                  {noteTitle || 'Ghi chú mới'}
                </span>
            }
          </div>
          <button onClick={undo} disabled={historyIndex <= 0} title="Undo" style={{ border: 'none', background: 'none', padding: '4px', borderRadius: '5px', cursor: historyIndex > 0 ? 'pointer' : 'default', color: historyIndex > 0 ? '#555' : '#ccc' }}><Undo2 size={15} /></button>
          <button onClick={redo} disabled={historyIndex >= history.length - 1} title="Redo" style={{ border: 'none', background: 'none', padding: '4px', borderRadius: '5px', cursor: historyIndex < history.length - 1 ? 'pointer' : 'default', color: historyIndex < history.length - 1 ? '#555' : '#ccc' }}><Redo2 size={15} /></button>
          <button onClick={exportPng} title="Xuất PNG" style={{ border: 'none', background: 'none', padding: '4px', borderRadius: '5px', cursor: 'pointer', color: '#666' }}><Download size={15} /></button>
          <button onClick={() => save()} style={{ border: 'none', background: '#5c33c1', color: '#fff', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.73rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
            {saveStatus === 'saving' ? <span style={{ width: 11, height: 11, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'hn-spin 0.6s linear infinite' }} />
              : saveStatus === 'saved' ? <Check size={12} /> : <Save size={12} />}
            <span>{saveStatus === 'saved' ? 'Đã lưu' : 'Lưu'}</span>
          </button>
        </div>

        {/* Tool ribbon — compact, all tools as dropdowns */}
        <div style={{ background: '#fff', borderBottom: '1px solid #e8e8e8', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0, overflowX: 'auto' }}>

          <ToolBtn active={tool === 'lasso'} onClick={() => setTool('lasso')} title="Lasso chọn vùng"><MousePointer2 size={14} /></ToolBtn>
          <ToolBtn active={tool === 'hand'}  onClick={() => setTool('hand')}  title="Di chuyển"><span style={{ fontSize: '12px' }}>✋</span></ToolBtn>
          <Sep />

          {/* Pen preset dropdown */}
          <button ref={penMenuBtnRef}
            onClick={openPopup(penMenuBtnRef, setPenMenuPos, setShowPenMenu, 240, 220)}
            style={{
              border: `2px solid ${isPenActive ? '#5c33c1' : '#e8e8e8'}`,
              background: isPenActive ? '#ede9fb' : '#fff',
              borderRadius: '7px', padding: '3px 7px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0,
            }}>
            <svg width="30" height="16" viewBox="0 0 30 16">
              {currentPreset?.type === 'highlighter'
                ? <path d="M2 11 Q15 7 28 11" stroke={currentPreset?.color ?? '#1a1a2e'} strokeWidth="7" strokeLinecap="round" fill="none" opacity="0.5" />
                : <path d="M2 13 Q11 3 28 6" stroke={currentPreset?.color ?? '#1a1a2e'} strokeWidth={Math.min((currentPreset?.width ?? 3) * 1.2, 5)} strokeLinecap="round" fill="none" />}
            </svg>
            <ChevronDown size={10} style={{ color: isPenActive ? '#5c33c1' : '#999' }} />
          </button>

          <ToolBtn active={tool === 'eraser'} onClick={() => setTool('eraser')} title="Tẩy"><Eraser size={14} /></ToolBtn>
          <Sep />

          {/* Shape dropdown */}
          <button ref={shapeBtnRef}
            onClick={openPopup(shapeBtnRef, setShapePickerPos, setShowShapePicker, 140, 160)}
            style={{
              border: `2px solid ${isShapeActive ? '#5c33c1' : 'transparent'}`,
              background: isShapeActive ? '#ede9fb' : 'transparent',
              color: isShapeActive ? '#5c33c1' : '#555',
              borderRadius: '7px', padding: '5px 6px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0,
            }}>
            {currentShapeOpt ? <currentShapeOpt.Icon size={14} /> : <Square size={14} />}
            <ChevronDown size={10} />
          </button>
          <Sep />

          {/* Color dropdown */}
          <button ref={colorBtnRef}
            onClick={openPopup(colorBtnRef, setColorPickerPos, setShowColorPicker, 280, 230)}
            style={{ border: '1px solid #e8e8e8', borderRadius: '6px', padding: '4px 7px', cursor: 'pointer', background: '#fff', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
            <div style={{ width: '15px', height: '15px', borderRadius: '50%', background: color, border: '1px solid #ddd', flexShrink: 0 }} />
            <ChevronDown size={10} style={{ color: '#999' }} />
          </button>

          {/* Size dropdown */}
          <button ref={sizeBtnRef}
            onClick={openPopup(sizeBtnRef, setSizeMenuPos, setShowSizeMenu, 190, 180)}
            style={{ border: '1px solid #e8e8e8', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', background: '#fff', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
            <div style={{ width: `${Math.min(Math.max(4, lineWidth * 1.3), 16)}px`, height: `${Math.min(Math.max(4, lineWidth * 1.3), 16)}px`, borderRadius: '50%', background: color, border: '1px solid #ddd', flexShrink: 0 }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#444', minWidth: '14px', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{lineWidth}</span>
            <ChevronDown size={10} style={{ color: '#999' }} />
          </button>
          <Sep />

          {/* Background dropdown */}
          <button ref={bgBtnRef}
            onClick={openPopup(bgBtnRef, setBgPickerPos, setShowBgPicker, 290, 190)}
            style={{ border: '1px solid #e8e8e8', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', background: '#fff', fontSize: '0.71rem', color: '#555', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
            <div style={{ width: '13px', height: '10px', borderRadius: '2px', background: BG_OPTIONS.find(b => b.id === background)?.base ?? '#fff', border: '1px solid #ddd' }} />
            Nền
            <ChevronDown size={10} style={{ color: '#999' }} />
          </button>

          {selectedIds.size > 0 && (
            <>
              <Sep />
              <button onClick={deleteSelected} style={{ border: 'none', background: '#fef2f2', color: '#dc2626', padding: '4px 9px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                <Trash2 size={12} /> Xóa {selectedIds.size} nét
              </button>
            </>
          )}
        </div>

        {/* Canvas area — two layers */}
        <div ref={containerRef} style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#FEFDF8' }}>
          <canvas ref={committedCanvasRef} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', display: 'block' }} />
          <canvas ref={liveCanvasRef}
            onPointerDown={onPointerDown} onPointerMove={onPointerMove}
            onPointerUp={onPointerUp} onPointerCancel={onPointerCancel}
            style={{ position: 'absolute', top: 0, left: 0, display: 'block', touchAction: 'none', cursor: getCursor() }} />
          <div style={{ position: 'absolute', bottom: '14px', right: '14px', zIndex: 10, display: 'flex', alignItems: 'center', background: '#fff', border: '1px solid #e8e8e8', borderRadius: '8px', padding: '3px', boxShadow: '0 2px 10px rgba(0,0,0,0.07)' }}>
            <button onClick={() => zoom('out')} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#666', padding: '3px 5px', borderRadius: '4px' }}><ZoomOut size={13} /></button>
            <span onClick={resetView} style={{ fontSize: '0.7rem', color: '#555', fontWeight: 600, padding: '0 4px', cursor: 'pointer', minWidth: '36px', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
              {Math.round(zoomScale * 100)}%
            </span>
            <button onClick={() => zoom('in')} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#666', padding: '3px 5px', borderRadius: '4px' }}><ZoomIn size={13} /></button>
            <div style={{ width: '1px', height: '12px', background: '#e8e8e8', margin: '0 1px' }} />
            <button onClick={resetView} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#666', padding: '3px 4px', borderRadius: '4px' }}><Maximize2 size={11} /></button>
          </div>
        </div>
      </div>

      {/* ── FIXED POPUPS ── */}

      {/* Pen presets */}
      {showPenMenu && (
        <div onPointerDown={e => e.stopPropagation()} style={{
          position: 'fixed', top: penMenuPos.top, left: penMenuPos.left, zIndex: 9999,
          background: '#fff', border: '1px solid #e8e8e8', borderRadius: '10px',
          padding: '6px', boxShadow: '0 8px 28px rgba(0,0,0,0.12)', minWidth: '200px',
        }}>
          {DEFAULT_PRESETS.map((preset, idx) => {
            const isActive = activePenPreset === idx && isPenActive;
            return (
              <button key={idx} onClick={() => { selectPreset(idx); setShowPenMenu(false); }} style={{
                width: '100%', padding: '7px 10px', border: 'none', textAlign: 'left',
                background: isActive ? '#ede9fb' : 'transparent', borderRadius: '6px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '10px',
              }}>
                <svg width="48" height="16" viewBox="0 0 48 16" style={{ flexShrink: 0 }}>
                  {preset.type === 'highlighter'
                    ? <path d="M2 11 Q24 7 46 11" stroke={preset.color} strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.5" />
                    : <path d="M2 13 Q18 3 46 7" stroke={preset.color} strokeWidth={Math.min(preset.width * 1.3, 5)} strokeLinecap="round" fill="none" />}
                </svg>
                <div>
                  <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: isActive ? 700 : 500, color: isActive ? '#5c33c1' : '#333' }}>{preset.label}</p>
                  <p style={{ margin: 0, fontSize: '0.65rem', color: '#aaa' }}>{preset.type === 'highlighter' ? 'Dạ quang' : 'Bút'} · cỡ {preset.width}</p>
                </div>
                {isActive && <Check size={13} style={{ color: '#5c33c1', marginLeft: 'auto', flexShrink: 0 }} />}
              </button>
            );
          })}
        </div>
      )}

      {/* Color picker */}
      {showColorPicker && (
        <div onPointerDown={e => e.stopPropagation()} style={{
          position: 'fixed', top: colorPickerPos.top, left: colorPickerPos.left, zIndex: 9999,
          background: '#fff', border: '1px solid #e8e8e8', borderRadius: '12px',
          padding: '10px', boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
          display: 'grid', gridTemplateColumns: 'repeat(7, 26px)', gap: '5px',
        }}>
          {COLORS.map(c => (
            <button key={c} onClick={() => { setColor(c); setShowColorPicker(false); }} style={{
              width: '26px', height: '26px', borderRadius: '50%', padding: 0, cursor: 'pointer',
              background: c, border: color === c ? '2.5px solid #5c33c1' : '1px solid #ddd',
              boxShadow: c === '#FFFFFF' ? 'inset 0 0 0 1px #ccc' : 'none',
            }} />
          ))}
          <div style={{ gridColumn: '1/-1', marginTop: '7px', display: 'flex', alignItems: 'center', gap: '8px', borderTop: '1px solid #f0f0f0', paddingTop: '7px' }}>
            <span style={{ fontSize: '0.68rem', color: '#aaa' }}>Tùy chọn</span>
            <input type="color" value={color} onChange={e => setColor(e.target.value)} style={{ width: '28px', height: '22px', border: 'none', cursor: 'pointer', padding: 0, background: 'none' }} />
            <span style={{ fontSize: '0.68rem', color: '#aaa', fontFamily: 'monospace' }}>{color}</span>
          </div>
        </div>
      )}

      {/* Size menu */}
      {showSizeMenu && (
        <div onPointerDown={e => e.stopPropagation()} style={{
          position: 'fixed', top: sizeMenuPos.top, left: sizeMenuPos.left, zIndex: 9999,
          background: '#fff', border: '1px solid #e8e8e8', borderRadius: '10px',
          padding: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: '160px',
        }}>
          <p style={{ margin: '0 0 6px 4px', fontSize: '0.66rem', color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Cỡ nét</p>
          {SIZE_OPTIONS.map(sz => (
            <button key={sz} onClick={() => { setLineWidth(sz); setShowSizeMenu(false); }} style={{
              width: '100%', padding: '6px 10px', border: 'none', textAlign: 'left', borderRadius: '6px',
              background: lineWidth === sz ? '#ede9fb' : 'transparent',
              color: lineWidth === sz ? '#5c33c1' : '#333',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
            }}>
              <div style={{ width: `${Math.min(sz * 1.4, 20)}px`, height: `${Math.min(sz * 1.4, 20)}px`, borderRadius: '50%', background: color, flexShrink: 0 }} />
              <span style={{ fontSize: '0.8rem', fontWeight: lineWidth === sz ? 700 : 500 }}>{sz}</span>
              {lineWidth === sz && <Check size={12} style={{ color: '#5c33c1', marginLeft: 'auto' }} />}
            </button>
          ))}
          <div style={{ borderTop: '1px solid #f0f0f0', marginTop: '6px', paddingTop: '6px', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 8px 2px' }}>
            <span style={{ fontSize: '0.68rem', color: '#aaa' }}>Khác:</span>
            <input type="number" min="1" max="40" value={lineWidth}
              onChange={e => { const v = Math.max(1, Math.min(40, parseInt(e.target.value) || 1)); setLineWidth(v); }}
              style={{ width: '48px', border: '1px solid #e0e0e0', borderRadius: '4px', padding: '2px 5px', fontSize: '0.78rem', textAlign: 'center', outline: 'none' }} />
          </div>
        </div>
      )}

      {/* Shape picker */}
      {showShapePicker && (
        <div onPointerDown={e => e.stopPropagation()} style={{
          position: 'fixed', top: shapePickerPos.top, left: shapePickerPos.left, zIndex: 9999,
          background: '#fff', border: '1px solid #e8e8e8', borderRadius: '9px',
          padding: '5px', boxShadow: '0 6px 20px rgba(0,0,0,0.1)', minWidth: '150px',
        }}>
          {SHAPE_OPTIONS.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => { setTool(id); setShowShapePicker(false); }} style={{
              width: '100%', padding: '7px 10px', border: 'none', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px',
              background: tool === id ? '#ede9fb' : 'transparent', color: tool === id ? '#5c33c1' : '#333',
              borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: tool === id ? 600 : 400,
            }}>
              <Icon size={14} /> {label}
              {tool === id && <Check size={12} style={{ color: '#5c33c1', marginLeft: 'auto' }} />}
            </button>
          ))}
        </div>
      )}

      {/* Background picker */}
      {showBgPicker && (
        <div onPointerDown={e => e.stopPropagation()} style={{
          position: 'fixed', top: bgPickerPos.top, left: bgPickerPos.left, zIndex: 9999,
          background: '#fff', border: '1px solid #e8e8e8', borderRadius: '10px',
          padding: '5px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: '190px',
        }}>
          {BG_OPTIONS.map(({ id, label, base }) => (
            <button key={id} onClick={() => { setBackground(id); setShowBgPicker(false); }} style={{
              width: '100%', padding: '7px 10px', border: 'none', textAlign: 'left',
              background: background === id ? '#ede9fb' : 'transparent', color: background === id ? '#5c33c1' : '#333',
              borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: background === id ? 600 : 400,
              display: 'flex', alignItems: 'center', gap: '9px',
            }}>
              <div style={{ width: '22px', height: '14px', borderRadius: '3px', background: base, border: '1px solid #ddd', flexShrink: 0 }} />
              {label}
              {background === id && <Check size={12} style={{ color: '#5c33c1', marginLeft: 'auto' }} />}
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
