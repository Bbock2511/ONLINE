import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 20px',
  backgroundColor: '#CC2949', // cor suave que transmite empatia
  color: '#fff',
  height: '10%',
  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
};

const titleStyle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 600,
};

const buttonStyle: React.CSSProperties = {
  backgroundColor: '#ff0033',
  color: '#fff',
  border: 'none',
  padding: '8px 14px',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: '14px',
};

import logo from '../assets/online-logo.png';

export default function Header() {
  return (
    <header style={headerStyle}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Image
          src={logo}
          alt="Logo ONLINE"
          width={60}     
          style={{ marginRight: 12, borderRadius: 6 }}
        />
        <div style={titleStyle}>ONLINE</div>
      </div>
      <div>
        <Link href="/cadastrar-comercio" passHref>
          <button style={buttonStyle} type="button">
            Cadastrar ponto de coleta
          </button>
        </Link>
      </div>
    </header>
  );
}
