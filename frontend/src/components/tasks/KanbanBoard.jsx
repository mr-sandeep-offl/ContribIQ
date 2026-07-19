import React, { useState } from 'react';
import Badge from '../common/Badge';
import { Calendar, User, Clock, AlertTriangle } from 'lucide-react';
import { formatDate } from '../../utils/formatDate';

const KanbanBoard = ({ tasks, onTaskDrop, onCardClick, members = [] }) => {
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  const columns = [
    { id: 'todo', title: 'To Do', color: 'border-t-slate-500 bg-slate-950/20' },
    { id: 'in_progress', title: 'In Progress', color: 'border-t-indigo-500 bg-indigo-950/10' },
    { id: 'review', title: 'Under Review', color: 'border-t-amber-500 bg-amber-950/10' },
    { id: 'completed', title: 'Completed', color: 'border-t-emerald-500 bg-emerald-950/10' },
  ];

  const handleDragStart = (e, taskId) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, colId) => {
    e.preventDefault();
    setDragOverColumn(colId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e, colId) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    setDragOverColumn(null);
    setDraggedTaskId(null);
    if (taskId) {
      onTaskDrop(taskId, colId);
    }
  };

  const getPriorityColor = (prio) => {
    switch (prio) {
      case 'critical':
        return 'danger';
      case 'high':
        return 'warning';
      case 'medium':
        return 'default';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 select-none animate-fadeIn">
      {columns.map((column) => {
        const columnTasks = tasks.filter((t) => t.status === column.id);
        const isOver = dragOverColumn === column.id;

        return (
          <div
            key={column.id}
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.id)}
            className={`flex flex-col min-h-[500px] max-h-[80vh] rounded-2xl border border-gray-850 p-4 transition-all ${column.color} ${
              isOver ? 'border-indigo-500/50 bg-indigo-500/5 scale-[1.01]' : ''
            }`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-900 border-t-4 pt-1 rounded-t">
              <span className="font-bold text-sm text-gray-200 uppercase tracking-wider">
                {column.title}
              </span>
              <span className="h-5 px-2 rounded bg-gray-950 text-[11px] font-bold text-gray-400 flex items-center justify-center">
                {columnTasks.length}
              </span>
            </div>

            {/* Task list container */}
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 py-1">
              {columnTasks.length === 0 ? (
                <div className="h-24 flex items-center justify-center border border-dashed border-gray-900 rounded-xl text-xs text-gray-500 bg-gray-950/20">
                  Drop tasks here
                </div>
              ) : (
                columnTasks.map((task) => (
                  <div
                    key={task._id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task._id)}
                    onClick={() => onCardClick(task)}
                    className="p-4 rounded-xl border border-gray-850 bg-gray-900/60 hover:bg-gray-900 hover:border-gray-800 transition-all shadow-md cursor-grab active:cursor-grabbing text-left space-y-3 relative group overflow-hidden"
                  >
                    {/* Top priority line decoration */}
                    <div className={`absolute top-0 left-0 right-0 h-1 ${
                      task.priority === 'critical' ? 'bg-rose-500' : task.priority === 'high' ? 'bg-amber-500' : task.priority === 'medium' ? 'bg-indigo-500' : 'bg-gray-500'
                    }`} />

                    <div className="flex items-start justify-between gap-2 pt-1">
                      <h4 className="text-sm font-semibold text-gray-100 group-hover:text-indigo-400 transition-colors line-clamp-2 leading-snug">
                        {task.title}
                      </h4>
                      <Badge variant={getPriorityColor(task.priority)} className="text-[9px] px-1.5 font-bold uppercase shrink-0">
                        {task.priority}
                      </Badge>
                    </div>

                    {task.description && (
                      <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                        {task.description}
                      </p>
                    )}

                    {/* Labels list */}
                    {task.labels && task.labels.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {task.labels.map((l, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-950 border border-gray-850 text-indigo-300"
                          >
                            {l}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between pt-3 border-t border-gray-900/60 text-[10px] text-gray-500 gap-2">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-gray-650" />
                        <span className={new Date(task.deadline) < new Date() && task.status !== 'completed' ? 'text-rose-455 font-bold' : ''}>
                          {formatDate(task.deadline)}
                        </span>
                      </div>

                      {task.estimatedHours > 0 && (
                        <div className="flex items-center gap-1">
                          <Clock size={12} className="text-gray-650" />
                          <span>{task.actualHours || 0}/{task.estimatedHours}h</span>
                        </div>
                      )}

                      {task.assignedTo && (
                        <div className="flex items-center gap-1 bg-gray-950 px-2 py-0.5 rounded-full border border-gray-850">
                          <User size={10} className="text-indigo-400" />
                          <span className="font-semibold text-gray-300 max-w-[60px] truncate">
                            {task.assignedTo.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KanbanBoard;
