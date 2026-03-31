import React from 'react';
import { Heart, EyeOff, Home, MapPin, Bed, Bath, Car, Maximize2 } from 'lucide-react';

const PropertyCard = ({ 
  imovel, 
  isActive, 
  isHovered, 
  onClick, 
  onMouseEnter, 
  onMouseLeave, 
  onInteragir,
  cardRef 
}) => {
  const precoTotal = (imovel.preco_aluguel || 0) + (imovel.preco_condominio || 0);

  return (
    <div 
      ref={cardRef}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`rounded-xl border transition-all cursor-pointer shadow-sm relative group flex overflow-hidden ${
        isActive 
          ? 'border-indigo-500 bg-indigo-500/10 ring-2 ring-indigo-500/20' 
          : isHovered 
            ? 'border-indigo-400 bg-slate-800' 
            : 'border-slate-800 hover:border-slate-700 bg-slate-800/50'
      } ${imovel.interacao === 'like' ? 'border-pink-500 bg-pink-500/10 shadow-[0_0_20px_rgba(236,72,153,0.1)]' : ''}`}
    >
      {/* Extensão Lateral Esquerda - Interação */}
      <div className={`w-[45px] shrink-0 flex flex-col items-center justify-center border-r border-slate-700/50 transition-colors gap-4 py-2 ${
        imovel.interacao === 'like' ? 'bg-pink-500/20' : 'bg-slate-800/40'
      }`}>
        <button 
          onClick={(e) => onInteragir(e, imovel.id, imovel.interacao === 'like' ? 'neutral' : 'like')}
          className={`p-2 rounded-full transition-all ${imovel.interacao === 'like' ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/30' : 'text-slate-400 hover:bg-pink-500/20 hover:text-pink-400'}`}
          title="Favoritar"
        >
          <Heart size={18} fill={imovel.interacao === 'like' ? 'currentColor' : 'none'} />
        </button>
        <button 
          onClick={(e) => onInteragir(e, imovel.id, imovel.interacao === 'dislike' ? 'neutral' : 'dislike')}
          className={`p-2 rounded-full transition-all ${imovel.interacao === 'dislike' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:bg-indigo-500/20 hover:text-indigo-400'}`}
          title="Descartar"
        >
          <EyeOff size={18} />
        </button>
      </div>

      {/* Conteúdo Principal */}
      <div className="flex-1 flex gap-4 items-center p-3 min-w-0">
        {isActive && (
          <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-10 bg-indigo-500 rounded-full shadow-[0_0_10px_#6366f1]" />
        )}

        {/* Thumbnail */}
        <div className="w-24 h-24 shrink-0 rounded-lg overflow-hidden bg-slate-800 border border-slate-700 relative shadow-inner">
          {imovel.foto_principal ? (
            <img 
              src={`http://localhost:8000${imovel.foto_principal}`} 
              alt="Thumbnail" 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 bg-slate-800/80">
              <Home size={20} className="mb-1" />
            </div>
          )}
          {imovel.quantidade_fotos > 0 && (
             <div className="absolute bottom-1 right-1 bg-black/70 px-1.5 py-0.5 rounded text-[10px] font-bold text-white border border-white/10">
               {imovel.quantidade_fotos}
             </div>
          )}
        </div>

        {/* Detalhes do Imóvel */}
        <div className="flex-1 min-w-0 py-1">
          <h3 className={`font-semibold text-base leading-tight truncate transition-colors ${
            isActive || isHovered ? 'text-indigo-300' : 'text-slate-100 group-hover:text-indigo-300'
          }`}>{imovel.titulo}</h3>
          <div className="flex items-center text-slate-400 text-xs mt-1 gap-1 truncate">
            <MapPin size={12} className="shrink-0" />
            <span className="truncate">{imovel.endereco}</span>
          </div>
          
          <div className="mt-3 flex items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-400">
              <div className="flex items-center gap-1 group-hover:text-slate-200 transition-colors">
                <Bed size={12} className="text-slate-500" />
                <span>{imovel.quartos}</span>
              </div>
              <div className="flex items-center gap-1 group-hover:text-slate-200 transition-colors">
                <Bath size={12} className="text-slate-500" />
                <span>{imovel.banheiros}</span>
              </div>
              <div className="flex items-center gap-1 group-hover:text-slate-200 transition-colors">
                <Car size={12} className="text-slate-500" />
                <span>{imovel.vagas}</span>
              </div>
              {imovel.metragem && (
                <div className="flex items-center gap-1 group-hover:text-slate-200 transition-colors">
                  <Maximize2 size={12} className="text-slate-500" />
                  <span>{imovel.metragem}m²</span>
                </div>
              )}
            </div>
            <div className="text-right shrink-0">
              <span className="text-indigo-400 font-bold text-base block leading-none">R$ {precoTotal.toLocaleString()}</span>
              <span className="text-slate-500 text-[8px] uppercase font-semibold tracking-tighter">Total</span>
            </div>
          </div>
        </div>
      </div>

      {/* Affinity Score - Extensão Lateral "Aba" */}
      {imovel.affinity_score !== undefined && imovel.affinity_score !== null && (
        <div className="w-[50px] shrink-0 bg-indigo-600/40 flex flex-col items-center justify-center border-l border-indigo-500/20 backdrop-blur-md group-hover:bg-indigo-600/60 transition-all duration-300 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-indigo-400/50" />
          
          <span className="text-indigo-200 font-bold text-[8px] leading-none mb-2 tracking-tighter uppercase opacity-60 [writing-mode:vertical-lr] rotate-180">Match</span>
          <div className="flex flex-col items-center">
            <span className="text-white font-black text-lg leading-none tracking-tighter">{Math.round(imovel.affinity_score)}</span>
            <span className="text-indigo-300 font-bold text-[9px] mt-0.5">%</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyCard;
