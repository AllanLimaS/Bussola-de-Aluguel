import React from 'react';
import { Heart, EyeOff } from 'lucide-react';

const FilterPanel = ({ show, filters, onFilterChange, onClearFilters }) => {
  return (
    <div className={`transition-all duration-300 overflow-hidden ${show ? 'max-h-[600px] mt-4 opacity-100' : 'max-h-0 opacity-0'}`}>
      <div className="grid grid-cols-2 gap-3 p-1">
        <div className="space-y-1">
          <label className="text-xs text-slate-500 font-bold ml-1 uppercase tracking-tighter">Preço Mín.</label>
          <input 
            type="number" name="precoMin" value={filters.precoMin} onChange={onFilterChange}
            placeholder="R$ 0"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors text-slate-200"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-500 font-bold ml-1 uppercase tracking-tighter">Preço Máx.</label>
          <input 
            type="number" name="precoMax" value={filters.precoMax} onChange={onFilterChange}
            placeholder="R$ 10.000+"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors text-slate-200"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-500 font-bold ml-1 uppercase tracking-tighter">Mín. Quartos</label>
          <select 
            name="quartos" value={filters.quartos} onChange={onFilterChange}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors text-slate-200"
          >
            <option value="">Qualquer</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-500 font-bold ml-1 uppercase tracking-tighter">Mín. Banheiros</label>
          <select 
            name="banheiros" value={filters.banheiros} onChange={onFilterChange}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors text-slate-200"
          >
            <option value="">Qualquer</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-500 font-bold ml-1 uppercase tracking-tighter">Mín. Vagas</label>
          <select 
            name="vagas" value={filters.vagas} onChange={onFilterChange}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors text-slate-200"
          >
            <option value="">Qualquer</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-500 font-bold ml-1 uppercase tracking-tighter">Ordenar por</label>
          <select 
            name="ordenacao" value={filters.ordenacao} onChange={onFilterChange}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors text-slate-200"
          >
            <option value="">Padrão</option>
            <option value="menor_preco">Menor Preço</option>
            <option value="maior_preco">Maior Preço</option>
          </select>
        </div>
        <div className="col-span-2 space-y-1 mt-1">
          <label className="text-xs text-slate-500 font-bold ml-1 uppercase tracking-tighter">Bairro / Endereço</label>
          <input 
            type="text" name="bairro" value={filters.bairro} onChange={onFilterChange}
            placeholder="Ex: Centro, Itajaí..."
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors text-slate-200"
          />
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
        <label className="flex items-center gap-3 cursor-pointer group">
          <input 
            type="checkbox" name="mostrarApenasFavoritos" 
            checked={filters.mostrarApenasFavoritos} onChange={onFilterChange}
            className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-indigo-500"
          />
          <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">Ver apenas favoritos</span>
          <Heart size={14} className={filters.mostrarApenasFavoritos ? 'text-pink-500' : 'text-slate-600'} fill={filters.mostrarApenasFavoritos ? 'currentColor' : 'none'} />
        </label>
        
        <label className="flex items-center gap-3 cursor-pointer group">
          <input 
            type="checkbox" name="ocultarDescartados" 
            checked={filters.ocultarDescartados} onChange={onFilterChange}
            className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-indigo-500"
          />
          <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">Ocultar descartados</span>
          <EyeOff size={14} className={filters.ocultarDescartados ? 'text-indigo-400' : 'text-slate-600'} />
        </label>
      </div>

      <button 
        onClick={onClearFilters}
        className="w-full mt-4 text-xs text-indigo-400 hover:text-indigo-300 text-center py-2 font-black bg-indigo-500/5 rounded-xl hover:bg-indigo-500/10 transition-all uppercase tracking-widest border border-indigo-500/10"
      >
        Limpar Todos os Filtros
      </button>
    </div>
  );
};

export default FilterPanel;
