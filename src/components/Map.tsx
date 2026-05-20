"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const redIcon = L.divIcon({
  className: "custom-google-pin",
  html: `
    <svg width="20" height="32" viewBox="0 0 30 42" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0px 3px 4px rgba(0,0,0,0.3));">
      <path d="M15 0C6.71573 0 0 6.71573 0 15C0 26.25 15 42 15 42C15 42 30 26.25 30 15C30 6.71573 23.2843 0 15 0Z" fill="#EA4335"/>
      <circle cx="15" cy="15" r="5.5" fill="white"/>
    </svg>
  `,
  iconSize: [20, 32],
  iconAnchor: [10, 32],
  popupAnchor: [0, -40]
});

export default function Map() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current).setView([-29.71, -53.71], 13);
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    L.marker([-29.71, -53.71], { icon: redIcon })
      .addTo(map)
      .bindPopup("Ponto de Doação Exemplo")

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  return (
    <div 
      ref={mapContainerRef} 
      style={{ height: "90%", width: "100%" }} 
    />
  );
}