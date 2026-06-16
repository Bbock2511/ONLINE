"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@/src/utils/supabase/client';
import { PontosDoacaoEnvio } from '@/src/utils/types/pontosDoacaoEnvio';
import { useRouter } from 'next/navigation';
import L from 'leaflet';
import "leaflet/dist/leaflet.css";

export default function CadastrarComercioPage() {
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [endereco, setEndereco] = useState('');
  const [contato, setContato] = useState('');
  const [tiposDoacao, setTiposDoacao] = useState<string[]>([]);
  const [erroDoacao, setErroDoacao] = useState(false);
  const [enviando, setEnviando] = useState(false);

  // Estados para o mini-mapa interativo
  const [coordenadas, setCoordenadas] = useState<{ lat: number; lng: number } | null>(null);
  const [buscandoLocalizacao, setBuscandoLocalizacao] = useState(false);

  const miniMapContainerRef = useRef<HTMLDivElement>(null);
  const miniMapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const supabase = createClient();

  const opcoesDoacao = [
    'Roupas e Cobertores', 
    'Alimentos Não Perecíveis', 
    'Água Potável', 
    'Produtos de Limpeza', 
    'Higiene Pessoal', 
    'Ração para Animais'
  ];

  // Exige "Texto, Texto, Texto" (Rua, Número, Bairro)
  const regexEndereco = /^([^,]+),\s*([^,]+),\s*([^,]+)$/;

  const buscarCoordenadas = async (endereco: string) => {
    const query = encodeURIComponent(`${endereco}, Santa Maria, RS`);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}&countrycodes=br&limit=1`;

    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'OnlineAppUFSM (online-app@gmail.com)' }
      });
      const dados = await response.json();

      if (dados && dados.length > 0) {
        return { lat: parseFloat(dados[0].lat), lng: parseFloat(dados[0].lon) };
      }
      return null;
    } catch (error) {
      console.error("Erro na geocodificação:", error);
      return null;
    }
  };

  const dispararGeocodificacao = async (textoEndereco: string) => {
    setBuscandoLocalizacao(true);
    const resultado = await buscarCoordenadas(textoEndereco);
    setBuscandoLocalizacao(false);
    
    if (resultado) {
      setCoordenadas(resultado);
    }
  };

 const enderecoValido = regexEndereco.test(endereco.trim());

  useEffect(() => {
    if (enderecoValido) {
      const delayDebounce = setTimeout(() => {
        dispararGeocodificacao(endereco);
      }, 800);

      return () => clearTimeout(delayDebounce);
    } else {
      if (coordenadas !== null) {
        queueMicrotask(() => setCoordenadas(null));
      }

      if (miniMapInstanceRef.current) {
        miniMapInstanceRef.current.remove();
        miniMapInstanceRef.current = null;
        markerRef.current = null;
      }
    }
  }, [enderecoValido, endereco]);

  // Efeito responsável por inicializar e atualizar o Mini-Mapa
  useEffect(() => {
    if (!coordenadas || !miniMapContainerRef.current) return;

    // Se o mapa ainda não existe, cria ele
    if (!miniMapInstanceRef.current) {
      const map = L.map(miniMapContainerRef.current, {
        zoomControl: true,
        dragging: true
      }).setView([coordenadas.lat, coordenadas.lng], 15);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);

      // Ícone vermelho customizado para combinar com a identidade visual do app
      const redIcon = L.divIcon({
        className: "custom-pin",
        html: `
          <svg width="20" height="30" viewBox="0 0 30 42" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 0C6.71573 0 0 6.71573 0 15C0 26.25 15 42 15 42C15 42 30 26.25 30 15C30 6.71573 23.2843 0 15 0Z" fill="#CC2949"/>
            <circle cx="15" cy="15" r="5.5" fill="white"/>
          </svg>
        `,
        iconSize: [20, 30],
        iconAnchor: [10, 30]
      });

      // Marcador ARRASTÁVEL para o usuário corrigir pequenos desvios de malha urbana
      const marker = L.marker([coordenadas.lat, coordenadas.lng], { 
        icon: redIcon, 
        draggable: true 
      }).addTo(map);

      // Atualiza o estado se o usuário arrastar o pino na mão
      marker.on('dragend', (event) => {
        const position = event.target.getLatLng();
        setCoordenadas({ lat: position.lat, lng: position.lng });
      });

      markerRef.current = marker;
      miniMapInstanceRef.current = map;
    } else {
      // Se o mapa já existe e a localização mudou via input de texto, move o pino de forma suave
      miniMapInstanceRef.current.setView([coordenadas.lat, coordenadas.lng], 15);
      if (markerRef.current) {
        markerRef.current.setLatLng([coordenadas.lat, coordenadas.lng]);
      }
    }
  }, [coordenadas]);

  const handleCheckboxChange = (opcao: string) => {
    setTiposDoacao(prev => {
      const novoArray = prev.includes(opcao) ? prev.filter(item => item !== opcao) : [...prev, opcao];
      if (novoArray.length > 0) setErroDoacao(false);
      return novoArray;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (tiposDoacao.length === 0) {
      setErroDoacao(true);
      return;
    }

    if (!coordenadas) {
      alert("Por favor, insira um endereço válido ou aguarde a localização no mapa.");
      return;
    }

    setErroDoacao(false);

    const novoPontoColeta = {
      nome_empresa: nome,
      endereco,
      contato,
      tipos_doacao: tiposDoacao,
      latitude: coordenadas.lat,
      longitude: coordenadas.lng,
    };

    const sucesso = await sendData(novoPontoColeta);
  
    if (sucesso) {
      alert("Ponto de coleta cadastrado com sucesso!");
      setNome('');
      setEndereco('');
      setContato('');
      setTiposDoacao([]);
      setCoordenadas(null);
      router.replace('/'); 
    } else {
      alert("Ocorreu um erro ao salvar os dados. Tente novamente.");
    }
  };

  const sendData = async (data: PontosDoacaoEnvio): Promise<boolean> => {
    setEnviando(true);
    try {
      const { error } = await supabase.from('pontos_doacao').insert([data]);
      if (error) {
        console.error("Erro retornado pelo Supabase:", error);
        return false;
      }
      return true;
    } catch (error) {
      console.error("Erro ao enviar dados:", error);
      return false;
    } finally {
      setEnviando(false);
    }
  };

  const formatarTelefone = (valor: string) => {
    const apenasNumeros = valor.replace(/\D/g, "");
    const digitosLimitados = apenasNumeros.slice(0, 11);

    if (digitosLimitados.length <= 2) {
      return digitosLimitados.length > 0 ? `(${digitosLimitados}` : "";
    }
    if (digitosLimitados.length <= 6) {
      return `(${digitosLimitados.slice(0, 2)}) ${digitosLimitados.slice(2)}`;
    }
    return `(${digitosLimitados.slice(0, 2)}) ${digitosLimitados.slice(2, 7)}-${digitosLimitados.slice(7)}`;
  };

  return (
    <main style={{ backgroundColor: '#fff', minHeight: '100vh', padding: '40px 20px', color: '#333', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '500px', margin: '0 auto' }}>
        
        <Link href="/" style={{ color: '#CC2949', textDecoration: 'none', fontSize: '14px', fontWeight: 500, display: 'inline-block', marginBottom: '20px' }}>
          &larr; Voltar para o mapa
        </Link>

        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#CC2949', marginBottom: '8px' }}>
          Cadastrar Ponto de Coleta
        </h1>
        <p style={{ color: '#666', fontSize: '14px', marginBottom: '30px' }}>
          Adicione um comércio ou ponto físico para receber doações na cidade.
        </p>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Campo Nome */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#CC2949', fontSize: '14px' }}>
              NOME DO ESTABELECIMENTO
            </label>
            <input 
              type="text" 
              value={nome} 
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Mercadinho do Bairro"
              required 
              style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '2px solid #CC2949', outline: 'none', fontSize: '16px' }}
            />
          </div>

          {/* Campo Endereço */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#CC2949', fontSize: '14px' }}>
              ENDEREÇO COMPLETO
            </label>
            <div style={{ position: 'relative', marginBottom: '8px' }}>
              <input 
                type="text" 
                value={endereco} 
                onChange={(e) => 
                  setEndereco(e.target.value)
                }
                required 
                id="endereco"
                placeholder=" "
                style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '2px solid #CC2949', outline: 'none', fontSize: '16px', backgroundColor: 'transparent' }}
              />
              <label
                htmlFor="endereco"
                style={{
                  position: 'absolute', left: '14px',
                  top: endereco ? '0px' : '51%',
                  transform: endereco ? 'none' : 'translateY(-50%)',
                  fontSize: endereco ? '12px' : '16px',
                  color: endereco ? '#CC2949' : '#999',
                  transition: 'all 0.2s ease', pointerEvents: 'none',
                  fontWeight: endereco ? 'bold' : 'normal'
                }}
              >
                Rua, Número, Bairro
              </label>
            </div>

            {/* Aviso auxiliar enquanto o padrão do Regex não bate */}
            {!enderecoValido && endereco.length > 0 && (
              <span style={{ fontSize: '12px', color: '#666' }}>
                💡 Digite no formato separado por vírgulas: <b>Rua, Número, Bairro</b>
              </span>
            )}

            {/* Feedback visual de carregamento de API */}
            {buscandoLocalizacao && (
              <span style={{ fontSize: '12px', color: '#CC2949', display: 'block', marginTop: '4px' }}>
                🔍 Buscando coordenadas no mapa...
              </span>
            )}

            {/* MINI-MAPA CONDICIONAL INTERATIVO */}
            {enderecoValido && (
              <div style={{ marginTop: '12px' }}>
                <span style={{ fontSize: '12px', color: '#222', display: 'block', marginBottom: '6px', fontWeight: 500 }}>
                  📍 Verifique a localização ou arraste o pino para ajustar:
                </span>
                <div 
                  ref={miniMapContainerRef} 
                  style={{ height: '200px', width: '100%', borderRadius: '6px', border: '2px solid #CC2949', zIndex: 1 }} 
                />
              </div>
            )}
          </div>

          {/* Campo Contato */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#CC2949', fontSize: '14px' }}>
              CONTATO
            </label>
            <input 
              type="text" 
              value={contato} 
              onChange={(e) => setContato(formatarTelefone(e.target.value))}
              placeholder="Ex: (55) 99999-9999"
              required 
              style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '2px solid #CC2949', outline: 'none', fontSize: '16px' }}
            />
          </div>

          {/* Seção Multiselect */}
          <div>
            <label style={{ display: 'block', marginBottom: '12px', fontWeight: 600, color: '#CC2949', fontSize: '14px' }}>
              O QUE ESSE PONTO ESTÁ ACEITANDO?
            </label>
            {erroDoacao && (
              <span style={{ display: 'block', color: '#ff0033', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
                ⚠️ Selecione pelo menos uma categoria de doação.
              </span>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', border: '2px solid #CC2949', borderRadius: '6px', padding: '16px' }}>
              {opcoesDoacao.map(opcao => {
                const checked = tiposDoacao.includes(opcao);
                return (
                  <label key={opcao} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '16px', fontWeight: checked ? 600 : 400, color: checked ? '#CC2949' : '#333', transition: 'color 0.2s' }}>
                    <input 
                      type="checkbox" 
                      value={opcao}
                      checked={checked}
                      onChange={() => handleCheckboxChange(opcao)}
                      style={{ accentColor: '#CC2949', width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    {opcao}
                  </label>
                );
              })}
            </div>
          </div>

          <button 
            type="submit" 
            disabled={enviando || (enderecoValido && !coordenadas)}
            style={{ 
              backgroundColor: '#CC2949', 
              opacity: (enviando || (enderecoValido && !coordenadas)) ? 0.6 : 1,
              color: '#fff', border: 'none', padding: '14px', borderRadius: '6px', cursor: 'pointer', fontSize: '16px', fontWeight: 700, letterSpacing: '0.5px', marginTop: '10px', boxShadow: '0 4px 12px rgba(204, 41, 73, 0.2)' 
            }}
          >
            {enviando ? "SALVANDO..." : "CONFIRMAR CADASTRO"}
          </button>

        </form>
      </div>
    </main>
  );
}