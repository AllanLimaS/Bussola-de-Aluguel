import React from 'react';

/**
 * Componente de overlay de carregamento reutilizável.
 * Pode ser um overlay de tela cheia ou apenas um indicador central.
 */
const LoadingOverlay = ({ message = "Carregando...", fullScreen = false }) => {
  const containerClasses = fullScreen 
    ? "fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[10001] flex items-center justify-center transition-all animate-in fade-in duration-300"
    : "flex flex-col items-center justify-center p-10 py-20 text-slate-400";

  const cardClasses = fullScreen
    ? "bg-slate-900 p-6 rounded-3xl shadow-2xl border border-slate-800 flex items-center gap-4 animate-in zoom-in-95 duration-200"
    : "flex items-center gap-3";

  return (
    <div className={containerClasses}>
      <div className={cardClasses}>
        <div className="w-6 h-6 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin shadow-[0_0_10px_rgba(99,102,241,0.2)]"></div>
        <span className="font-bold text-sm tracking-tight">{message}</span>
      </div>
    </div>
  );
};

export default LoadingOverlay;
