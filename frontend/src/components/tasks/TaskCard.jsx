import React from 'react';
import Badge from '../common/Badge';
import { Calendar, User, Trash2, Edit2 } from 'lucide-react';
import { formatDate } from '../../utils/formatDate';

const TaskCard = ({ task, onEdit, onDelete, canModify, onDetailsClick }) => {
  const priorityVariants = {
    low: 'secondary',
    medium: 'info',
    high: 'warning',
    critical: 'danger',
  };

  const statusColors = {
    todo: 'text-gray-400 bg-gray-800 border-gray-700',
    in_progress: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/25',
    review: 'text-amber-400 bg-amber-500/10 border-amber-500/25',
    completed: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
  };

  return (
    <div 
      onClick={onDetailsClick}
      className={`rounded-xl border border-gray-800 bg-gray-900/60 p-5 flex flex-col justify-between h-48 text-left ${onDetailsClick ? 'cursor-pointer hover:border-gray-700 hover:shadow-md transition-all' : ''}`}
    >
      <div>
        <div className="flex items-center justify-between gap-2">
          <Badge variant={priorityVariants[task.priority] || 'default'}>
            {task.priority}
          </Badge>
          <span className={`text-xs px-2 py-0.5 rounded-md border font-semibold capitalize ${statusColors[task.status] || 'text-gray-400 border-gray-800'}`}>
            {task.status?.replace('_', ' ')}
          </span>
        </div>
        <h4 className="mt-3 text-sm font-semibold text-white truncate">{task.title}</h4>
        <p className="mt-1 text-xs text-gray-400 line-clamp-2 leading-relaxed">
          {task.description || 'No description provided.'}
        </p>
      </div>

      <div className="mt-4 border-t border-gray-800 pt-3 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <Calendar size={13} className="text-gray-600" />
          <span>{formatDate(task.deadline)}</span>
        </div>
        <div className="flex items-center gap-1.5 max-w-[40%] truncate">
          <User size={13} className="text-gray-600" />
          <span className="truncate">{task.assignedTo?.name || 'Unassigned'}</span>
        </div>
        
        {canModify && (
          <div className="flex items-center gap-2">
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit(task); }} 
              className="text-gray-400 hover:text-indigo-400 p-1 rounded transition-colors"
            >
              <Edit2 size={13} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(task._id); }} 
              className="text-gray-400 hover:text-rose-500 p-1 rounded transition-colors"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
