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
  data_edicao_conta?: string;
};

// o que o contexto fornece
type ContextoUsuarioType = {
  usuario: Usuario | null;
  definirUsuario: (usuario: Usuario | null) => void;
  acabouDeAutenticar: boolean;            
  setAcabouDeAutenticar: (v: boolean) => void; 
};

// cria o contexto
const ContextoUsuario = createContext<ContextoUsuarioType | undefined>(undefined);

// função para mapear string do backend para TipoUsuario, garantindo que seja um valor válido
export function mapearTipo(tipo?: string): TipoUsuario {
  const tiposValidos: TipoUsuario[] = [
    "Genérico",
    "Coordenador de Processos",
    "Responsável pelo beneficiário",
    "Doador",
    "Voluntário da triagem"
  ];

  if (tiposValidos.includes(tipo as TipoUsuario)) {
    return tipo as TipoUsuario;
  }

  return "Genérico";
}

export const BeneficiosUsuario = {
  BOLSA_FAMILIA: "Bolsa Família",
  BPC: "Benefício de Prestação Continuada",
  APOSENTADORIA: "Aposentadoria",
  NENHUM: "Nenhum",
} as const;

export type TipoBeneficio = keyof typeof BeneficiosUsuario;

function normalizarTiposUsuario(tipos?: TipoUsuario[]) {
  const tiposNormalizados = tipos ? [...new Set(tipos)] : [];

  if (!tiposNormalizados.includes("Genérico")) {
    tiposNormalizados.unshift("Genérico");
  }

  return tiposNormalizados;
}

// provider
export function ProvedorUsuario({ children }: { children: ReactNode }) {

  // pega do localStorage ao iniciar
  const [usuario, setUsuario] = useState<Usuario | null>(() => {
    const salvo = localStorage.getItem("usuario");

    if (!salvo) return null;

    try {
      const usuarioSalvo = JSON.parse(salvo);

      return {
        ...usuarioSalvo,
        tipos: normalizarTiposUsuario(usuarioSalvo.tipos),
      };
    } catch {
      localStorage.removeItem("usuario");
      return null;
    }
  });

  const [acabouDeAutenticar, setAcabouDeAutenticar] = useState(false);

  // função para salvar
  function definirUsuario(usuario: Usuario | null) {
    const usuarioNormalizado = usuario
      ? {
          ...usuario,
          tipos: normalizarTiposUsuario(usuario.tipos),
        }
      : null;

    setUsuario(usuarioNormalizado);

    if (usuarioNormalizado) {
      localStorage.setItem("usuario", JSON.stringify(usuarioNormalizado));
    } else {
      localStorage.removeItem("usuario");
      localStorage.removeItem("access_token");
      localStorage.removeItem("token_type");
    }
  }

  return (
    <ContextoUsuario.Provider value={{ usuario, definirUsuario, acabouDeAutenticar, setAcabouDeAutenticar }}>
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