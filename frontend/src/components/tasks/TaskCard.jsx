import React, { memo } from 'react';
import Badge from '../common/Badge';
import { Calendar, User, Trash2, Edit2 } from 'lucide-react';
import { formatDate } from '../../utils/formatDate';

const TaskCard = memo(({ task, onEdit, onDelete, canModify }) => {
  const priorityVariants = {
    low:      'secondary',
    medium:   'info',
    high:     'warning',
    critical: 'danger',
  };

  const statusConfig = {
    todo:        { label: 'To Do',       cls: 'bg-slate-100 text-slate-600 ring-slate-200' },
    in_progress: { label: 'In Progress', cls: 'bg-blue-50 text-blue-700 ring-blue-100' },
    review:      { label: 'Review',      cls: 'bg-amber-50 text-amber-700 ring-amber-100' },
    completed:   { label: 'Completed',   cls: 'bg-emerald-50 text-emerald-700 ring-emerald-100' },
  };

  const sc = statusConfig[task.status] || { label: task.status, cls: 'bg-slate-100 text-slate-600' };

  return (
    <div className="card-hover rounded-2xl border border-slate-200 bg-white p-5 flex flex-col justify-between min-h-[180px] text-left shadow-card">
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <Badge variant={priorityVariants[task.priority] || 'default'}>
            {task.priority}
          </Badge>
          <span className={`text-xs px-2 py-0.5 rounded-full ring-1 font-semibold ${sc.cls}`}>
            {sc.label}
          </span>
        </div>
        <h4 className="text-sm font-bold text-slate-900 truncate mb-1">{task.title}</h4>
        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
          {task.description || 'No description provided.'}
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Calendar size={11} />
            {formatDate(task.deadline)}
          </span>
          <span className="flex items-center gap-1 truncate max-w-[90px]">
            <User size={11} />
            {task.assignedTo?.name || 'Unassigned'}
          </span>
        </div>

        {canModify && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onEdit(task)}
              className="p-1.5 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors"
            >
              <Edit2 size={12} />
            </button>
            <button
              onClick={() => onDelete(task._id)}
              className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors"
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

TaskCard.displayName = 'TaskCard';

export default TaskCard;
