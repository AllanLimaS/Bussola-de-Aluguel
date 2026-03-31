import React from 'react';
import { X, Bell, TrendingDown, Home, Check } from 'lucide-react';

const NovidadesPanel = ({ novidades, isOpen, onClose, onMarcarVisto, onLimparTudo, onVerImovel }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 bg-slate-900 border-r border-slate-800 flex flex-col z-50">
      <header className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Bell className="text-indigo-400" size={20} />
          <h2 className="text-lg font-bold text-slate-100 uppercase tracking-wider">Novidades</h2>
          {novidades.length > 0 && (
            <span className="bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold min-w-[18px] text-center">
              {novidades.length}
            </span>
          )}
        </div>
        <button 
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors"
        >
          <X size={20} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {novidades.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-20">
            <Bell size={48} className="mb-4" />
            <p className="text-sm font-medium">Tudo em dia!</p>
            <p className="text-xs">Nenhuma novidade por enquanto.</p>
          </div>
        ) : (
          <>
            <div className="flex justify-end mb-2">
              <button 
                onClick={onLimparTudo}
                className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-indigo-400 transition-colors flex items-center gap-1"
              >
                <Check size={12} />
                Limpar tudo
              </button>
            </div>
            {novidades.map((n) => (
              <div 
                key={n.id}
                className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 hover:border-slate-600 transition-all cursor-pointer group relative overflow-hidden"
                onClick={() => onVerImovel(n.imovel_id)}
              >
                {/* Indicador lateral */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${n.tipo === 'novo' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                
                <div className="flex gap-3">
                  {n.foto ? (
                    <img 
                      src={`http://localhost:8000${n.foto}`} 
                      alt="" 
                      className="w-16 h-16 rounded-lg object-cover bg-slate-900 border border-slate-700"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center">
                       <Home size={24} className="text-slate-700" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      {n.tipo === 'novo' ? (
                        <Home size={12} className="text-emerald-500" />
                      ) : (
                        <TrendingDown size={12} className="text-amber-500" />
                      )}
                      <span className={`text-[10px] font-black uppercase tracking-tighter ${n.tipo === 'novo' ? 'text-emerald-500' : 'text-amber-500'}`}>
                        {n.tipo === 'novo' ? 'Imóvel Novo' : 'Preço Baixou'}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-100 truncate mb-1">{n.titulo}</h3>
                    <div className="flex items-baseline gap-2">
                      <span className="text-indigo-400 font-bold text-sm">
                        R$ {n.preco_novo?.toLocaleString('pt-BR')}
                      </span>
                      {n.preco_antigo && (
                        <span className="text-slate-500 text-xs line-through">
                          R$ {n.preco_antigo?.toLocaleString('pt-BR')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex justify-end">
                   <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarcarVisto(n.id);
                    }}
                    className="p-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-400 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                    title="Visto"
                   >
                     <Check size={14} />
                   </button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default NovidadesPanel;
