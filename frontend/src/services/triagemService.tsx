import api from "./api";
import { Doacao } from "../context/DoacaoContext";

// ENUMS (simplificado)
export type StatusDoacao =
  | "AGUARDANDO_TRIAGEM"
  | "AGUARDANDO_NOVA_TRIAGEM"
  | "PRE_APROVADO"
  | "INAPTO"
  | "DISPONIVEL"
  | "MATERIAL_COLETADO"
  | "CANCELADO"
  | "INCOMPLETO";

export type ResultadoTriagem = "PRE_APROVADO" | "INAPTO";

// Triagem
export type CriarTriagemEnvio = {
  resultado: ResultadoTriagem;
  checklist?: Record<string, any>;
  comentario?: string;
  motivo_inaptidao?: string;
  em_quarentena: boolean;
};

export type AvaliacaoTriagem = {
  id: number;
  resultado: string;
  created_at: string;
  comentario?: string;
  motivo_inaptidao?: string;
  voluntario_triagem_id: number;
  voluntario_triagem?: {
    nome_completo: string;
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
export async function obterDoacao(id: number): Promise<{ data: Doacao }> {
  const resposta = await api.get(`/doacoes/${id}`);
  return resposta;
}
// atualizar status do material
export async function atualizarStatusDoacao(itemId: number, dados: { status: StatusDoacao; motivo_inaptidao?: string }) {
  return api.patch(`/doacoes/itens/${itemId}/status`, dados);
}

// criar avaliação de triagem
export async function criarTriagem(itemId: number, dados: CriarTriagemEnvio) {
  return api.post(`/doacoes/itens/${itemId}/avaliacoes`, dados);
}

// obter avaliações de triagem de um item 
export async function obterAvaliacoes(itemId: number) {
  return api.get(`/doacoes/itens/${itemId}/avaliacoes`); 
}

// obter status de uma doação
export async function obterStatusDoacao(itemId: number) {
  return api.get(`/doacoes/itens/${itemId}/status`);
}

// listar análises por voluntário (pega todas as avaliações de triagem feitas por um voluntário e as informações da doação e item relacionados para cada avaliação) 
// ([obterAvalicaçoes + ObterDoacao] com filtro por voluntário e depois juntar as informações)
export async function obterAnalisesPorVoluntario(voluntarioId: number) {
  return api.get(`/doacoes/voluntarios/${voluntarioId}/analises`);
}

// listar análises em quarentena (Isso seria utilizado, somente se a auditoria fosse feita somente voluntários em quarentena. 
// Se a auditoria for feita para todas as triagens, independente do tempo, então não precisa dessa rota específica)
export async function obterAnalisesQuarentena() {
  return api.get(`/doacoes/analises/em-quarentena`);
}

// fazer a auditoria de uma triagem de um voluntário em quarentena
export async function respostaAuditoriaTriagem(analiseId: number, dados: {resultado_validado: boolean; comentario_coordenador?: string;}) {
  return api.put(`/doacoes/analises/${analiseId}`, dados);
}