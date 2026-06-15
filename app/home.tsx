"use client";

import Header from '@/src/components/Header';
import { createClient } from '@/src/utils/supabase/client';
import dynamic from 'next/dynamic';

const Map = dynamic(() => import('@/src/components/Map'), { 
  ssr: false,
  loading: () => <p>Carregando mapa...</p>
});

export default function Home() {
    const supabase = createClient();

    return (
        <main style={{ height: "100vh" }}>
            <Header />
            <Map supabase={supabase} />
        </main>
    );
}