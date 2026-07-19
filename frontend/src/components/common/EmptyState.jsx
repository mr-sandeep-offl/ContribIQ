import React from 'react';
import { FolderOpen } from 'lucide-react';
import Button from './Button';

const EmptyState = ({ title, description, actionText, onAction, icon: Icon = FolderOpen }) => {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center animate-fadeInUp">
      <div className="rounded-2xl bg-blue-50 ring-1 ring-blue-100 p-5 text-blue-500 mb-5">
        <Icon size={28} />
      </div>
      <h3 className="text-base font-bold text-slate-900 mb-1.5">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm leading-relaxed mb-6">{description}</p>
      {actionText && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
