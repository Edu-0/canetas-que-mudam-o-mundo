import { createContext, useContext, useState, ReactNode } from "react";

// Tipo da ONG
export type ONG = {
  id: number;
  nome: string;
  cnpj: string;
  cep?: string;
  rua: string;
  bairro: string;
  cidade: string;
  estado: string;
  numero?: string;
  complemento?: string;
  telefone: string;
  email: string;
  diasFuncionamento: number[];
  horarioInicio: string;
  horarioFim: string;
  sobre: string;
  instagram?: string;
  facebook?: string;
  site?: string;
};

// o que o contexto fornece
type ContextoONG = {
  ong: ONG | null;
  definirONG: (ong: ONG | null) => void;
};

// cria o contexto
const ContextoONG = createContext<ContextoONG | undefined>(undefined);

// provider
export function ProvedorONG({ children }: { children: ReactNode }) {

  // pega do localStorage ao iniciar
  const [ong, setOng] = useState<ONG | null>(() => {
    const salvo = localStorage.getItem("ong");

    if (!salvo) return null;

    try {
      return JSON.parse(salvo);
    } catch {
      localStorage.removeItem("ong");
      return null;
    }
  });

  // função para salvar
  function definirONG(ong: ONG | null) {
    setOng(ong);

    if (ong) {
      localStorage.setItem("ong", JSON.stringify(ong));
    } else {
      localStorage.removeItem("ong");
      localStorage.removeItem("access_token");
      localStorage.removeItem("token_type");
    }
  }

  return (
    <ContextoONG.Provider value={{ ong, definirONG }}>
      {children}                
    </ContextoONG.Provider>
  );
}

// hook
export function useONG() {
  const contexto = useContext(ContextoONG);

  if (!contexto) {
    throw new Error("useONG deve ser usado dentro de ProvedorONG");
  }

  return contexto;
}