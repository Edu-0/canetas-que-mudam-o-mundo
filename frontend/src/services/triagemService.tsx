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

export type ResultadoTriagem = "PRE_APROVAD" | "INAPTO";

// Triagem
export type CriarTriagemEnvio = {
  resultado: ResultadoTriagem;
  checklist?: Record<string, any>;
  comentario?: string;
  motivo_inaptidao?: string;
  em_quarentena: boolean;
};


// listar todas as doações da ONG
export async function obterDoacoes(p0: { data_inicio: string | undefined; data_final: string | undefined; status: string | undefined; ordem: "data-asc" | "data-desc"; }) {
  return api.get("/doacoes");
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