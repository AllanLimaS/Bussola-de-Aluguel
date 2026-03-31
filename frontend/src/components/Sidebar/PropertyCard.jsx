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
      className={`p-3 rounded-xl border transition-all cursor-pointer shadow-sm relative group flex gap-4 items-center ${
        isActive 
          ? 'border-indigo-500 bg-indigo-500/10 ring-2 ring-indigo-500/20' 
          : isHovered 
            ? 'border-indigo-400 bg-slate-800' 
            : 'border-slate-800 hover:border-slate-700 bg-slate-800/50'
      } ${imovel.interacao === 'like' ? 'border-pink-500 bg-pink-500/10 shadow-[0_0_20px_rgba(236,72,153,0.1)]' : ''}`}
    >
      {/* Botões de Interação Rápida */}
      <div className={`absolute top-2 right-2 flex gap-1 z-20 transition-all ${imovel.interacao === 'like' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
        <button 
          onClick={(e) => onInteragir(e, imovel.id, imovel.interacao === 'like' ? 'neutral' : 'like')}
          className={`p-1.5 rounded-full transition-all ${imovel.interacao === 'like' ? 'bg-pink-500 text-white' : 'bg-slate-700/80 text-slate-300 hover:bg-pink-500 hover:text-white'}`}
          title="Favoritar"
        >
          <Heart size={14} fill={imovel.interacao === 'like' ? 'currentColor' : 'none'} />
        </button>
        <button 
          onClick={(e) => onInteragir(e, imovel.id, imovel.interacao === 'dislike' ? 'neutral' : 'dislike')}
          className={`p-1.5 rounded-full transition-all ${imovel.interacao === 'dislike' ? 'bg-indigo-600 text-white' : 'bg-slate-700/80 text-slate-300 hover:bg-indigo-600 hover:text-white'}`}
          title="Descartar"
        >
          <EyeOff size={14} />
        </button>
      </div>

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
        
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-1 group-hover:text-slate-200 transition-colors">
              <Bed size={14} className="text-slate-500" />
              <span>{imovel.quartos}</span>
            </div>
            <div className="flex items-center gap-1 group-hover:text-slate-200 transition-colors">
              <Bath size={14} className="text-slate-500" />
              <span>{imovel.banheiros}</span>
            </div>
            <div className="flex items-center gap-1 group-hover:text-slate-200 transition-colors">
              <Car size={14} className="text-slate-500" />
              <span>{imovel.vagas}</span>
            </div>
            {imovel.metragem && (
              <div className="flex items-center gap-1 group-hover:text-slate-200 transition-colors">
                <Maximize2 size={14} className="text-slate-500" />
                <span>{imovel.metragem}m²</span>
              </div>
            )}
          </div>
          <div className="text-right">
            <span className="text-indigo-400 font-bold text-lg block leading-none">R$ {precoTotal.toLocaleString()}</span>
            <span className="text-slate-500 text-[9px] uppercase font-semibold tracking-tighter">Total / mês</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;
