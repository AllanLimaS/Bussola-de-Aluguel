import React from 'react';
import { X, Info, Target, Car, Home, MapPin } from 'lucide-react';

const MatchInfoModal = ({ isOpen, onClose, profile }) => {
  if (!isOpen) return null;

  const hasProfile = !!profile;

  const metrics = [
    { 
      label: 'Preço Total', 
      weight: '50%', 
      icon: <Target className="text-emerald-400" size={14} />,
      perfil: (hasProfile && profile.preco_medio) ? `R$ ${Math.round(profile.preco_medio).toLocaleString()}` : '—',
      desc: 'Aluguel + Condomínio' 
    },
    { 
      label: 'Garagem', 
      weight: '20%', 
      icon: <Car className="text-indigo-400" size={14} />,
      perfil: (hasProfile && profile.vagas_desejadas !== undefined) ? `${profile.vagas_desejadas}+ vagas` : '—',
      desc: 'Mínimo aproximado' 
    },
    { 
      label: 'Quartos', 
      weight: '10%', 
      icon: <Home className="text-amber-400" size={14} />,
      perfil: (hasProfile && profile.quartos_medios) ? `${Math.round(profile.quartos_medios)}+ qtos` : '—',
      desc: 'Média de interesse' 
    },
    { 
      label: 'Metragem', 
      weight: '5%', 
      icon: <Target className="text-blue-400" size={14} />,
      perfil: (hasProfile && profile.metragem_media) ? `${Math.round(profile.metragem_media)}m²` : '—',
      desc: 'Área útil' 
    },
    { 
      label: 'Localização', 
      weight: '15%', 
      icon: <MapPin className="text-rose-400" size={14} />,
      perfil: (hasProfile && profile.liked_points) ? `${profile.liked_points.length} regiões curtidas` : '—',
      desc: 'Proximidade aos seus Likes' 
    }
  ];

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
              <Info size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-100 uppercase tracking-tighter leading-none">Como funciona o Match?</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Transparência Algorítmica</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </header>

        <div className="p-6">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="pb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Característica</th>
                <th className="pb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Peso</th>
                <th className="pb-4 text-[10px] font-black text-slate-300 uppercase tracking-widest text-right">Seu Perfil</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {metrics.map((m, idx) => (
                <tr key={idx} className="group hover:bg-slate-800/30 transition-colors">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-slate-800 rounded-lg group-hover:bg-slate-700 transition-colors">
                        {m.icon}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-200">{m.label}</div>
                        <div className="text-[10px] text-slate-500">{m.desc}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 text-center">
                    <span className="bg-indigo-500/10 text-indigo-400 text-[10px] font-black px-2.5 py-1 rounded-full border border-indigo-500/20">
                      {m.weight}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    <div className="text-sm font-black text-slate-100">{m.perfil}</div>
                    {idx === 0 && hasProfile && (
                      <div className="text-[9px] text-slate-500 font-medium italic">Baseado em likes</div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!hasProfile && (
            <div className="mt-6 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center gap-4 animate-pulse">
              <Info className="text-indigo-400 shrink-0" size={20} />
              <p className="text-[11px] text-indigo-300 font-medium leading-tight">
                <strong>Perfil ainda não calculado.</strong> Dê alguns "Likes" nos imóveis que você gosta para que a IA aprenda seu gosto!
              </p>
            </div>
          )}
        </div>

        <footer className="p-6 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
          <div className="text-[10px] text-slate-500 font-bold italic flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-pink-500" />
             Personalizado para você
          </div>
          <button 
            onClick={onClose}
            className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/20 text-xs"
          >
            Entendido!
          </button>
        </footer>
      </div>
    </div>
  );
};

export default MatchInfoModal;
