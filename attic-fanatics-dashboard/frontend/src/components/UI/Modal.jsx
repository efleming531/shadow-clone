import React, { useEffect } from 'react';

export default function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-bold text-white text-base">{title}</h3>
          <button onClick={onClose} className="text-text-secondary hover:text-white transition-colors text-lg leading-none">✕</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
