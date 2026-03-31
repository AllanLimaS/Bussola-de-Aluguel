import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';

// Componentes Modulares
import Sidebar from './components/Sidebar/Sidebar';
import MainMap from './components/Map/MainMap';
import PropertyDetailModal from './components/Modal/PropertyDetailModal';
import LoadingOverlay from './components/UI/LoadingOverlay';

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
  
  const cardsRef = useRef({});

  // Estado dos Filtros
  const [filters, setFilters] = useState({
    precoMin: '',
    precoMax: '',
    quartos: '',
    banheiros: '',
    vagas: '',
    bairro: '',
    ordenacao: '',
    mostrarApenasFavoritos: false,
    ocultarDescartados: true
  });

  useEffect(() => {
    axios.get(`${API_BASE_URL}/imoveis`)
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
      
      const matchFavoritos = !filters.mostrarApenasFavoritos || imovel.interacao === 'like';
      const matchDescartados = !filters.ocultarDescartados || imovel.interacao !== 'dislike';

      return matchPrecoMin && matchPrecoMax && matchQuartos && matchBanheiros && matchVagas && matchBairro && matchFavoritos && matchDescartados;
    });

    if (filters.ordenacao === 'menor_preco') {
      result.sort((a, b) => ((a.preco_aluguel || 0) + (a.preco_condominio || 0)) - ((b.preco_aluguel || 0) + (b.preco_condominio || 0)));
    } else if (filters.ordenacao === 'maior_preco') {
      result.sort((a, b) => ((b.preco_aluguel || 0) + (b.preco_condominio || 0)) - ((a.preco_aluguel || 0) + (a.preco_condominio || 0)));
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

  const handleOpenDetail = (id) => {
    setDetailLoading(true);
    setCurrentPhotoIndex(0);
    axios.get(`${API_BASE_URL}/imoveis/${id}`)
      .then(response => {
        setSelectedImovel(response.data);
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
      bairro: '', ordenacao: '', mostrarApenasFavoritos: false, ocultarDescartados: true 
    });
  };

  return (
    <div className="flex h-screen w-full bg-slate-950 font-sans text-slate-100 uppercase-none overflow-hidden relative">
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
      />

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
    </div>
  );
}

export default App;
