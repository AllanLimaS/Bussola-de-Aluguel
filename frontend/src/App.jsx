import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';

// Componentes Modulares
import Sidebar from './components/Sidebar/Sidebar';
import MainMap from './components/Map/MainMap';
import PropertyDetailModal from './components/Modal/PropertyDetailModal';
import LoadingOverlay from './components/UI/LoadingOverlay';
import MatchInfoModal from './components/Sidebar/MatchInfoModal';

const API_BASE_URL = 'http://localhost:8000';

function App() {
  const [imoveis, setImoveis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedImovel, setSelectedImovel] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [hoveredImovelId, setHoveredImovelId] = useState(null);
  const [isHoverFromCard, setIsHoverFromCard] = useState(false);
  const [activeCardId, setActiveCardId] = useState(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showMatchInfo, setShowMatchInfo] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [novidades, setNovidades] = useState([]);
  const [showNovidades, setShowNovidades] = useState(false);

  const cardsRef = useRef({});

  // Estado dos Filtros
  const [filters, setFilters] = useState({
    precoMin: '',
    precoMax: '',
    quartos: '',
    banheiros: '',
    vagas: '',
    bairro: '',
    ordenacao: 'match',
    mostrarApenasFavoritos: false,
    ocultarDescartados: true
  });

  const fetchImoveis = () => {
    setLoading(true);
    axios.get(`${API_BASE_URL}/imoveis/recomendados`)
      .then(response => {
        // Suporte para o novo formato {profile, results} ou formato antigo (array direto)
        const data = response.data;
        const results = data.results || (Array.isArray(data) ? data : []);
        const profile = data.profile || null;
        
        setImoveis(results);
        setUserProfile(profile);
        setLoading(false);
      })
      .catch(error => {
        console.error("Erro ao carregar imóveis:", error);
        setLoading(false);
      });
  };

  const fetchNovidades = () => {
    axios.get(`${API_BASE_URL}/novidades`)
      .then(response => {
        setNovidades(response.data);
      })
      .catch(error => console.error("Erro ao carregar novidades:", error));
  };

  useEffect(() => {
    fetchImoveis();
    fetchNovidades();
  }, []);

  const handleRecalculate = () => {
    fetchImoveis();
  };

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
      
      const matchFavoritos = !filters.mostrarApenasFavoritos || imovel.interacao === 'like';
      const matchDescartados = !filters.ocultarDescartados || imovel.interacao !== 'dislike';

      return matchPrecoMin && matchPrecoMax && matchQuartos && matchBanheiros && matchVagas && matchBairro && matchFavoritos && matchDescartados;
    });

    if (filters.ordenacao === 'menor_preco') {
      result.sort((a, b) => ((a.preco_aluguel || 0) + (a.preco_condominio || 0)) - ((b.preco_aluguel || 0) + (b.preco_condominio || 0)));
    } else if (filters.ordenacao === 'maior_preco') {
      result.sort((a, b) => ((b.preco_aluguel || 0) + (b.preco_condominio || 0)) - ((a.preco_aluguel || 0) + (a.preco_condominio || 0)));
    } else if (filters.ordenacao === 'match') {
      result.sort((a, b) => (b.affinity_score || 0) - (a.affinity_score || 0));
    }

    return result;
  }, [imoveis, filters]);

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleInteragir = (e, imovelId, tipo) => {
    e.stopPropagation();
    axios.post(`${API_BASE_URL}/imoveis/${imovelId}/interagir`, { tipo })
      .then(() => {
        setImoveis(prev => prev.map(im => im.id === imovelId ? { ...im, interacao: tipo } : im));
        if (selectedImovel && selectedImovel.id === imovelId) {
          setSelectedImovel(prev => ({ ...prev, interacao: tipo }));
        }
      })
      .catch(error => console.error("Erro ao interagir:", error));
  };

  const handleMarcarNovidadeVisto = (novidadeId) => {
    axios.post(`${API_BASE_URL}/novidades/${novidadeId}/visto`)
      .then(() => {
        setNovidades(prev => prev.filter(n => n.id !== novidadeId));
      })
      .catch(error => console.error("Erro ao marcar novidade como vista:", error));
  };

  const handleLimparNovidades = () => {
    axios.post(`${API_BASE_URL}/novidades/limpar`)
      .then(() => {
        setNovidades([]);
      })
      .catch(error => console.error("Erro ao limpar novidades:", error));
  };

  const handleOpenDetail = (id) => {
    setDetailLoading(true);
    setCurrentPhotoIndex(0);
    axios.get(`${API_BASE_URL}/imoveis/${id}`)
      .then(response => {
        const baseImovel = imoveis.find(im => im.id === id);
        setSelectedImovel({ ...response.data, affinity_score: baseImovel?.affinity_score });
        setDetailLoading(false);
      })
      .catch(error => {
        console.error("Erro ao carregar detalhes:", error);
        setDetailLoading(false);
      });
  };

  const scrollToCard = (id, openDetail = false) => {
    setActiveCardId(id);
    if (id && cardsRef.current[id]) {
      cardsRef.current[id].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    if (id && openDetail) {
      handleOpenDetail(id);
    }
  };

  const handleMapClick = () => {
    setActiveCardId(null);
    setSelectedImovel(null);
  };

  const handleClearFilters = () => {
    setFilters({ 
      precoMin: '', precoMax: '', quartos: '', banheiros: '', vagas: '', 
      bairro: '', ordenacao: 'match', mostrarApenasFavoritos: false, ocultarDescartados: true 
    });
  };

  return (
    <div className="flex h-screen w-full bg-slate-950 font-sans text-slate-100 uppercase-none overflow-hidden relative">
      <div className="w-[440px] h-full shrink-0">
        <Sidebar 
        imoveis={filteredImoveis}
        loading={loading}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        activeCardId={activeCardId}
        hoveredImovelId={hoveredImovelId}
        onOpenDetail={handleOpenDetail}
        onHoverCard={(id) => {
          setHoveredImovelId(id);
          setIsHoverFromCard(!!id);
        }}
        onInteragir={handleInteragir}
        cardsRef={cardsRef}
        onRecalculate={handleRecalculate}
        onOpenMatchInfo={() => setShowMatchInfo(true)}
        novidades={novidades}
        showNovidades={showNovidades}
        setShowNovidades={setShowNovidades}
        onMarcarNovidadeVisto={handleMarcarNovidadeVisto}
        onLimparNovidades={handleLimparNovidades}
      />
      </div>

      <MainMap 
        imoveis={filteredImoveis}
        hoveredImovelId={hoveredImovelId}
        activeCardId={activeCardId}
        onMarkerClick={scrollToCard}
        onHoverMarker={(id) => {
          setHoveredImovelId(id);
          setIsHoverFromCard(false);
        }}
        onMapClick={handleMapClick}
        isHoverFromCard={isHoverFromCard}
      />

      <PropertyDetailModal 
        imovel={selectedImovel}
        currentPhotoIndex={currentPhotoIndex}
        onClose={() => setSelectedImovel(null)}
        onPrevPhoto={(e) => {
          e.stopPropagation();
          setCurrentPhotoIndex(prev => (prev === 0 ? selectedImovel.fotos.length - 1 : prev - 1));
        }}
        onNextPhoto={(e) => {
          e.stopPropagation();
          setCurrentPhotoIndex(prev => (prev === selectedImovel.fotos.length - 1 ? 0 : prev + 1));
        }}
        onInteragir={handleInteragir}
      />

      {detailLoading && (
        <LoadingOverlay message="Buscando detalhes..." fullScreen={true} />
      )}

      <MatchInfoModal 
        isOpen={showMatchInfo} 
        onClose={() => setShowMatchInfo(false)} 
        profile={userProfile}
      />
    </div>
  );
}

export default App;
