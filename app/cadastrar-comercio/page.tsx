"use client";

import React, { useState } from 'react';
import Link from 'next/link';

export default function CadastrarComercioPage() {
  const [nome, setNome] = useState('');
  const [endereco, setEndereco] = useState('');
  const [contato, setContato] = useState('');
  const [tiposDoacao, setTiposDoacao] = useState<string[]>([]);
  const [erroDoacao, setErroDoacao] = useState(false);

  const opcoesDoacao = [
    'Roupas e Cobertores', 
    'Alimentos Não Perecíveis', 
    'Água Potável', 
    'Produtos de Limpeza', 
    'Higiene Pessoal', 
    'Ração para Animais'
  ];

  const handleCheckboxChange = (opcao: string) => {
    setTiposDoacao(prev => {
      const novoArray = prev.includes(opcao) 
        ? prev.filter(item => item !== opcao) 
        : [...prev, opcao];
      
      // Se o usuário marcou pelo menos um, limpa o aviso de erro em tempo real
      if (novoArray.length > 0) setErroDoacao(false);
      
      return novoArray;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (tiposDoacao.length === 0) {
      setErroDoacao(true);
      return; // Interrompe o envio do formulário
    }

    // Se passou na validação, segue o fluxo normal
    setErroDoacao(false);

    // 1. Busca as coordenadas baseadas no input do usuário
    const coordenadas = await buscarCoordenadas(endereco);

    if (!coordenadas) {
        alert("Não conseguimos localizar esse endereço no mapa. Por favor, verifique os dados.");
        return;
    }

    // 2. Prepara o objeto final para salvar no Firestore
    const novoPontoColeta = {
        nome,
        endereco,
        tiposDoacao,
        lat: coordenadas.lat,
        lng: coordenadas.lng,
        criadoEm: new Date()
    };

    console.log("Pronto para o Supabase:", novoPontoColeta);
    // Aqui entraria o addDoc(collection(db, "pontos"), novoPontoColeta);
  };

    async function buscarCoordenadas(endereco: string) {
        // Codifica o endereço para formato de URL (substitui espaços por %20, etc.)
        const query = encodeURIComponent(endereco);
        
        // Filtrando a busca para o Brasil para ser mais preciso
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}&countrycodes=br&limit=1`;

        try {
            const response = await fetch(url, {
            headers: {
                // O Nominatim exige um User-Agent identificável para evitar abusos
                'User-Agent': 'OnlineAppUFSM (online-app@gmail.com)'
            }
            });
            
            const dados = await response.json();

            if (dados && dados.length > 0) {
            const lat = parseFloat(dados[0].lat);
            const lng = parseFloat(dados[0].lon);
            
            console.log(`Sucesso! Lat: ${lat}, Lng: ${lng}`);
            return { lat, lng };
            } else {
            console.warn("Nenhum resultado encontrado para este endereço.");
            return null;
            }
        } catch (error) {
            console.error("Erro na geocodificação:", error);
            return null;
        }
    }

    const formatarTelefone = (valor: string) => {
        // 1. Remove tudo o que não for número
        const apenasNumeros = valor.replace(/\D/g, "");

        // 2. Limita em 11 dígitos (DDD + 9 dígitos)
        const digitosLimitados = apenasNumeros.slice(0, 11);

        // 3. Aplica a máscara dinamicamente com base no tamanho do que foi digitado
        if (digitosLimitados.length <= 2) {
            return digitosLimitados.length > 0 ? `(${digitosLimitados}` : "";
        }
        if (digitosLimitados.length <= 6) {
            return `(${digitosLimitados.slice(0, 2)}) ${digitosLimitados.slice(2)}`;
        }
        return `(${digitosLimitados.slice(0, 2)}) ${digitosLimitados.slice(2, 7)}-${digitosLimitados.slice(7)}`;
    };

  return (
    <main style={{ 
      backgroundColor: '#fff', 
      minHeight: '100vh', 
      padding: '40px 20px',
      color: '#333',
      fontFamily: 'sans-serif'
    }}>
      <div style={{ maxWidth: '500px', margin: '0 auto' }}>
        
        {/* Botão de Voltar simples */}
        <Link href="/" style={{ 
          color: '#CC2949', 
          textDecoration: 'none', 
          fontSize: '14px', 
          fontWeight: 500,
          display: 'inline-block',
          marginBottom: '20px'
        }}>
          &larr; Voltar para o mapa
        </Link>

        <h1 style={{ 
          fontSize: '24px', 
          fontWeight: 700, 
          color: '#CC2949', 
          marginBottom: '8px' 
        }}>
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
              style={{ 
                width: '100%', 
                padding: '12px', 
                borderRadius: '6px', 
                border: '2px solid #CC2949', 
                outline: 'none',
                fontSize: '16px'
              }}
            />
          </div>

          {/* Campo Endereço */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#CC2949', fontSize: '14px' }}>
              ENDEREÇO COMPLETO
            </label>
            <input 
              type="text" 
              value={endereco} 
              onChange={(e) => setEndereco(e.target.value)}
              placeholder="Rua, Número, Bairro"
              required 
              style={{ 
                width: '100%', 
                padding: '12px', 
                borderRadius: '6px', 
                border: '2px solid #CC2949', 
                outline: 'none',
                fontSize: '16px'
              }}
            />
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
              style={{ 
                width: '100%', 
                padding: '12px', 
                borderRadius: '6px', 
                border: '2px solid #CC2949', 
                outline: 'none',
                fontSize: '16px'
              }}
            />
          </div>

          {/* Seção Multiselect (Checkboxes customizados) */}
          <div>
            <label style={{ display: 'block', marginBottom: '12px', fontWeight: 600, color: '#CC2949', fontSize: '14px' }}>
              O QUE ESSE PONTO ESTÁ ACEITANDO?
            </label>
            {erroDoacao && (
              <span style={{ display: 'block', color: '#ff0033', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
                ⚠️ Selecione pelo menos uma categoria de doação.
              </span>
            )}
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '10px',
              border: '2px solid #CC2949',
              borderRadius: '6px',
              padding: '16px'
            }}>
              {opcoesDoacao.map(opcao => {
                const checked = tiposDoacao.includes(opcao);
                return (
                  <label key={opcao} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: checked ? 600 : 400,
                    color: checked ? '#CC2949' : '#333',
                    transition: 'color 0.2s'
                  }}>
                    <input 
                      type="checkbox" 
                      value={opcao}
                      checked={checked}
                      onChange={() => handleCheckboxChange(opcao)}
                      style={{ 
                        accentColor: '#CC2949', 
                        width: '18px', 
                        height: '18px',
                        cursor: 'pointer'
                      }}
                    />
                    {opcao}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Botão de Envio */}
          <button 
            type="submit" 
            style={{ 
              backgroundColor: '#CC2949', 
              color: '#fff', 
              border: 'none', 
              padding: '14px', 
              borderRadius: '6px', 
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 700,
              letterSpacing: '0.5px',
              marginTop: '10px',
              boxShadow: '0 4px 12px rgba(204, 41, 73, 0.2)',
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            CONFIRMAR CADASTRO
          </button>

        </form>
      </div>
    </main>
  );
}