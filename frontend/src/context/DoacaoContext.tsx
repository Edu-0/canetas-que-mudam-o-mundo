import { createContext, useContext, useState, ReactNode } from "react";
import type { Doacao } from "../services/doacaoService";

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
    <ContextoDoacao.Provider
      value={{ doacoes, setDoacoes, selecionarDoacao, doacaoSelecionada }}
    >
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