import React from 'react';
import { Filter } from 'lucide-react';
import FilterPanel from './FilterPanel';
import PropertyCard from './PropertyCard';
import LoadingOverlay from '../UI/LoadingOverlay';

const Sidebar = ({ 
  imoveis, 
  loading, 
  showFilters, 
  setShowFilters, 
  filters, 
  onFilterChange, 
  onClearFilters,
  activeCardId,
  hoveredImovelId,
  onOpenDetail,
  onHoverCard,
  onInteragir,
  cardsRef,
  onRecalculate,
  onOpenMatchInfo
}) => {
  return (
    <div className="w-full h-full flex flex-col border-r border-slate-800 bg-slate-900 shadow-2xl z-10 overflow-hidden">
      <header className="p-6 border-b border-slate-800 shrink-0 bg-slate-900/80 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black text-indigo-400 tracking-tighter uppercase italic">Bússola de Aluguel</h1>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2.5 rounded-xl transition-all shadow-lg ${showFilters ? 'bg-indigo-600 text-white shadow-indigo-600/20' : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'}`}
          >
            <Filter size={20} />
          </button>
        </div>
        
        <FilterPanel 
          show={showFilters} 
          filters={filters} 
          onFilterChange={onFilterChange} 
          onClearFilters={onClearFilters} 
        />
        
        <div className="mt-4 space-y-2">
          <button
            onClick={onRecalculate}
            className="w-full py-2.5 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg border bg-slate-800 text-indigo-400 border-indigo-500/30 hover:bg-slate-700 hover:border-indigo-500/50 hover:text-indigo-300"
          >
            <span className="text-lg">✨</span>
            Recalcular recomendações
          </button>
          
          <button 
            onClick={onOpenMatchInfo}
            className="w-full py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-400 transition-colors flex items-center justify-center gap-1.5 group"
          >
            <span className="opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all">ℹ️</span>
            Como funciona o Match?
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-2 py-4 space-y-3 custom-scrollbar">
        {imoveis.length > 0 && !imoveis[0].affinity_score && (
          <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-3 mb-2 mx-2">
            <p className="text-indigo-300 text-[10px] font-bold uppercase tracking-wider text-center">
              ⚠️ Dê alguns "Likes" para ver as porcentagens de afinidade!
            </p>
          </div>
        )}

        {loading ? (
          <LoadingOverlay message="Carregando imóveis..." />
        ) : imoveis.length === 0 ? (
          <div className="text-center py-24 flex flex-col items-center gap-4 opacity-50">
             <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center">
               <Filter size={32} className="text-slate-600" />
             </div>
             <p className="text-slate-400 font-medium">Nenhum imóvel atende aos filtros.</p>
          </div>
        ) : (
          imoveis.map(imovel => (
            <PropertyCard 
              key={imovel.id}
              imovel={imovel}
              isActive={activeCardId === imovel.id}
              isHovered={hoveredImovelId === imovel.id}
              onClick={() => onOpenDetail(imovel.id)}
              onMouseEnter={() => onHoverCard(imovel.id)}
              onMouseLeave={() => onHoverCard(null)}
              onInteragir={onInteragir}
              cardRef={el => cardsRef.current[imovel.id] = el}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Sidebar;
