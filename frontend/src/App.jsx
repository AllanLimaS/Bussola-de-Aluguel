import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { ChevronDown, ChevronUp, Filter, Home, MapPin, DollarSign, Bed, Bath, Car, X, Calendar, TrendingUp, Search, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Corrigir ícones do Leaflet
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Ícone Padrão
const defaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});

// Ícone de Destaque (um pouco maior)
const highlightIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [35, 51], 
    iconAnchor: [17, 51],
    popupAnchor: [1, -34],
    className: 'marker-highlight'
});

function App() {
  const [imoveis, setImoveis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedImovel, setSelectedImovel] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [hoveredImovelId, setHoveredImovelId] = useState(null);
  const [activeCardId, setActiveCardId] = useState(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  
  const cardsRef = useRef({});

  // Estado dos Filtros
  const [filters, setFilters] = useState({
    precoMin: '',
    precoMax: '',
    quartos: '',
    banheiros: '',
    vagas: '',
    bairro: '',
    ordenacao: ''
  });

  useEffect(() => {
    axios.get('http://localhost:8000/imoveis')
      .then(response => {
        setImoveis(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Erro ao carregar imóveis:", error);
        setLoading(false);
      });
  }, []);

  // Lógica de Filtragem e Ordenação
  const filteredImoveis = useMemo(() => {
    let result = imoveis.filter(imovel => {
      const precoTotal = (imovel.preco_aluguel || 0) + (imovel.preco_condominio || 0);
      
      const matchPrecoMin = !filters.precoMin || precoTotal >= parseFloat(filters.precoMin);
      const matchPrecoMax = !filters.precoMax || precoTotal <= parseFloat(filters.precoMax);
      const matchQuartos = !filters.quartos || imovel.quartos >= parseInt(filters.quartos);
      const matchBanheiros = !filters.banheiros || imovel.banheiros >= parseInt(filters.banheiros);
      const matchVagas = !filters.vagas || imovel.vagas >= parseInt(filters.vagas);
      const matchBairro = !filters.bairro || imovel.endereco.toLowerCase().includes(filters.bairro.toLowerCase());

      return matchPrecoMin && matchPrecoMax && matchQuartos && matchBanheiros && matchVagas && matchBairro;
    });

    if (filters.ordenacao === 'menor_preco') {
      result.sort((a, b) => ((a.preco_aluguel || 0) + (a.preco_condominio || 0)) - ((b.preco_aluguel || 0) + (b.preco_condominio || 0)));
    } else if (filters.ordenacao === 'maior_preco') {
      result.sort((a, b) => ((b.preco_aluguel || 0) + (b.preco_condominio || 0)) - ((a.preco_aluguel || 0) + (a.preco_condominio || 0)));
    }

    return result;
  }, [imoveis, filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleOpenDetail = (id) => {
    setDetailLoading(true);
    setCurrentPhotoIndex(0);
    axios.get(`http://localhost:8000/imoveis/${id}`)
      .then(response => {
        setSelectedImovel(response.data);
        setDetailLoading(false);
      })
      .catch(error => {
        console.error("Erro ao carregar detalhes:", error);
        setDetailLoading(false);
      });
  };

  const scrollToCard = (id) => {
    setActiveCardId(id);
    if (cardsRef.current[id]) {
      cardsRef.current[id].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handlePrevPhoto = (e) => {
    e.stopPropagation();
    setCurrentPhotoIndex(prev => (prev === 0 ? selectedImovel.fotos.length - 1 : prev - 1));
  };

  const handleNextPhoto = (e) => {
    e.stopPropagation();
    setCurrentPhotoIndex(prev => (prev === selectedImovel.fotos.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="flex h-screen w-full bg-slate-950 font-sans text-slate-100 uppercase-none overflow-hidden relative">
      {/* Sidebar - Lista de Imóveis */}
      <div className="w-1/3 h-full flex flex-col border-r border-slate-800 bg-slate-900 shadow-2xl z-10">
        <header className="p-6 border-b border-slate-800 shrink-0">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-indigo-400">Bússola de Aluguel</h1>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-colors ${showFilters ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
            >
              <Filter size={20} />
            </button>
          </div>
          
          {/* Aba de Filtros Colapsável */}
          <div className={`transition-all duration-300 overflow-hidden ${showFilters ? 'max-h-[500px] mt-4 opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="grid grid-cols-2 gap-3 p-1">
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-medium ml-1">Preço Mín.</label>
                <input 
                  type="number" name="precoMin" value={filters.precoMin} onChange={handleFilterChange}
                  placeholder="R$ 0"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-medium ml-1">Preço Máx.</label>
                <input 
                  type="number" name="precoMax" value={filters.precoMax} onChange={handleFilterChange}
                  placeholder="R$ 10.000+"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-medium ml-1">Mín. Quartos</label>
                <select 
                  name="quartos" value={filters.quartos} onChange={handleFilterChange}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="">Qualquer</option>
                  <option value="1">1+</option>
                  <option value="2">2+</option>
                  <option value="3">3+</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-medium ml-1">Mín. Banheiros</label>
                <select 
                  name="banheiros" value={filters.banheiros} onChange={handleFilterChange}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="">Qualquer</option>
                  <option value="1">1+</option>
                  <option value="2">2+</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-medium ml-1">Mín. Vagas</label>
                <select 
                  name="vagas" value={filters.vagas} onChange={handleFilterChange}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="">Qualquer</option>
                  <option value="1">1+</option>
                  <option value="2">2+</option>
                </select>
              </div>
              <div className="space-y-1 pt-1">
                <label className="text-xs text-slate-500 font-medium ml-1">Ordenar por</label>
                <select 
                  name="ordenacao" value={filters.ordenacao} onChange={handleFilterChange}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="">Padrão</option>
                  <option value="menor_preco">Menor Preço</option>
                  <option value="maior_preco">Maior Preço</option>
                </select>
              </div>
              <div className="space-y-1 pt-1">
                <label className="text-xs text-slate-500 font-medium ml-1">Bairro / Endereço</label>
                <input 
                  type="text" name="bairro" value={filters.bairro} onChange={handleFilterChange}
                  placeholder="Ex: Centro, Itajaí..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>
            <button 
              onClick={() => setFilters({ precoMin: '', precoMax: '', quartos: '', banheiros: '', vagas: '', bairro: '', ordenacao: '' })}
              className="w-full mt-3 text-xs text-indigo-400 hover:text-indigo-300 text-center py-1 font-medium"
            >
              Limpar Filtros
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <p className="text-center py-10 text-slate-400">Carregando imóveis...</p>
          ) : filteredImoveis.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-slate-400">Nenhum imóvel atende aos filtros.</p>
            </div>
          ) : (
            filteredImoveis.map(imovel => (
              <div 
                key={imovel.id} 
                ref={el => cardsRef.current[imovel.id] = el}
                onClick={() => handleOpenDetail(imovel.id)}
                onMouseEnter={() => setHoveredImovelId(imovel.id)}
                onMouseLeave={() => setHoveredImovelId(null)}
                className={`p-3 rounded-xl border transition-all cursor-pointer shadow-sm relative group flex gap-4 items-center ${
                  activeCardId === imovel.id 
                    ? 'border-indigo-500 bg-indigo-500/10 ring-2 ring-indigo-500/20' 
                    : hoveredImovelId === imovel.id 
                      ? 'border-indigo-400 bg-slate-800' 
                      : 'border-slate-800 hover:border-slate-700 bg-slate-800/50'
                }`}
              >
                {activeCardId === imovel.id && (
                  <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-10 bg-indigo-500 rounded-full shadow-[0_0_10px_#6366f1]" />
                )}

                {/* Thumbnail da Foto Principal */}
                <div className="w-24 h-24 shrink-0 rounded-lg overflow-hidden bg-slate-800 border border-slate-700 relative">
                  {imovel.foto_principal ? (
                    <img 
                      src={imovel.foto_principal.startsWith('data:image') ? imovel.foto_principal : `data:image/png;base64,${imovel.foto_principal}`} 
                      alt="Thumbnail" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 bg-slate-800/80">
                      <Home size={20} className="mb-1" />
                    </div>
                  )}
                  {imovel.quantidade_fotos > 0 && (
                     <div className="absolute bottom-1 right-1 bg-black/70 px-1.5 py-0.5 rounded text-[10px] font-bold">
                       {imovel.quantidade_fotos}
                     </div>
                  )}
                </div>

                {/* Detalhes do Imóvel */}
                <div className="flex-1 min-w-0 py-1">
                  <h3 className={`font-semibold text-base leading-tight truncate transition-colors ${
                    activeCardId === imovel.id || hoveredImovelId === imovel.id ? 'text-indigo-300' : 'text-slate-100 group-hover:text-indigo-300'
                  }`}>{imovel.titulo}</h3>
                  <div className="flex items-center text-slate-400 text-xs mt-1 gap-1 truncate">
                    <MapPin size={12} className="shrink-0" />
                    <span className="truncate">{imovel.endereco}</span>
                  </div>
                  
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <div className="flex items-center gap-1">
                        <Bed size={14} className="text-slate-500" />
                        <span>{imovel.quartos}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Bath size={14} className="text-slate-500" />
                        <span>{imovel.banheiros}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Car size={14} className="text-slate-500" />
                        <span>{imovel.vagas}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-indigo-400 font-bold text-lg block leading-none">R$ {((imovel.preco_aluguel || 0) + (imovel.preco_condominio || 0)).toLocaleString()}</span>
                      <span className="text-slate-500 text-[9px] uppercase font-semibold">Total / mês</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Mapa Principal */}
      <div className="flex-1 h-full relative">
        <MapContainer center={[-26.9078, -48.6619]} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {filteredImoveis.map(imovel => (
            imovel.latitude && imovel.longitude && (
              <Marker 
                key={imovel.id} 
                position={[imovel.latitude, imovel.longitude]}
                icon={hoveredImovelId === imovel.id || activeCardId === imovel.id ? highlightIcon : defaultIcon}
                eventHandlers={{ 
                  click: () => scrollToCard(imovel.id),
                  mouseover: () => setHoveredImovelId(imovel.id),
                  mouseout: () => setHoveredImovelId(null)
                }}
              >
                <Popup>
                  <div className="text-slate-100 font-sans min-w-[150px]">
                    <strong className="block mb-1">
                      {imovel.titulo.length > 25 ? imovel.titulo.substring(0, 25) + '...' : imovel.titulo}
                    </strong>
                    <div className="text-indigo-400 font-bold mb-3">
                      Total: R$ {((imovel.preco_aluguel || 0) + (imovel.preco_condominio || 0)).toLocaleString()}
                    </div>
                    <button 
                      onClick={() => handleOpenDetail(imovel.id)}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] uppercase font-bold py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all active:scale-95"
                    >
                      <Search size={12} />
                      Ver Detalhes
                    </button>
                  </div>
                </Popup>
              </Marker>
            )
          ))}
        </MapContainer>
      </div>

      {/* Modal de Detalhes - Tela Cheia */}
      {selectedImovel && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-5xl h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
            <header className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <h2 className="text-xl font-bold px-4">{selectedImovel.titulo}</h2>
              <button 
                onClick={() => setSelectedImovel(null)}
                className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10 max-w-4xl mx-auto w-full text-left">
              {/* Fotos */}
              <div className="relative rounded-3xl overflow-hidden aspect-video bg-slate-800 shadow-2xl group border border-slate-700">
                {selectedImovel.fotos && selectedImovel.fotos.length > 0 ? (
                  <>
                    <img 
                      src={selectedImovel.fotos[currentPhotoIndex].startsWith('data:image') ? selectedImovel.fotos[currentPhotoIndex] : `data:image/png;base64,${selectedImovel.fotos[currentPhotoIndex]}`} 
                      alt={`Foto ${currentPhotoIndex + 1}`} 
                      className="w-full h-full object-cover transition-opacity duration-300"
                    />
                    
                    {/* Controles do Carrossel */}
                    {selectedImovel.fotos.length > 1 && (
                      <>
                        <button 
                          onClick={handlePrevPhoto}
                          className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/80 text-white p-3 rounded-full backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
                        >
                          <ChevronLeft size={24} />
                        </button>
                        <button 
                          onClick={handleNextPhoto}
                          className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/80 text-white p-3 rounded-full backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
                        >
                          <ChevronRight size={24} />
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500 italic">Sem fotos disponíveis</div>
                )}
                
                {selectedImovel.fotos && selectedImovel.fotos.length > 0 && (
                  <div className="absolute bottom-6 right-6 bg-black/60 px-4 py-2 rounded-full text-xs font-bold backdrop-blur-xl border border-white/10 text-white">
                    {currentPhotoIndex + 1} / {selectedImovel.fotos.length}
                  </div>
                )}
              </div>

              {/* Informações Básicas e Preço */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-6 text-left">
                  <div className="flex items-center text-slate-200 gap-3">
                    <MapPin size={24} className="text-indigo-400 shrink-0" />
                    <span className="text-xl font-medium tracking-tight">{selectedImovel.endereco}</span>
                  </div>
                  
                  <p className="text-slate-400 leading-relaxed text-base bg-slate-800/30 p-6 rounded-2xl border border-slate-800/50 italic text-left">
                    "{selectedImovel.descricao || 'Este imóvel não possui uma descrição detalhada cadastrada no momento.'}"
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-slate-800/40 p-5 rounded-2xl text-center border border-slate-800 hover:border-slate-700 transition-colors">
                      <Bed className="mx-auto text-indigo-400 mb-2" size={28} />
                      <div className="text-xl font-black">{selectedImovel.quartos}</div>
                      <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Quartos</div>
                    </div>
                    <div className="bg-slate-800/40 p-5 rounded-2xl text-center border border-slate-800 hover:border-slate-700 transition-colors">
                      <Bath className="mx-auto text-indigo-400 mb-2" size={28} />
                      <div className="text-xl font-black">{selectedImovel.banheiros}</div>
                      <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Banh.</div>
                    </div>
                    <div className="bg-slate-800/40 p-5 rounded-2xl text-center border border-slate-800 hover:border-slate-700 transition-colors">
                      <Car className="mx-auto text-indigo-400 mb-2" size={28} />
                      <div className="text-xl font-black">{selectedImovel.vagas}</div>
                      <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Vagas</div>
                    </div>
                    <div className="bg-slate-800/40 p-5 rounded-2xl text-center border border-slate-800 hover:border-slate-700 transition-colors">
                      <Home className="mx-auto text-indigo-400 mb-2" size={28} />
                      <div className="text-xl font-black">{selectedImovel.metragem}</div>
                      <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Metros²</div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-indigo-500/10 to-slate-800/30 border border-indigo-500/30 p-6 rounded-3xl space-y-4 shadow-xl self-start">
                  <div>
                    <div className="text-[10px] text-indigo-300 font-bold mb-1 uppercase tracking-widest opacity-80">Custo Total Mensal</div>
                    <div className="text-3xl font-black text-white">
                      R$ {((selectedImovel.historico_precos?.[selectedImovel.historico_precos.length - 1]?.aluguel || 0) + 
                           (selectedImovel.historico_precos?.[selectedImovel.historico_precos.length - 1]?.condominio || 0)).toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="space-y-2 pt-3 border-t border-indigo-500/10">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-medium">Aluguel:</span>
                      <span className="text-slate-100 font-bold">R$ {selectedImovel.historico_precos?.[selectedImovel.historico_precos.length - 1]?.aluguel.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-medium">Condomínio:</span>
                      <span className="text-slate-100 font-bold">R$ {selectedImovel.historico_precos?.[selectedImovel.historico_precos.length - 1]?.condominio.toLocaleString()}</span>
                    </div>
                  </div>

                  <a 
                    href={selectedImovel.link} 
                    target="_blank" 
                    rel="noreferrer"
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transform hover:-translate-y-1 text-sm"
                  >
                    Abrir no Site Original
                  </a>
                </div>
              </div>

              {/* Mini Mapa de Localização - Largura Total */}
              <div className="bg-slate-800/50 rounded-3xl overflow-hidden h-64 border border-slate-800 shadow-2xl relative w-full">
                <div className="absolute top-4 left-4 z-[1000] bg-slate-900/80 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold text-indigo-300 border border-indigo-500/20 uppercase tracking-widest">
                  Localização Exata
                </div>
                <MapContainer 
                  center={[selectedImovel.latitude, selectedImovel.longitude]} 
                  zoom={15} 
                  style={{ height: '100%', width: '100%' }}
                  dragging={true}
                  zoomControl={true}
                  scrollWheelZoom={false}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[selectedImovel.latitude, selectedImovel.longitude]} />
                </MapContainer>
              </div>

              {/* Histórico de Preços */}
              <div className="space-y-6 pt-6">
                <div className="flex items-center gap-3 text-slate-100 font-black text-xl border-l-4 border-indigo-500 pl-4">
                  <TrendingUp size={24} className="text-indigo-400" />
                  Evolução do Preço
                </div>
                <div className="h-80 w-full bg-slate-800/20 rounded-3xl p-6 border border-slate-800/80 shadow-inner">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={selectedImovel.historico_precos}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.3} />
                      <XAxis 
                        dataKey="data" 
                        stroke="#64748b" 
                        fontSize={12}
                        tickMargin={10}
                        tickFormatter={(val) => new Date(val).toLocaleDateString()}
                      />
                      <YAxis 
                        stroke="#64748b" 
                        fontSize={12} 
                        tickFormatter={(val) => `R$ ${val}`}
                      />
                      <Tooltip 
                        contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' }}
                        labelFormatter={(val) => new Date(val).toLocaleDateString()}
                        itemStyle={{ color: '#818cf8', fontWeight: 'bold' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="aluguel" 
                        stroke="#818cf8" 
                        strokeWidth={4} 
                        dot={{ r: 6, fill: '#818cf8', strokeWidth: 0 }}
                        activeDot={{ r: 8, strokeWidth: 0, fill: '#6366f1' }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay Global */}
      {detailLoading && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[10001] flex items-center justify-center">
          <div className="bg-slate-900 p-6 rounded-3xl shadow-2xl border border-slate-800 flex items-center gap-4">
            <div className="w-6 h-6 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="font-bold">Buscando detalhes...</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
