import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import Button from './Button';

const Modal = ({ isOpen, onClose, title, children, className = '' }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Content container */}
      <div className={`relative z-10 w-full max-w-lg transform overflow-hidden rounded-xl border border-gray-800 bg-gray-900 p-6 shadow-2xl transition-all ${className}`}>
        <div className="flex items-center justify-between pb-4 border-b border-gray-800">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button 
            onClick={onClose} 
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="mt-4 max-h-[70vh] overflow-y-auto pr-1">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
