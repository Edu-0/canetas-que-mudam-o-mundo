import api from "./api";
import { DoacaoContextType } from "../context/DoacaoContext";

// ENUMS (simplificado)
export type StatusDoacao =
  | "AGUARDANDO_TRIAGEM"
  | "AGUARDANDO_NOVA_TRIAGEM"
  | "PRE_APROVADO"
  | "INAPTO"
  | "DISPONIVEL"
  | "MATERIAL_COLETADO"
  | "CANCELADO"
  | "INCOMPLETO"
  | "EM_QUARENTENA";

export type ResultadoTriagem = "PRE_APROVADO" | "INAPTO" | "AGUARDANDO_NOVA_TRIAGEM" | "EM_QUARENTENA";

// Triagem
export type CriarTriagemEnvio = {
  resultado: ResultadoTriagem;
  checklist?: Record<string, boolean>;
  comentario?: string;
  motivo_inaptidao?: string;
}; 

export type AvaliacaoTriagem = {
  id: number;
  resultado: ResultadoTriagem;
  created_at: string;
  comentario?: string;
  motivo_inaptidao?: string;
  voluntario_triagem_id: number;
  voluntario_triagem?: {
    nome_completo: string;
  };
  checklist?: Record<string, boolean>;

  em_quarentena?: boolean; // se o voluntário estava em quarentena no momento da triagem
}

// Padrão da auditoria
export type AnaliseQuarentena = {
  id: number;
  resultado: ResultadoTriagem; // resultado da triagem feita pelo voluntário
  comentario?: string;
  checklist?: Record<string, boolean>; // so para poder visualizar se o voluntário marcou os itens do checklist ou não
  em_quarentena: boolean;
  created_at: string;
  updated_at?: string;
  motivo_inaptidao?: string; // motivo de inaptidão indicado pelo voluntário, se houver

  voluntario_triagem: {
    nome_completo: string;
    nivel_confianca: number;
  };

  item_doacao: {
    id: number;
    tipo_material: string;
    descricao: string;
    quantidade: number;
    possiveis_defeitos?: string;
    status: StatusDoacao; // status do item de doação no momento da triagem
    motivo_inaptidao?: string; // motivo de inaptidão do item

    doacao: {
      id: number;
      observacao_doador?: string; 
      status: StatusDoacao; // status da doação no momento da triagem

      created_at: string;
      updated_at?: string;
    };

    fotos: {
      id: number; 
      url: string;
    }[];
  };
};

// listar todas as doações da ONG
export async function obterDoacoes(params: {data_inicio?: string; data_final?: string; status?: string; ordem: "asc" | "desc";}) {
  const ordemBackend = params.ordem === "asc" ? "asc" : "desc";

  return api.get("/doacoes/", {
    params: {
      data_inicio: params.data_inicio,
      data_final: params.data_final,
      status: params.status,
      ordem: ordemBackend,
    },
  });
}

// obter uma doação específica
export async function obterDoacao(id: number): Promise<{ data: DoacaoContextType }> {
  const resposta = await api.get(`/doacoes/${id}`);
  return resposta;
}
// atualizar status do material
export async function atualizarStatusDoacao(itemId: number, dados: { status: StatusDoacao; motivo_inaptidao?: string }) {
  return api.patch(`/doacoes/itens/${itemId}/status`, dados);
}

// criar avaliação de triagem
export async function criarTriagem(itemId: number, dados: CriarTriagemEnvio) {
  try {
    const res = await api.post(`/doacoes/itens/${itemId}/avaliacoes`, dados);
    console.log("Triagem criada com sucesso!", dados);
    return res;
  } catch (error) {
    console.error("Erro ao criar triagem:", error);
    throw error;
  }
}

// obter avaliações de triagem de um item 
export async function obterAvaliacoes(itemId: number) {
  return api.get(`/doacoes/itens/${itemId}/avaliacoes`); 
}

// obter status de uma doação
export async function obterStatusDoacao(itemId: number) {
  return api.get(`/doacoes/itens/${itemId}/status`);
}


// Auditoria das triagens dos voluntários

// listar análises por voluntário (pega todas as avaliações de triagem feitas por um voluntário e as informações da doação e item relacionados para cada avaliação) 
// ([obterAvalicaçoes + ObterDoacao] com filtro por voluntário e depois juntar as informações)
// export async function obterAnalisesPorVoluntario(voluntarioId: number) {
//   return api.get(`/doacoes/analises/${voluntarioId}`);
// }

// listar análises em quarentena (pega todas as avaliações de triagem que estão em quarentena, ou seja, que o resultado do voluntário foi "PRE_APROVADO" mas o coordenador ainda não validou, ou seja, ainda não concordou nem discordou do resultado do voluntário)
export async function obterAnalisesQuarentena() {
  return api.get(`/doacoes/analises/em-quarentena`);
}

// Para concordar ou discordar da avaliação de triagem feita por um voluntário
export async function respostaAuditoriaTriagem(analiseId: number, dados: {resultado_validado: boolean; comentario_coordenador?: string;}) {
  return api.put(`/doacoes/analises/${analiseId}`, dados);
}