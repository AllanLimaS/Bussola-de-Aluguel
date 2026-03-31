import React from 'react';
import { X, MapPin, TrendingUp, Heart, EyeOff } from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import PhotoCarousel from './PhotoCarousel';
import AttributeGrid from './AttributeGrid';
import PriceHistoryChart from './PriceHistoryChart';

const PropertyDetailModal = ({ 
  imovel, 
  currentPhotoIndex, 
  onClose, 
  onPrevPhoto, 
  onNextPhoto,
  onInteragir
}) => {
  if (!imovel) return null;

  const ultimoHistorico = imovel.historico_precos?.[imovel.historico_precos.length - 1] || {};
  const valorTotal = (ultimoHistorico.aluguel || 0) + (ultimoHistorico.condominio || 0);

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-5xl h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
        <header className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <h2 className="text-xl font-bold px-4 text-slate-100">{imovel.titulo}</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10 max-w-4xl mx-auto w-full text-left">
          {/* Carrossel de Fotos */}
          <PhotoCarousel 
            fotos={imovel.fotos} 
            currentIndex={currentPhotoIndex} 
            onPrev={onPrevPhoto} 
            onNext={onNextPhoto} 
          />

          {/* Informações Básicas e Preço */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-6 text-left">
              <div className="flex items-center text-slate-200 gap-3">
                <MapPin size={24} className="text-indigo-400 shrink-0" />
                <span className="text-xl font-medium tracking-tight">{imovel.endereco}</span>
              </div>
              
              <AttributeGrid imovel={imovel} />

              <p className="text-slate-400 leading-relaxed text-base bg-slate-800/30 p-6 rounded-2xl border border-slate-800/50 italic text-left">
                "{imovel.descricao || 'Este imóvel não possui uma descrição detalhada cadastrada no momento.'}"
              </p>
            </div>

            {/* Card de Preço e Interações */}
            <div className="self-start space-y-4">
              {/* Botões de Interação */}
              {/* Botões de Interação e Match */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex gap-2">
                  <button 
                    onClick={(e) => onInteragir(e, imovel.id, imovel.interacao === 'like' ? 'neutral' : 'like')}
                    className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all border shadow-md active:scale-95 ${
                      imovel.interacao === 'like' 
                        ? 'bg-pink-500 border-pink-400 text-white shadow-pink-500/20' 
                        : 'bg-slate-800/50 backdrop-blur-sm border-slate-700 text-slate-300 hover:border-pink-500/50 hover:text-pink-400'
                    }`}
                    title={imovel.interacao === 'like' ? 'Remover Favorito' : 'Favoritar'}
                  >
                    <Heart size={20} fill={imovel.interacao === 'like' ? 'currentColor' : 'none'} />
                  </button>
                  
                  <button 
                    onClick={(e) => onInteragir(e, imovel.id, imovel.interacao === 'dislike' ? 'neutral' : 'dislike')}
                    className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all border shadow-md active:scale-95 ${
                      imovel.interacao === 'dislike' 
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-indigo-600/20' 
                        : 'bg-slate-800/50 backdrop-blur-sm border-slate-700 text-slate-300 hover:border-indigo-500/50 hover:text-indigo-400'
                    }`}
                    title={imovel.interacao === 'dislike' ? 'Remover Descarte' : 'Descartar'}
                  >
                    <EyeOff size={20} />
                  </button>
                </div>

                {/* Match Badge */}
                {imovel.affinity_score && (
                  <div className="shrink-0 bg-indigo-600/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-indigo-400/50 shadow-lg shadow-indigo-600/20 flex flex-col items-center justify-center min-w-[65px]">
                    <span className="text-[7px] font-black uppercase tracking-tighter text-indigo-100 leading-none mb-0.5 opacity-80">Match</span>
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-white font-black text-base leading-none">{Math.round(imovel.affinity_score)}</span>
                      <span className="text-indigo-200 font-bold text-[9px]">%</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-gradient-to-br from-indigo-500/10 to-slate-800/30 border border-indigo-500/30 p-6 rounded-3xl space-y-4 shadow-xl">
              <div>
                <div className="text-[10px] text-indigo-300 font-bold mb-1 uppercase tracking-widest opacity-80">Custo Total Mensal</div>
                <div className="text-3xl font-black text-white">
                  R$ {valorTotal.toLocaleString()}
                </div>
              </div>
              
              <div className="space-y-2 pt-3 border-t border-indigo-500/10">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Aluguel:</span>
                  <span className="text-slate-100 font-bold">R$ {(ultimoHistorico.aluguel || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Condomínio:</span>
                  <span className="text-slate-100 font-bold">R$ {(ultimoHistorico.condominio || 0).toLocaleString()}</span>
                </div>
              </div>

              <a 
                href={imovel.link} 
                target="_blank" 
                rel="noreferrer"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transform hover:-translate-y-1 text-sm"
              >
                Abrir no Site Original
              </a>
              </div>
            </div>
          </div>

          {/* Mini Mapa de Localização */}
          <div className="bg-slate-800/50 rounded-3xl overflow-hidden h-64 border border-slate-800 shadow-2xl relative w-full">
            <div className="absolute top-4 left-4 z-[1000] bg-slate-900/80 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold text-indigo-300 border border-indigo-500/20 uppercase tracking-widest">
              Localização Exata
            </div>
            <MapContainer 
              center={[imovel.latitude, imovel.longitude]} 
              zoom={15} 
              style={{ height: '100%', width: '100%' }}
              dragging={true}
              zoomControl={true}
              scrollWheelZoom={false}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={[imovel.latitude, imovel.longitude]} />
            </MapContainer>
          </div>

          {/* Histórico de Preços */}
          <PriceHistoryChart data={imovel.historico_precos} />
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailModal;
