"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function Map() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined" && !navigator.geolocation) {
      console.warn("Geolocalização não é suportada.");
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
        console.error("Erro ao obter localização:", error);
        setLoading(false);
      },
      { timeout: 30000 }
    );
  }, []);


  useEffect(() => {
    if (loading || !mapContainerRef.current || mapInstanceRef.current) return;
    const centerLat = currentPosition?.lat || -29.71;
    const centerLng = currentPosition?.lng || -53.71;

    const map = L.map(mapContainerRef.current).setView([centerLat, centerLng], 13);
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

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

    L.marker([-29.71, -53.71], { icon: redIcon })
      .addTo(map)
      .bindPopup("<b>Ponto de Doação Exemplo</b>");

    if (currentPosition) {
      const userIcon = L.divIcon({
        className: "user-pin",
        html: `<div style="background-color: #4285F4; border: 2px solid white; border-radius: 50%; width: 14px; height: 14px; box-shadow: 0 0 6px rgba(0,0,0,0.4);"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      });
      userMarkerRef.current = L.marker([currentPosition.lat, currentPosition.lng], { icon: userIcon }).addTo(map);
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      userMarkerRef.current = null;
    };
  }, [loading, currentPosition]);

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
    
    map.setView([currentPosition.lat, currentPosition.lng], 13);
  }, [currentPosition]);

  return (
    <div style={{ position: "relative", height: "90%", width: "100%" }}>
      {loading && (
        <div style={{
          position: "absolute",
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(255,255,255,0.8)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000,
          fontSize: "16px", fontWeight: "500"
        }}>
          <p>Obtendo localização...</p>
        </div>
      )}

      <div 
        ref={mapContainerRef} 
        style={{ height: "100%", width: "100%" }} 
      />
    </div>
  );
}