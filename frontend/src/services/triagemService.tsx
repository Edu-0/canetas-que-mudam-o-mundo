import api from "./api";

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
export async function obterDoacao(id: number) {
  return api.get(`/doacoes/${id}`);
}

// atualizar status do material
export async function atualizarStatusDoacao(itemId: number, dados: { status: StatusDoacao; motivo_inaptidao?: string }) {
  return api.patch(`/doacoes/itens/${itemId}/status`, dados);
}

// criar avaliação de triagem
export async function criarTriagem(itemId: number, dados: CriarTriagemEnvio) {
  return api.post(`/doacoes/itens/${itemId}/avaliacoes`, dados);
}

// obter avaliações de triagem de um item [Não tem no backend, mas pode ser útil para mostrar histórico de avaliações na página da triagem da doação]
export async function obterAvaliacoes(itemId: number) {
  return api.get(`/doacoes/itens/${itemId}/avaliacoes`); 
}

// obter status de uma doação
export async function obterStatusDoacao(itemId: number) {
  return api.get(`/doacoes/itens/${itemId}/status`);
}