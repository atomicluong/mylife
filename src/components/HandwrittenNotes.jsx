import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Undo2, 
  Redo2, 
  Save, 
  Plus, 
  Trash2, 
  Edit3, 
  Hand, 
  PenTool, 
  Highlighter, 
  Eraser, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  FolderOpen,
  Check,
  Menu
} from 'lucide-react';
import { notesDb } from '../utils/notesDb';

export default function HandwrittenNotes() {
  // State quản lý danh sách Ghi chú từ IndexedDB
  const [notes, setNotes] = useState([]);
  const [currentNoteId, setCurrentNoteId] = useState(null);
  const [noteTitle, setNoteTitle] = useState('Phác thảo OKRs Chiến lược');
  
  // Trạng thái vẽ
  const [strokes, setStrokes] = useState([]);
  const [tool, setTool] = useState('pen'); // pen, highlighter, eraser, hand
  const [color, setColor] = useState('#FFFFFF');
  const [lineWidth, setLineWidth] = useState(3);
  
  // Trạng thái Canvas vô hạn (Pan & Zoom)
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [zoomScale, setZoomScale] = useState(1);
  
  // Trạng thái UI
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [saveStatus, setSaveStatus] = useState('idle'); // idle, saving, saved, error
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');

  // Lịch sử Undo / Redo
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Refs
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const isDrawing = useRef(false);
  const currentPoints = useRef([]);
  const lastPointerPos = useRef({ x: 0, y: 0 });
  const activePointers = useRef(new Map());
  const initialPinchDist = useRef(0);
  const initialPinchZoom = useRef(1);
  const hasErasedThisSession = useRef(false);
  
  // Màu sắc cao cấp thiết lập sẵn
  const premiumColors = [
    { name: 'White', value: '#FFFFFF' },
    { name: 'Red', value: '#FF3B30' },
    { name: 'Gold', value: '#FFCC00' },
    { name: 'Blue', value: '#007AFF' },
    { name: 'Green', value: '#34C759' }
  ];

  // --- 1. Quản lý tải và tạo ghi chú ---
  
  // Load danh sách ghi chú ban đầu
  useEffect(() => {
    loadAllNotes();
  }, []);

  const loadAllNotes = async () => {
    try {
      const allNotes = await notesDb.getAllNotes();
      setNotes(allNotes);
      
      if (allNotes.length > 0) {
        // Tải ghi chú đầu tiên nếu chưa chọn ghi chú nào
        if (!currentNoteId) {
          loadNote(allNotes[0]);
        }
      } else {
        // Nếu chưa có ghi chú nào, tự động tạo mới
        handleCreateNewNote();
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách ghi chú:', err);
    }
  };

  const loadNote = (note) => {
    setCurrentNoteId(note.id);
    setNoteTitle(note.title);
    setTitleInput(note.title);
    setStrokes(note.strokes || []);
    setOffsetX(note.offsetX !== undefined ? note.offsetX : 0);
    setOffsetY(note.offsetY !== undefined ? note.offsetY : 0);
    setZoomScale(note.zoomScale !== undefined ? note.zoomScale : 1);
    
    // Reset lịch sử Undo/Redo cho note mới
    setHistory([note.strokes || []]);
    setHistoryIndex(0);
  };

  const handleCreateNewNote = async () => {
    const newNote = {
      id: Math.random().toString(36).substring(2, 15),
      title: `Ghi chú mới ${new Date().toLocaleDateString('vi-VN')}`,
      strokes: [],
      offsetX: 0,
      offsetY: 0,
      zoomScale: 1,
      updatedAt: Date.now()
    };
    
    try {
      await notesDb.saveNote(newNote);
      await loadAllNotes();
      loadNote(newNote);
      setIsSidebarOpen(false); // Đóng sidebar để tập trung vẽ
    } catch (err) {
      console.error('Lỗi tạo ghi chú mới:', err);
    }
  };

  const handleDeleteNote = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Bạn có chắc chắn muốn xóa ghi chú này không?')) return;
    
    try {
      await notesDb.deleteNote(id);
      const remainingNotes = notes.filter(n => n.id !== id);
      setNotes(remainingNotes);
      
      if (currentNoteId === id) {
        if (remainingNotes.length > 0) {
          loadNote(remainingNotes[0]);
        } else {
          handleCreateNewNote();
        }
      }
    } catch (err) {
      console.error('Lỗi khi xóa ghi chú:', err);
    }
  };

  const handleSaveNote = async () => {
    if (!currentNoteId) return;
    setSaveStatus('saving');
    
    const noteData = {
      id: currentNoteId,
      title: noteTitle,
      strokes: strokes,
      offsetX: offsetX,
      offsetY: offsetY,
      zoomScale: zoomScale
    };
    
    try {
      await notesDb.saveNote(noteData);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
      
      // Cập nhật lại danh sách ghi chú
      const allNotes = await notesDb.getAllNotes();
      setNotes(allNotes);
    } catch (err) {
      console.error('Lỗi khi lưu ghi chú:', err);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleRenameNote = async () => {
    if (!titleInput.trim()) return;
    setNoteTitle(titleInput);
    setIsEditingTitle(false);
    
    if (currentNoteId) {
      const noteData = {
        id: currentNoteId,
        title: titleInput,
        strokes: strokes,
        offsetX: offsetX,
        offsetY: offsetY,
        zoomScale: zoomScale
      };
      
      try {
        await notesDb.saveNote(noteData);
        // Refresh danh sách
        const allNotes = await notesDb.getAllNotes();
        setNotes(allNotes);
      } catch (err) {
        console.error('Lỗi đổi tên ghi chú:', err);
      }
    }
  };

  // Tự động lưu sau 10 giây khi có thay đổi nét vẽ
  useEffect(() => {
    if (strokes.length === 0 && offsetX === 0 && offsetY === 0 && zoomScale === 1) return;
    
    const timer = setTimeout(() => {
      handleSaveNote();
    }, 10000);

    return () => clearTimeout(timer);
  }, [strokes, offsetX, offsetY, zoomScale]);


  // --- 2. Bộ xử lý Undo / Redo ---
  
  const pushToHistory = (newStrokes) => {
    const updatedHistory = history.slice(0, historyIndex + 1);
    updatedHistory.push(newStrokes);
    setHistory(updatedHistory);
    setHistoryIndex(updatedHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setStrokes(history[newIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setStrokes(history[newIndex]);
    }
  };


  // --- 3. Công thức tính toán tọa độ thế giới (World Coordinate) ---

  const getCanvasMousePos = (clientX, clientY) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const screenX = clientX - rect.left;
    const screenY = clientY - rect.top;
    
    // Chuyển đổi từ tọa độ màn hình sang tọa độ thế giới trong Canvas vô hạn
    const worldX = (screenX - offsetX) / zoomScale;
    const worldY = (screenY - offsetY) / zoomScale;
    
    return { worldX, worldY, screenX, screenY };
  };


  // --- 4. Thiết lập Canvas & Kết xuất Đồ họa (Render loop) ---

  const render = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width / (window.devicePixelRatio || 1);
    const height = canvas.height / (window.devicePixelRatio || 1);
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Vẽ nền Charcoal tối đẳng cấp (#121212)
    ctx.fillStyle = '#121212';
    ctx.fillRect(0, 0, width, height);
    
    // Vẽ lưới Dynamic Dot-matrix
    drawGrid(ctx, width, height);
    
    // Vẽ các nét vẽ hiện có và nét đang vẽ dở
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(zoomScale, zoomScale);
    
    // Vẽ tất cả nét đã lưu
    drawStrokes(ctx, strokes);
    
    // Vẽ nét hiện tại đang vẽ dở
    if (isDrawing.current && currentPoints.current.length > 0) {
      const tempStroke = {
        type: tool,
        color: color,
        width: lineWidth,
        points: currentPoints.current
      };
      drawStrokes(ctx, [tempStroke]);
    }
    
    ctx.restore();
  };

  // Lắng nghe thay đổi kích thước container để scale canvas sắc nét
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      
      const dpr = window.devicePixelRatio || 1;
      const width = container.clientWidth;
      const height = container.clientHeight;
      
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      
      render();
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [strokes, offsetX, offsetY, zoomScale, tool, color, lineWidth]);

  // Vẽ lại mỗi khi strokes thay đổi
  useEffect(() => {
    render();
  }, [strokes, offsetX, offsetY, zoomScale]);

  // Vẽ lưới chấm động
  const drawGrid = (ctx, width, height) => {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)'; // Chấm xám mờ tinh tế
    
    const baseSpacing = 28; // Khoảng cách lưới cơ bản
    const gridSpacing = baseSpacing * zoomScale;
    
    // Tính toán điểm bắt đầu vẽ lưới để tối ưu hiệu năng (chỉ vẽ phần hiển thị)
    const startX = (offsetX % gridSpacing) - gridSpacing;
    const startY = (offsetY % gridSpacing) - gridSpacing;
    
    // Tự điều chỉnh kích thước chấm khi zoom xa/gần
    const dotRadius = Math.max(0.6, 1.1 * zoomScale);
    
    for (let x = startX; x < width + gridSpacing; x += gridSpacing) {
      for (let y = startY; y < height + gridSpacing; y += gridSpacing) {
        ctx.beginPath();
        ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  };

  // Vẽ nét vẽ
  const drawStrokes = (ctx, strokesToDraw) => {
    strokesToDraw.forEach(stroke => {
      if (stroke.points.length === 0) return;
      
      ctx.save();
      
      // Áp dụng độ trong suốt của Highlighter hoặc Pen thường
      if (stroke.type === 'highlighter') {
        ctx.globalAlpha = 0.4;
        ctx.strokeStyle = stroke.color;
      } else {
        ctx.globalAlpha = 1.0;
        ctx.strokeStyle = stroke.color;
      }
      
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      const pts = stroke.points;
      
      if (pts.length === 1) {
        // Chỉ vẽ 1 chấm tròn nếu click/tap 1 điểm
        ctx.beginPath();
        ctx.fillStyle = stroke.color;
        const p = pts[0];
        const pSize = stroke.width * (p.p !== undefined ? p.p * 1.5 : 1.0);
        ctx.arc(p.x, p.y, pSize / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Sử dụng nét vẽ nét bút mực nếu là bút Pen
        if (stroke.type === 'pen') {
          // Vẽ từng đoạn để thay đổi độ dày theo lực nhấn của bút stylus
          for (let i = 1; i < pts.length; i++) {
            const p1 = pts[i - 1];
            const p2 = pts[i];
            
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            
            // Tính toán độ dày dựa vào lực nhấn pressure
            const pressure1 = p1.p !== undefined ? p1.p : 0.5;
            const pressure2 = p2.p !== undefined ? p2.p : 0.5;
            const avgPressure = (pressure1 + pressure2) / 2;
            
            // Hệ số lực nhấn dao động 0.4x đến 1.6x độ dày cơ bản
            const dynamicWidth = stroke.width * (0.4 + avgPressure * 1.2);
            
            ctx.lineWidth = Math.max(0.8, dynamicWidth);
            ctx.stroke();
          }
        } else {
          // Bút highlighter vẽ nét đều để tạo cảm giác đánh dấu khối
          ctx.lineWidth = stroke.width * 2.5; // highlighter dày hơn
          ctx.beginPath();
          ctx.moveTo(pts[0].x, pts[0].y);
          
          for (let i = 1; i < pts.length - 1; i++) {
            const xc = (pts[i].x + pts[i + 1].x) / 2;
            const yc = (pts[i].y + pts[i + 1].y) / 2;
            ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
          }
          
          if (pts.length > 1) {
            const last = pts[pts.length - 1];
            ctx.lineTo(last.x, last.y);
          }
          ctx.stroke();
        }
      }
      
      ctx.restore();
    });
  };


  // --- 5. Công cụ Tẩy nét (Stroke-based Eraser) ---

  const handleErasing = (worldX, worldY) => {
    const eraserRadius = 16; // bán kính cục tẩy (pixel)
    const threshold = eraserRadius / zoomScale;
    
    const remainingStrokes = strokes.filter(stroke => {
      // Kiểm tra xem khoảng cách từ nét tẩy tới bất kỳ điểm nào của stroke có dưới ngưỡng không
      const isClose = stroke.points.some(p => {
        const dx = p.x - worldX;
        const dy = p.y - worldY;
        return dx * dx + dy * dy < threshold * threshold;
      });
      
      if (isClose) {
        hasErasedThisSession.current = true;
      }
      return !isClose;
    });

    if (remainingStrokes.length !== strokes.length) {
      setStrokes(remainingStrokes);
    }
  };


  // --- 6. Xử lý các Sự kiện Pointer (Mouse/Stylus/Touch) ---

  const handlePointerDown = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.setPointerCapture(e.pointerId);
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    const { worldX, worldY } = getCanvasMousePos(e.clientX, e.clientY);
    lastPointerPos.current = { x: e.clientX, y: e.clientY };

    // A. 2+ ngón tay: pinch zoom + pan
    if (activePointers.current.size >= 2) {
      isDrawing.current = false;
      currentPoints.current = [];
      const pointerIds = Array.from(activePointers.current.keys());
      const p1 = activePointers.current.get(pointerIds[0]);
      const p2 = activePointers.current.get(pointerIds[1]);
      initialPinchDist.current = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      initialPinchZoom.current = zoomScale;
      return;
    }

    // B. Ngón tay (touch): luôn kéo canvas — không cần chuyển chế độ
    if (e.pointerType === 'touch') {
      isDrawing.current = false;
      return;
    }

    // C. Hand tool hoặc chuột giữa: kéo canvas
    if (tool === 'hand' || e.buttons === 4) {
      isDrawing.current = false;
      return;
    }

    // D. Tẩy (bút hoặc chuột)
    if (tool === 'eraser') {
      isDrawing.current = true;
      hasErasedThisSession.current = false;
      handleErasing(worldX, worldY);
      return;
    }

    // E. Vẽ bằng bút stylus hoặc chuột
    isDrawing.current = true;
    const pressure = e.pressure !== undefined && e.pressure > 0 ? e.pressure : 0.5;
    currentPoints.current = [{ x: worldX, y: worldY, p: pressure }];
    render();
  };

  const handlePointerMove = (e) => {
    if (!activePointers.current.has(e.pointerId)) return;

    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    const { worldX, worldY } = getCanvasMousePos(e.clientX, e.clientY);

    // A. 2+ ngón tay: pinch zoom + pan
    if (activePointers.current.size >= 2) {
      const pointerIds = Array.from(activePointers.current.keys());
      const p1 = activePointers.current.get(pointerIds[0]);
      const p2 = activePointers.current.get(pointerIds[1]);

      const currentDist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      if (initialPinchDist.current > 0) {
        const factor = currentDist / initialPinchDist.current;
        let newZoom = initialPinchZoom.current * factor;
        newZoom = Math.max(0.2, Math.min(4, newZoom));
        setZoomScale(newZoom);
      }

      const dx = e.clientX - lastPointerPos.current.x;
      const dy = e.clientY - lastPointerPos.current.y;
      setOffsetX(prev => prev + dx / 2);
      setOffsetY(prev => prev + dy / 2);
      lastPointerPos.current = { x: e.clientX, y: e.clientY };
      return;
    }

    // B. 1 ngón tay: luôn kéo canvas
    if (e.pointerType === 'touch') {
      const dx = e.clientX - lastPointerPos.current.x;
      const dy = e.clientY - lastPointerPos.current.y;
      setOffsetX(prev => prev + dx);
      setOffsetY(prev => prev + dy);
      lastPointerPos.current = { x: e.clientX, y: e.clientY };
      return;
    }

    // C. Hand tool hoặc chuột giữa: kéo canvas
    if (tool === 'hand' || e.buttons === 4) {
      const dx = e.clientX - lastPointerPos.current.x;
      const dy = e.clientY - lastPointerPos.current.y;
      setOffsetX(prev => prev + dx);
      setOffsetY(prev => prev + dy);
      lastPointerPos.current = { x: e.clientX, y: e.clientY };
      return;
    }

    if (!isDrawing.current) return;

    if (tool === 'eraser') {
      handleErasing(worldX, worldY);
    } else {
      const pressure = e.pressure !== undefined && e.pressure > 0 ? e.pressure : 0.5;
      const pts = currentPoints.current;
      if (pts.length > 0) {
        const lastPt = pts[pts.length - 1];
        const dist = Math.hypot(worldX - lastPt.x, worldY - lastPt.y);
        if (dist < 1.0) return;
      }
      currentPoints.current.push({ x: worldX, y: worldY, p: pressure });
      render();
    }
  };

  const handlePointerUp = (e) => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.releasePointerCapture(e.pointerId);
    }
    
    activePointers.current.delete(e.pointerId);

    if (isDrawing.current) {
      isDrawing.current = false;
      
      if (tool === 'eraser') {
        // Đẩy trạng thái mới sau khi tẩy vào Lịch sử Undo
        if (hasErasedThisSession.current) {
          pushToHistory(strokes);
        }
      } else if (currentPoints.current.length > 0) {
        // Hoàn tất nét vẽ và lưu
        const newStroke = {
          id: Math.random().toString(36).substring(2, 9),
          type: tool,
          color: color,
          width: lineWidth,
          points: [...currentPoints.current]
        };
        
        const nextStrokes = [...strokes, newStroke];
        setStrokes(nextStrokes);
        pushToHistory(nextStrokes);
        currentPoints.current = [];
      }
    }
    
    // Reset khoảng cách pinch
    if (activePointers.current.size < 2) {
      initialPinchDist.current = 0;
    }
  };

  const handlePointerCancel = (e) => {
    activePointers.current.delete(e.pointerId);
    isDrawing.current = false;
    currentPoints.current = [];
  };


  // --- 7. Điều khiển Thu phóng nhanh và Reset View ---

  const handleZoom = (direction) => {
    setZoomScale(prev => {
      let nextZoom = direction === 'in' ? prev * 1.25 : prev / 1.25;
      return Math.max(0.2, Math.min(4, nextZoom));
    });
  };

  const handleResetView = () => {
    setOffsetX(0);
    setOffsetY(0);
    setZoomScale(1);
  };


  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden flex" style={{ background: '#121212' }}>
      
      {/* SIDEBAR: Quản lý danh sách ghi chú (Toggled) */}
      {isSidebarOpen && (
        <div 
          className="h-full border-r border-white/10 flex flex-col z-20 transition-all duration-300"
          style={{ 
            width: '280px', 
            background: 'rgba(18, 18, 18, 0.95)',
            backdropFilter: 'blur(10px)',
            flexShrink: 0
          }}
        >
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-white font-bold text-sm tracking-wider uppercase flex items-center gap-2">
              <FolderOpen size={16} className="text-amber-500" /> Bản phác thảo
            </h3>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="text-gray-400 hover:text-white p-1 rounded-md hover:bg-white/5 cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
          </div>

          {/* Nút Tạo ghi chú mới */}
          <div className="p-3">
            <button 
              onClick={handleCreateNewNote}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-2.5 px-4 font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <Plus size={14} /> Tạo Ghi chú mới
            </button>
          </div>

          {/* Danh sách Ghi chú */}
          <div className="flex-1 overflow-y-auto px-2 space-y-1">
            {notes.map(note => {
              const isSelected = note.id === currentNoteId;
              return (
                <div
                  key={note.id}
                  onClick={() => loadNote(note)}
                  className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-indigo-600/15 border border-indigo-500/30 text-white' 
                      : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <p className={`text-xs font-semibold truncate ${isSelected ? 'text-indigo-400' : 'text-gray-200'}`}>
                      {note.title}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-1">
                      {new Date(note.updatedAt).toLocaleDateString('vi-VN')} {new Date(note.updatedAt).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                  
                  {/* Nút xóa ẩn đi, hiện khi hover */}
                  <button
                    onClick={(e) => handleDeleteNote(note.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 hover:bg-white/5 rounded transition-all cursor-pointer"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="p-3 border-t border-white/10 text-center">
            <span className="text-[10px] text-gray-500">TimeFlow Infinite Sketchpad</span>
          </div>
        </div>
      )}

      {/* Nút để mở lại Sidebar khi bị ẩn */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="absolute left-4 top-4 z-30 bg-[#1e1e1e]/85 hover:bg-[#2e2e2e] border border-white/10 text-gray-300 hover:text-white p-2.5 rounded-lg shadow-lg backdrop-blur-md transition-all cursor-pointer"
        >
          <Menu size={16} />
        </button>
      )}

      {/* MAIN CANVAS CONTAINER */}
      <div className="flex-1 h-full relative flex flex-col">
        
        {/* TOP FLOATING TOOLBAR: Glassmorphism bar */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 w-[92%] max-w-4xl">
          <div 
            className="flex items-center justify-between px-4 py-2.5 rounded-xl border border-white/10 shadow-2xl backdrop-blur-xl transition-all"
            style={{ background: 'rgba(26, 26, 26, 0.75)' }}
          >
            {/* Cánh trái: Tiêu đề sửa đổi được */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <Edit3 size={14} className="text-indigo-400 shrink-0" />
                {isEditingTitle ? (
                  <input
                    type="text"
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    onBlur={handleRenameNote}
                    onKeyDown={(e) => e.key === 'Enter' && handleRenameNote()}
                    autoFocus
                    className="bg-white/5 border border-indigo-500/50 rounded px-2 py-0.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold w-40 md:w-56"
                  />
                ) : (
                  <span 
                    onClick={() => setIsEditingTitle(true)}
                    className="text-xs md:text-sm font-bold text-gray-100 hover:text-white cursor-pointer select-none truncate hover:underline"
                  >
                    {noteTitle}
                  </span>
                )}
              </div>
            </div>

            {/* Cánh phải: Undo/Redo & Save */}
            <div className="flex items-center gap-1 md:gap-2">
              <button
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                className={`p-1.5 md:p-2 rounded-lg transition-all ${
                  historyIndex > 0 
                    ? 'text-gray-300 hover:bg-white/5 hover:text-white cursor-pointer' 
                    : 'text-gray-600 cursor-not-allowed'
                }`}
                title="Undo (Ctrl+Z)"
              >
                <Undo2 size={15} />
              </button>
              
              <button
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                className={`p-1.5 md:p-2 rounded-lg transition-all ${
                  historyIndex < history.length - 1 
                    ? 'text-gray-300 hover:bg-white/5 hover:text-white cursor-pointer' 
                    : 'text-gray-600 cursor-not-allowed'
                }`}
                title="Redo (Ctrl+Y)"
              >
                <Redo2 size={15} />
              </button>

              <div className="h-4 w-px bg-white/10 mx-1" />

              <button
                onClick={handleSaveNote}
                className="bg-white/10 hover:bg-white/15 border border-white/5 text-gray-200 hover:text-white rounded-lg py-1.5 px-3 md:px-4 font-semibold text-xs flex items-center gap-1.5 transition-all shadow-lg hover:shadow-white/5 cursor-pointer"
              >
                {saveStatus === 'saving' ? (
                  <span className="h-3 w-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                ) : saveStatus === 'saved' ? (
                  <Check size={13} className="text-green-400 animate-bounce" />
                ) : (
                  <Save size={13} />
                )}
                <span className="hidden sm:inline">
                  {saveStatus === 'saving' ? 'Đang lưu...' : saveStatus === 'saved' ? 'Đã lưu' : 'Lưu & Đồng bộ'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* CANVAS GRAPHICS AREA */}
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          style={{ touchAction: 'none', display: 'block' }}
          className="flex-1 cursor-crosshair"
        />

        {/* WIDGET ZOOM (GÓC DƯỚI BÊN PHẢI) */}
        <div className="absolute bottom-24 md:bottom-6 right-4 z-30 flex items-center gap-1 bg-[#1e1e1e]/85 border border-white/10 rounded-lg p-1 shadow-2xl backdrop-blur-md">
          <button
            onClick={() => handleZoom('out')}
            className="text-gray-400 hover:text-white p-1 rounded hover:bg-white/5 cursor-pointer"
            title="Thu nhỏ"
          >
            <ZoomOut size={14} />
          </button>
          
          <span 
            onClick={handleResetView}
            className="text-[10px] md:text-xs text-gray-400 hover:text-white font-mono font-semibold px-2 cursor-pointer select-none"
            title="Reset tỷ lệ & vị trí"
          >
            {Math.round(zoomScale * 100)}%
          </span>

          <button
            onClick={() => handleZoom('in')}
            className="text-gray-400 hover:text-white p-1 rounded hover:bg-white/5 cursor-pointer"
            title="Phóng to"
          >
            <ZoomIn size={14} />
          </button>

          <button
            onClick={handleResetView}
            className="text-gray-400 hover:text-white p-1 rounded hover:bg-white/5 cursor-pointer ml-0.5 border-l border-white/10 pl-1.5"
            title="Về tọa độ trung tâm (0,0)"
          >
            <Maximize2 size={12} />
          </button>
        </div>

        {/* BOTTOM FLOATING DOCK: Tool & Palette Selector */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-[92%] max-w-xl">
          <div 
            className="flex flex-col md:flex-row md:items-center justify-between p-3 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-xl gap-3"
            style={{ background: 'rgba(26, 26, 26, 0.75)' }}
          >
            
            {/* Trái: Chọn Brush Type (Bút mực, Bút dạ quang, Tẩy, Bàn tay) */}
            <div className="flex items-center justify-around md:justify-start gap-1">
              <button
                onClick={() => setTool('pen')}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  tool === 'pen'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-110'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`}
                title="Bút vẽ mực mượt"
              >
                <PenTool size={16} />
              </button>
              
              <button
                onClick={() => setTool('highlighter')}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  tool === 'highlighter'
                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30 scale-110'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`}
                title="Bút dạ quang đánh dấu"
              >
                <Highlighter size={16} />
              </button>

              <button
                onClick={() => setTool('eraser')}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  tool === 'eraser'
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 scale-110'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`}
                title="Tẩy nét vẽ nhanh"
              >
                <Eraser size={16} />
              </button>

              <button
                onClick={() => setTool('hand')}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  tool === 'hand'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 scale-110'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`}
                title="Bàn tay di chuyển khung vẽ"
              >
                <Hand size={16} />
              </button>
            </div>

            {/* Giữa: Thanh kéo kích cỡ nét vẽ */}
            <div className="flex items-center gap-2.5 px-1 flex-1">
              <span className="text-[10px] text-gray-500 font-bold tracking-wider shrink-0 uppercase">Size</span>
              <input
                type="range"
                min="1"
                max="10"
                step="0.5"
                value={lineWidth}
                onChange={(e) => setLineWidth(parseFloat(e.target.value))}
                className="flex-1 accent-indigo-500 h-1 rounded-lg bg-white/10 appearance-none cursor-pointer"
              />
              
              {/* Dynamic Live Preview Dot */}
              <div className="w-6 h-6 flex items-center justify-center bg-white/5 rounded-md border border-white/5 shrink-0">
                <div 
                  className="rounded-full transition-all"
                  style={{
                    width: `${lineWidth * 1.8}px`,
                    height: `${lineWidth * 1.8}px`,
                    background: tool === 'eraser' ? '#ff3b30' : tool === 'hand' ? '#10b981' : color,
                    opacity: tool === 'highlighter' ? 0.5 : 1
                  }}
                />
              </div>
            </div>

            {/* Phải: Bảng màu chấm tròn (Ẩn khi chọn tẩy/bàn tay) */}
            {tool !== 'eraser' && tool !== 'hand' && (
              <div className="flex items-center justify-center gap-2 border-t md:border-t-0 md:border-l border-white/10 pt-2.5 md:pt-0 md:pl-3">
                {premiumColors.map(c => {
                  const isSelected = color === c.value;
                  return (
                    <button
                      key={c.name}
                      onClick={() => setColor(c.value)}
                      className="relative p-0.5 rounded-full transition-all hover:scale-110 active:scale-95 cursor-pointer"
                    >
                      <div 
                        className="w-4 h-4 rounded-full border border-white/20"
                        style={{ background: c.value }}
                      />
                      {isSelected && (
                        <div 
                          className="absolute inset-0 rounded-full border-2 border-indigo-400 animate-ping opacity-60"
                          style={{ borderColor: c.value }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

          </div>
        </div>

      </div>

    </div>
  );
}
