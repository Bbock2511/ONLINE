"use client";

import dynamic from 'next/dynamic';

const Map = dynamic(() => import('@/src/components/Map'), { 
  ssr: false,
  loading: () => <p>Carregando mapa...</p>
});

export default function Home() {
  return (
    <main style={{ padding: "20px" }}>
      <h1>Pontos de Doação</h1>
      <Map />
    </main>
  );
}