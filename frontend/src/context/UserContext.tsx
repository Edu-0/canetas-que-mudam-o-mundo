import { createContext, useContext, useState, ReactNode } from "react";

// tipo do usuário
type TipoUsuario = "generico" | "doador" | "voluntario" | "responsavel";

export type Usuario = {
  nome: string;
  dataNascimento: string;
  cpf: string;
  cep: string;
  telefone: string;
  email: string;
  tipo?: TipoUsuario;
  dataCadastro: string;
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