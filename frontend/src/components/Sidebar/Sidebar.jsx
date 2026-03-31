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
  cardsRef
}) => {
  return (
    <div className="w-1/3 h-full flex flex-col border-r border-slate-800 bg-slate-900 shadow-2xl z-10 overflow-hidden">
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
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
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
