import React, { useState } from 'react';
import { 
  Plus, 
  Layers, 
  AlertCircle, 
  Calendar, 
  Clock, 
  UserCheck, 
  ArrowRight,
  Sparkles,
  Kanban,
  Play
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function KanbanBoard({ hideHeader = false, selectedTaskId, setSelectedTaskId }) {
  const { 
    tasks, 
    projects, 
    boardColumns, 
    moveTask, 
    updateTask, 
    toggleSubtask,
    user,
    startFocusOnTask
  } = useApp();

  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [hoveredColumnId, setHoveredColumnId] = useState(null);

  // --- Add custom columns simple implementation ---
  const [columns, setColumns] = useState(boardColumns);
  const [newColName, setNewColName] = useState('');
  const [isAddingCol, setIsAddingCol] = useState(false);

  const handleAddColumn = (e) => {
    e.preventDefault();
    if (!newColName.trim()) return;
    const newCol = {
      id: `col-${Math.random().toString(36).substring(2, 9)}`,
      boardId: 'board-default',
      name: newColName.trim(),
      position: columns.length + 1
    };
    setColumns([...columns, newCol]);
    setNewColName('');
    setIsAddingCol(false);
  };

  // Helper mapping columns to tasks status
  const getTasksForColumn = (colId) => {
    let statusFilter = 'todo';
    if (colId === 'col-progress') statusFilter = 'in-progress';
    if (colId === 'col-done') statusFilter = 'done';
    
    // For custom columns, show tasks matching custom positions if any, or default to todo
    // In our simplified mock db, we map colId = col-todo -> 'todo', col-progress -> 'in-progress', col-done -> 'done'
    // Custom columns will display empty by default or can show other tasks
    
    if (colId !== 'col-todo' && colId !== 'col-progress' && colId !== 'col-done') {
      // Custom columns are placeholders for now
      return [];
    }

    return tasks.filter(t => t.status === statusFilter);
  };

  // --- Native HTML5 Drag and Drop ---
  const handleDragStart = (e, taskId) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleSubtaskDragStart = (e, taskId, subtaskId) => {
    e.stopPropagation();
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'subtask', taskId, subtaskId }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setHoveredColumnId(null);
  };

  const handleDragOver = (e, colId) => {
    e.preventDefault();
    if (hoveredColumnId !== colId) {
      setHoveredColumnId(colId);
    }
  };

  const handleDragLeave = () => {
    setHoveredColumnId(null);
  };

  const handleDrop = (e, colId) => {
    e.preventDefault();
    
    // Check if dragging a subtask
    try {
      const dataStr = e.dataTransfer.getData('application/json');
      if (dataStr) {
        const data = JSON.parse(dataStr);
        if (data.type === 'subtask') {
          const shouldBeCompleted = colId === 'col-done';
          const task = tasks.find(t => t.id === data.taskId);
          const subtask = task?.subtasks?.find(s => s.id === data.subtaskId);
          if (subtask && subtask.completed !== shouldBeCompleted) {
            toggleSubtask(data.taskId, data.subtaskId);
          }
          setDraggedTaskId(null);
          setHoveredColumnId(null);
          return;
        }
      }
    } catch (err) {
      // Not a subtask or JSON error, fallback to normal task drop
    }

    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (taskId) {
      moveTask(taskId, colId);
    }
    setDraggedTaskId(null);
    setHoveredColumnId(null);
  };

  // Click card fallback to move
  const handleQuickMove = (taskId, currentColId) => {
    let nextColId = 'col-progress';
    if (currentColId === 'col-todo') nextColId = 'col-progress';
    else if (currentColId === 'col-progress') nextColId = 'col-done';
    else if (currentColId === 'col-done') nextColId = 'col-todo';

    moveTask(taskId, nextColId);
  };

  return (
    <div className="slide-in" style={{ padding: hideHeader ? '0' : '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%', minHeight: hideHeader ? 'auto' : 'calc(100vh - 3rem)' }}>
      
      {/* Board Title & Controls */}
      {!hideHeader && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0 }}>Bảng Công Việc (Kanban)</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Kéo thả các công việc giữa các cột để cập nhật trạng thái trực quan.</p>
          </div>

          {/* Add custom column button */}
          <div>
            {isAddingCol ? (
              <form onSubmit={handleAddColumn} style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="text" 
                  placeholder="Tên cột mới..." 
                  required
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  style={{
                    padding: '0.4rem 0.75rem',
                    borderRadius: '6px',
                    background: 'var(--bg-glass)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem'
                  }}
                />
                <button type="submit" className="btn-primary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>Thêm</button>
                <button type="button" onClick={() => setIsAddingCol(false)} className="btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>Hủy</button>
              </form>
            ) : (
              <button onClick={() => setIsAddingCol(true)} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
                <Plus size={16} /> Add Column
              </button>
            )}
          </div>
        </div>
      )}

      {/* Kanban columns Grid */}
      <div style={{
        display: 'grid',
        gridAutoFlow: 'column',
        gridAutoColumns: 'minmax(280px, 1fr)',
        gap: '1.25rem',
        overflowX: 'auto',
        paddingBottom: '1rem',
        alignItems: 'stretch',
        flex: 1
      }}>
        {columns.map(col => {
          const colTasks = getTasksForColumn(col.id);
          const isHovered = hoveredColumnId === col.id;

          // Determine column headers color highlights
          let accentColor = 'var(--accent-primary)';
          if (col.id === 'col-progress') accentColor = 'var(--accent-warning)';
          if (col.id === 'col-done') accentColor = 'var(--accent-success)';

          return (
            <div
              key={col.id}
              className="glass-panel"
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.id)}
              style={{
                padding: '1.25rem 1rem',
                background: isHovered ? 'rgba(99,102,241,0.06)' : 'var(--bg-card)',
                border: `1.5px dashed ${isHovered ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                minHeight: '400px',
                transition: 'var(--transition-smooth)'
              }}
            >
              {/* Column Title Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: `2.5px solid ${accentColor}`,
                paddingBottom: '0.5rem',
                marginBottom: '0.25rem'
              }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Layers size={14} style={{ color: accentColor }} />
                  {col.name}
                </h3>
                <span style={{ fontSize: '0.78rem', background: 'var(--border-color)', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>
                  {colTasks.length}
                </span>
              </div>

              {/* Tasks List container */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                overflowY: 'auto',
                flex: 1
              }}>
                {colTasks.map(task => {
                  const projectData = projects.find(p => p.id === task.projectId);
                  const isBlocked = task.dependencies && task.dependencies.length > 0;

                  return (
                    <div
                      key={task.id}
                      draggable="true"
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => setSelectedTaskId && setSelectedTaskId(task.id)}
                      style={{
                        background: selectedTaskId === task.id ? 'rgba(99,102,241,0.06)' : 'var(--bg-glass)',
                        border: `1px solid ${selectedTaskId === task.id ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                        borderRadius: 'var(--radius-md)',
                        padding: '0.85rem',
                        cursor: 'grab',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.65rem',
                        transition: 'var(--transition-smooth)',
                        opacity: draggedTaskId === task.id ? 0.4 : 1,
                        boxShadow: '0 4px 6px rgba(0,0,0,0.02)'
                      }}
                      className="glass-card-interactive"
                      title="Kéo thả thẻ này để thay đổi trạng thái hoặc click để xem chi tiết"
                    >
                      {/* Title line */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                          {task.title}
                        </span>
                      </div>

                      {/* Description clip */}
                      {task.description && (
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {task.description}
                        </p>
                      )}

                      {/* Project Tag */}
                      {projectData && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: projectData.color }} />
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                            {projectData.name}
                          </span>
                        </div>
                      )}

                      {/* Subtasks inline list in Kanban card */}
                      {task.subtasks && task.subtasks.length > 0 && (
                        <div 
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                            background: 'rgba(0, 0, 0, 0.12)',
                            padding: '6px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-color)',
                            maxHeight: '120px',
                            overflowY: 'auto'
                          }}
                        >
                          {task.subtasks.map(sub => (
                            <div
                              key={sub.id}
                              draggable="true"
                              onDragStart={(e) => handleSubtaskDragStart(e, task.id, sub.id)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '6px',
                                fontSize: '0.72rem',
                                background: 'rgba(255, 255, 255, 0.02)',
                                padding: '4px 6px',
                                borderRadius: '4px',
                                cursor: 'grab',
                                border: '1px solid transparent',
                                transition: 'var(--transition-smooth)'
                              }}
                              title="Kéo thả bước phụ này sang cột khác để đổi trạng thái"
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startFocusOnTask(task.id, sub.id);
                                  }}
                                  style={{
                                    border: 'none',
                                    background: 'none',
                                    color: 'var(--accent-primary)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: 0
                                  }}
                                  title="Bắt đầu làm (Pomodoro)"
                                >
                                  <Play size={10} fill="var(--accent-primary)" />
                                </button>

                                <input 
                                  type="checkbox"
                                  checked={sub.completed}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    toggleSubtask(task.id, sub.id);
                                  }}
                                  style={{ cursor: 'pointer' }}
                                />
                                <span style={{
                                  textDecoration: sub.completed ? 'line-through' : 'none',
                                  color: sub.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                                  textOverflow: 'ellipsis',
                                  overflow: 'hidden',
                                  whiteSpace: 'nowrap',
                                  flex: 1
                                }}>
                                  {sub.title}
                                </span>
                              </div>
                              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginLeft: '4px', flexShrink: 0 }}>
                                ({sub.actualTime || 0}m/{sub.estimatedTime || 30}m)
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Bottom row badges & quick action button */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderTop: '1px dashed var(--border-color)',
                        paddingTop: '0.5rem',
                        marginTop: '0.25rem'
                      }}>
                        {/* Dates/Warnings badges */}
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {task.dueDate && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                              <Calendar size={10} /> {task.dueDate.substring(5)}
                            </span>
                          )}
                          {isBlocked && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--accent-warning)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                              <AlertCircle size={10} /> Chặn
                            </span>
                          )}
                          {task.subtasks && task.subtasks.length > 0 && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                              <Layers size={10} /> {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}
                            </span>
                          )}
                        </div>

                        {/* Quick move arrow for click fallbacks */}
                        <button
                          onClick={() => handleQuickMove(task.id, col.id)}
                          style={{
                            border: 'none',
                            background: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: '2px',
                            display: 'flex',
                            alignItems: 'center',
                            borderRadius: '4px'
                          }}
                          className="glass-card-interactive"
                          title="Chuyển nhanh sang cột tiếp theo"
                        >
                          <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {colTasks.length === 0 && (
                  <div style={{
                    padding: '2rem',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '0.75rem',
                    border: '1px dashed var(--border-color)',
                    borderRadius: '8px',
                    margin: '1rem 0'
                  }}>
                    Thả nhiệm vụ vào đây
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
