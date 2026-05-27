"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function Map() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null); // Referência para atualizar o marcador do usuário sem recriar o mapa
  
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. Captura a geolocalização do usuário
  useEffect(() => {
    if (!navigator.geolocation) {
      console.warn("Geolocalização não é suportada.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentPosition({ lat: latitude, lng: longitude });
        setLoading(false);
      },
      (error) => {
        console.error("Erro ao obter localização:", error);
        setLoading(false); // Desativa o loading mesmo se falhar, usando o centro padrão
      },
      { timeout: 30000 }
    );
  }, []);

  // 2. Inicializa o mapa uma única vez
  useEffect(() => {
    // Garante que o contêiner existe e que o mapa não foi criado ainda
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Define o centro: se tiver a posição usa ela, senão usa o padrão (Santa Maria)
    const centerLat = currentPosition?.lat || -29.71;
    const centerLng = currentPosition?.lng || -53.71;

    const map = L.map(mapContainerRef.current).setView([centerLat, centerLng], 13);
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Ícone Vermelho (Google Maps Style) criado de forma segura no cliente
    const redIcon = L.divIcon({
      className: "custom-pin",
      html: `
        <svg width="24" height="36" viewBox="0 0 30 42" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0px 3px 4px rgba(0,0,0,0.3));">
          <path d="M15 0C6.71573 0 0 6.71573 0 15C0 26.25 15 42 15 42C15 42 30 26.25 30 15C30 6.71573 23.2843 0 15 0Z" fill="#EA4335"/>
          <circle cx="15" cy="15" r="5.5" fill="white"/>
        </svg>
      `,
      iconSize: [24, 36],
      iconAnchor: [12, 36],
      popupAnchor: [0, -35]
    });

    // Ponto de doação estático de exemplo
    L.marker([-29.71, -53.71], { icon: redIcon })
      .addTo(map)
      .bindPopup("<b>Ponto de Doação Exemplo</b>");

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []); // Executa apenas uma vez ao montar o componente

  // 3. Atualiza ou adiciona o marcador do usuário dinamicamente quando a posição chegar
  useEffect(() => {
    if (!mapInstanceRef.current || !currentPosition) return;

    const map = mapInstanceRef.current;

    const userIcon = L.divIcon({
      className: "user-pin",
      html: `
        <div style="
          background-color: #4285F4; 
          border: 2px solid white; 
          border-radius: 50%; 
          width: 14px; 
          height: 14px; 
          box-shadow: 0 0 6px rgba(0,0,0,0.4);
        "></div>
      `,
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    });

    // Centraliza o mapa na posição do usuário recebida
    map.setView([currentPosition.lat, currentPosition.lng], 13);

    // Se o marcador do usuário já existir, apenas move ele. Se não, cria um novo.
    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([currentPosition.lat, currentPosition.lng]);
    } else {
      userMarkerRef.current = L.marker([currentPosition.lat, currentPosition.lng], { icon: userIcon })
        .addTo(map)
    }
  }, [currentPosition]);

  return (
    <div style={{ position: "relative", height: "90%", width: "100%" }}>
      {/* Tela de carregamento por cima do mapa */}
      {loading && (
        <div style={{
          position: "absolute",
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(255,255,255,0.8)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000, // Fica acima do Leaflet
          fontSize: "16px", fontWeight: "500"
        }}>
          <p>Obtendo localização...</p>
        </div>
      )}

      {/* O contêiner do mapa sempre renderiza, evitando quebras de ref */}
      <div 
        ref={mapContainerRef} 
        style={{ height: "100%", width: "100%" }} 
      />
    </div>
  );
}