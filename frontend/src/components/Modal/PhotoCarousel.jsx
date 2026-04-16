import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const PhotoCarousel = ({ 
  fotos = [], 
  currentIndex = 0, 
  onPrev, 
  onNext,
  apiUrl = "" 
}) => {
  if (!fotos || fotos.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-slate-500 italic bg-slate-800 rounded-3xl border border-slate-700">
        Sem fotos disponíveis
      </div>
    );
  }

  return (
    <div className="relative rounded-3xl overflow-hidden aspect-video bg-slate-800 shadow-2xl group border border-slate-700">
      <img 
        src={`${apiUrl}${fotos[currentIndex]}`} 
        alt={`Foto ${currentIndex + 1}`} 
        className="w-full h-full object-cover transition-opacity duration-300"
      />
      
      {/* Controles do Carrossel */}
      {fotos.length > 1 && (
        <>
          <button 
            onClick={onPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/80 text-white p-3 rounded-full backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
          >
            <ChevronLeft size={24} />
          </button>
          <button 
            onClick={onNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/80 text-white p-3 rounded-full backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}
      
      <div className="absolute bottom-6 right-6 bg-black/60 px-4 py-2 rounded-full text-xs font-bold backdrop-blur-xl border border-white/10 text-white shadow-lg">
        {currentIndex + 1} / {fotos.length}
      </div>
    </div>
  );
};

export default PhotoCarousel;
