import { createContext, useContext, useState, ReactNode } from "react";

// tipo do usuário
export type TipoUsuario = 
  | "Genérico"
  | "Coordenador de Processos"
  | "Responsável pelo beneficiário"
  | "Doador"
  | "Voluntário da triagem";

export type Usuario = {
  id: number;
  nome_completo: string;
  data_nascimento: string;
  cpf: string;
  cep: string;
  telefone?: string;
  email: string;
  tipos?: TipoUsuario[];
  data_cadastro: string;
};

// o que o contexto fornece
type ContextoUsuarioType = {
  usuario: Usuario | null;
  definirUsuario: (usuario: Usuario | null) => void;
};

// cria o contexto
const ContextoUsuario = createContext<ContextoUsuarioType | undefined>(undefined);

// provider
export function ProvedorUsuario({ children }: { children: ReactNode }) {

  // pega do localStorage ao iniciar
  const [usuario, setUsuario] = useState<Usuario | null>(() => {
    const salvo = localStorage.getItem("usuario");

    if (!salvo) return null;

    try {
      return JSON.parse(salvo);
    } catch {
      localStorage.removeItem("usuario");
      return null;
    }
  });

  // função para salvar
  function definirUsuario(usuario: Usuario | null) {
    setUsuario(usuario);

    if (usuario) {
      localStorage.setItem("usuario", JSON.stringify(usuario));
    } else {
      localStorage.removeItem("usuario");
    }
  }

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