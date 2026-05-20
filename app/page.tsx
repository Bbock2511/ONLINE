"use client";

import Header from '@/src/components/Header';
import dynamic from 'next/dynamic';

const Map = dynamic(() => import('@/src/components/Map'), { 
  ssr: false,
  loading: () => <p>Carregando mapa...</p>
});

export default function Home() {
  return (
    <main style={{ height: "100vh" }}>
      <Header />
      <Map />
    </main>
  );
}