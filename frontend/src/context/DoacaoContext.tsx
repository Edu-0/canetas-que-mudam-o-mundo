import { createContext, useContext, useState, ReactNode } from "react";

// Tipos baseados no backend
export type FotoItem = {
  id: number;
  url: string;
};

export type ItemDoacao = {
  id: number;
  tipo_material: string;
  descricao: string;
  quantidade: number;
  status: string;
  motivo_inaptidao?: string;
  fotos: FotoItem[];
};

export type Doacao = {
  id: number;
  ong_id: number;
  status: string;
  observacao_doador?: string;
  itens: ItemDoacao[];

  created_at: string;
  updated_at?: string;
};

// contexto
type ContextoDoacao = {
  doacoes: Doacao[];
  setDoacoes: (d: Doacao[]) => void;

  selecionarDoacao: (d: Doacao | null) => void;
  doacaoSelecionada: Doacao | null;
};

// criação
const ContextoDoacao = createContext<ContextoDoacao | undefined>(undefined);

// provider
export function ProvedorDoacao({ children }: { children: ReactNode }) {
  const [doacoes, setDoacoes] = useState<Doacao[]>([]);
  const [doacaoSelecionada, setDoacaoSelecionada] = useState<Doacao | null>(null);

  function selecionarDoacao(d: Doacao | null) {
    setDoacaoSelecionada(d);
  }

  return (
    <ContextoDoacao.Provider value={{doacoes, setDoacoes, selecionarDoacao, doacaoSelecionada, }}>
      {children}
    </ContextoDoacao.Provider>
  );
}

// hook
export function useDoacao() {
  const context = useContext(ContextoDoacao);

  if (!context) {
    throw new Error("useDoacao deve ser usado dentro do ProvedorDoacao");
  }

  return context;
}