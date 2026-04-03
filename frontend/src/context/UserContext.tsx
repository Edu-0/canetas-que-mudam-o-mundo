import { createContext, useContext, useState, ReactNode } from "react";

// tipo do usuário
type TipoUsuario = "generico" | "doador" | "voluntario" | "responsavel";

export type Usuario = {
  email: string;
  tipo?: TipoUsuario;
};

// o que o contexto fornece
type ContextoUsuario = {
  usuario: Usuario | null;
  definirUsuario: (usuario: Usuario | null) => void;
};

// cria o contexto
const ContextoUsuario = createContext<ContextoUsuario | undefined>(undefined);

// provider
export function ProvedorUsuario({ children }: { children: ReactNode }) {
  const [usuario, definirUsuario] = useState<Usuario | null>(null);

  return (
    <ContextoUsuario.Provider value={{ usuario, definirUsuario }}>
      {children}
    </ContextoUsuario.Provider>
  );
}

// hook
export function useUsuario() {
  const contexto = useContext(ContextoUsuario);

  if (!contexto) {
    throw new Error("useUsuario deve ser usado dentro de ProvedorUsuario");
  }

  return contexto;
}