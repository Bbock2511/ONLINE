"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { PontosDoacao } from "../utils/types/pontosDoacao";

interface MapProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any; // Instância do cliente Supabase passada via props
}

export default function Map({ supabase }: MapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. Captura a geolocalização do usuário assim que o componente monta
  useEffect(() => {
    if (typeof window !== "undefined" && !navigator.geolocation) {
      console.warn("Geolocalização não é suportada pelo navegador.");
      queueMicrotask(() => setLoading(false));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentPosition({ lat: latitude, lng: longitude });
        setLoading(false);
      },
      (error) => {
        console.error("Erro ao obter localização do usuário:", error);
        setLoading(false); // Mantém falso para carregar o mapa no centro padrão
      },
      { timeout: 30000 }
    );
  }, []);

  // 2. Inicializa o mapa e busca os pontos do banco assim que o loading termina
  useEffect(() => {
    if (loading || !mapContainerRef.current || mapInstanceRef.current) return;

    // Define o centro: usa a posição do usuário capturada ou Santa Maria como fallback
    const centerLat = currentPosition?.lat || -29.71;
    const centerLng = currentPosition?.lng || -53.71;

    // Instancia o mapa do Leaflet
    const map = L.map(mapContainerRef.current).setView([centerLat, centerLng], 14);
    mapInstanceRef.current = map;

    // Renderiza a camada visual de mapas públicos do OpenStreetMap
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Ícone customizado em formato de Pin Vermelho (Estilo Google Maps) feito em SVG plano
    const redIcon = L.divIcon({
      className: "custom-pin",
      html: `
        <svg width="24" height="36" viewBox="0 0 30 42" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0px 3px 4px rgba(0,0,0,0.3));">
          <path d="M15 0C6.71573 0 0 6.71573 0 15C0 26.25 15 42 15 42C15 42 30 26.25 30 15C30 6.71573 23.2843 0 15 0Z" fill="#CC2949"/>
          <circle cx="15" cy="15" r="5.5" fill="white"/>
        </svg>
      `,
      iconSize: [24, 36],
      iconAnchor: [12, 36],
      popupAnchor: [0, -35]
    });

    // Função interna assíncrona para ler as linhas da tabela no Supabase
    const carregarPontosDoacao = async () => {
      try {
        const { data, error } = await supabase
          .from('pontos_doacao')
          .select('*');

        if (error) throw error;

        if (data) {
          data.forEach((ponto: PontosDoacao) => {
            const tipos = ponto.tipos_doacao ? ponto.tipos_doacao.join(', ') : '';
            
            // Cria o marcador físico para cada comércio vindo do Postgres
            L.marker([ponto.latitude, ponto.longitude], { icon: redIcon })
              .addTo(map)
              .bindPopup(`
                <div style="font-family: sans-serif; min-width: 160px; padding: 2px;">
                  <h3 style="margin: 0 0 6px 0; color: #CC2949; font-size: 14px; font-weight: 700;">${ponto.nome_empresa}</h3>
                  <p style="margin: 0 0 4px 0; font-size: 12px; color: #333; line-height: 1.3;"><b>Endereço:</b> ${ponto.endereco}</p>
                  <p style="margin: 4px 0 0 0; font-size: 12px; color: #555;"><b>Aceita:</b> <span style="color: #CC2949; font-weight: 600;">${tipos}</span></p>
                  ${ponto.contato ? `<p style="margin: 4px 0 0 0; font-size: 12px; color: #666;"><b>Contato:</b> ${ponto.contato}</p>` : ''}
                </div>
              `);
          });
        }
      } catch (err) {
        console.error("Erro ao processar marcadores do Supabase:", err);
      }
    };

    // Executa a busca de dados
    carregarPontosDoacao();

    // Cria o marcador azul de localização em tempo real do dispositivo do usuário
    if (currentPosition) {
      const userIcon = L.divIcon({
        className: "user-pin",
        html: `<div style="background-color: #4285F4; border: 2px solid white; border-radius: 50%; width: 14px; height: 14px; box-shadow: 0 0 6px rgba(0,0,0,0.4);"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      });
      userMarkerRef.current = L.marker([currentPosition.lat, currentPosition.lng], { icon: userIcon }).addTo(map);
    }

    // Função de limpeza do efeito: desmonta o mapa da memória do navegador para evitar memory leaks
    return () => {
      if (mapInstanceRef.current) {
        map.remove();
        mapInstanceRef.current = null;
        userMarkerRef.current = null;
      }
    };
  }, [loading, currentPosition, supabase]);

  // 3. Efeito observador: atualiza de forma fluida a posição do usuário se o GPS mudar as coordenadas
  useEffect(() => {
    if (!mapInstanceRef.current || !currentPosition) return;

    const map = mapInstanceRef.current;

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([currentPosition.lat, currentPosition.lng]);
    } else {
      const userIcon = L.divIcon({
        className: "user-pin",
        html: `<div style="background-color: #4285F4; border: 2px solid white; border-radius: 50%; width: 14px; height: 14px; box-shadow: 0 0 6px rgba(0,0,0,0.4);"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      });
      userMarkerRef.current = L.marker([currentPosition.lat, currentPosition.lng], { icon: userIcon }).addTo(map);
    }
    
    map.setView([currentPosition.lat, currentPosition.lng], 14);
  }, [currentPosition]);

  return (
    <div style={{ position: "relative", height: "90%", width: "100%" }}>
      
      {/* Overlay de carregamento sobre o contêiner do mapa */}
      {loading && (
        <div style={{
          position: "absolute",
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(255,255,255,0.9)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000,
          fontSize: "16px", fontWeight: "600",
          color: "#CC2949",
          fontFamily: "sans-serif"
        }}>
          <p>Buscando sua localização...</p>
        </div>
      )}

      {/* Elemento DOM onde o Leaflet injeta os elementos gráficos do mapa */}
      <div 
        ref={mapContainerRef} 
        style={{ height: "100%", width: "100%" }} 
      />
    </div>
  );
}