"use client";

import dynamic from "next/dynamic";

// Importa o formulário desativando o Server-Side Rendering (SSR)
const FormularioCadastroDinamico = dynamic(
  () => import("./CadastrarComercioPage"),
  { ssr: false }
);

export default function CadastrarComercioPage() {
  return <FormularioCadastroDinamico />;
}