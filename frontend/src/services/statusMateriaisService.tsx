import api from "./api";

export type TipoItem = "DOACAO" | "PEDIDO";

export type StatusMaterial =
    | "PRE_APROVADO"
    | "AGUARDANDO_RETIRADA"
    | "DISPONIVEL"
    | "MATERIAL_COLETADO"
    | "CANCELADO";

export type ItemUnificado = {
  id: number;
  origem: TipoItem;
  codigo_coleta?: string;
  status: StatusMaterial;
  created_at: string;
  updated_at: string;
  prazo_retirada_limite?: string; // o prazo de retirada
  itens: any[];
  
  doador_nome?: string; // para pegar o nome do doador
  responsavel_nome?: string; // para pegar o nome do responsável pelo pedido
};

// Para listar os itens de doações e pedidos que estão com status "PRE_APROVADO" ou "AGUARDANDO_RETIRADA" (ou seja, que estão pendentes de coleta ou retirada)
export async function obterPendencias(ordem: "asc" | "desc") {
  return api.get("/ong/minha-ong/pendencias", {params: { ordem },});
}

// Atualiza o status do material
export async function atualizarStatusPedido(itemId: number, status: StatusMaterial) {
  return api.patch(`/pedidos/itens/${itemId}/status`, { status });
}

// Atualiza o status do material de uma doação
export async function atualizarStatusDoacao(itemId: number, status: StatusMaterial, motivo_inaptidao?: string) {
  return api.patch(`/doacoes/itens/${itemId}/status`, { status, motivo_inaptidao });
}