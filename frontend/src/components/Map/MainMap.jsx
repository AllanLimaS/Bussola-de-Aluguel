import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { Search } from 'lucide-react';
import L from 'leaflet';

// Corrigir ícones do Leaflet
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const normalIcon = L.divIcon({
    className: 'map-marker-container',
    html: '<div class="map-marker map-marker--normal"></div>',
    iconSize: [25, 25],
    iconAnchor: [12, 25],
    popupAnchor: [0, -25]
});

const normalHighlightIcon = L.divIcon({
    className: 'map-marker-container-highlight',
    html: '<div class="map-marker map-marker--normal map-marker--highlight"></div>',
    iconSize: [35, 35],
    iconAnchor: [17, 35],
    popupAnchor: [0, -35]
});

const favoriteIcon = L.divIcon({
    className: 'map-marker-container-favorite',
    html: '<div class="map-marker map-marker--favorite"></div>',
    iconSize: [25, 25],
    iconAnchor: [12, 25],
    popupAnchor: [0, -25]
});

const favoriteHighlightIcon = L.divIcon({
    className: 'map-marker-container-favorite-highlight',
    html: '<div class="map-marker map-marker--favorite map-marker--highlight"></div>',
    iconSize: [35, 35],
    iconAnchor: [17, 35],
    popupAnchor: [0, -35]
});

const MapEvents = ({ onMapClick }) => {
  useMapEvents({
    click: () => {
      onMapClick();
    },
  });
  return null;
};

const MainMap = ({ 
  imoveis, 
  hoveredImovelId, 
  activeCardId, 
  onMarkerClick, 
  onHoverMarker,
  onMapClick,
  isHoverFromCard
}) => {
  return (
    <div className="flex-1 h-full relative overflow-hidden">
      <MapContainer 
        center={[-26.9078, -48.6619]} 
        zoom={13} 
        style={{ height: '100%', width: '100%', filter: 'opacity(0.9) saturate(1.2)' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapEvents onMapClick={onMapClick} />
        
        {imoveis.map(imovel => {
          const isHovered = hoveredImovelId === imovel.id;
          const isSelected = activeCardId === imovel.id;
          const isSomeHoveredFromCard = !!hoveredImovelId && isHoverFromCard;
          
          let opacity = 1.0;
          if (isSomeHoveredFromCard) {
            // Se algo está em hover via CARD, mostra apenas o que está em hover OU o que está selecionado
            opacity = (isHovered || isSelected) ? 1.0 : 0.0;
          } else if (activeCardId) {
            // Se nada está em hover (ou hover via MAPA) mas há um selecionado, diminui a opacidade dos outros
            opacity = isSelected ? 1.0 : 0.2;
          }

          const isFocused = isHovered || isSelected;

          let icon = normalIcon;
          if (isFocused) {
            icon = (imovel.interacao === 'like') ? favoriteHighlightIcon : normalHighlightIcon;
          } else if (imovel.interacao === 'like') {
            icon = favoriteIcon;
          }

          return imovel.latitude && imovel.longitude && (
            <Marker 
              key={imovel.id} 
              position={[imovel.latitude, imovel.longitude]}
              icon={icon}
              opacity={opacity}
              eventHandlers={{ 
                click: () => onMarkerClick(imovel.id),
                mouseover: () => onHoverMarker(imovel.id),
                mouseout: () => onHoverMarker(null)
              }}
            >
              <Popup className="custom-popup">
                <div className="text-slate-100 font-sans min-w-[150px] p-1">
                  <strong className="block mb-1 text-sm leading-tight">
                    {imovel.titulo.length > 25 ? imovel.titulo.substring(0, 25) + '...' : imovel.titulo}
                  </strong>
                  <div className="text-indigo-400 font-black mb-3 text-base">
                    Total: R$ {((imovel.preco_aluguel || 0) + (imovel.preco_condominio || 0)).toLocaleString()}
                  </div>
                  <button 
                    onClick={() => onMarkerClick(imovel.id, true)}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] uppercase font-black py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-lg active:scale-95"
                  >
                    <Search size={12} />
                    Ver Detalhes
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default MainMap;
