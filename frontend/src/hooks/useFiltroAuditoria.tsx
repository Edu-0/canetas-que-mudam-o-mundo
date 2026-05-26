type StatusAvaliacao = "todos" | "PRE_APROVADO" | "INAPTO";
type StatusFiltro = "todos" | "PRE_APROVADO" | "INAPTO" | "INCOMPLETO";

export function useFiltroAuditoria(
  doacoes: any[],
  avaliacao: StatusAvaliacao,
  status: StatusFiltro,
  datas: { dataInicio?: string; dataFim?: string },
  ordem: "asc" | "desc"
) {
  let filtradas = [...doacoes];

  // filtro por status da triagem
  if (avaliacao !== "todos") {
    filtradas = filtradas.filter(
      (d) => d.resultado_triagem === avaliacao
    );
  }

  // filtro por status da doação
  if (status !== "todos") {
    filtradas = filtradas.filter(
      (d) => d.status === status
    );
  }

  // filtro por data
  if (datas.dataInicio) {
    filtradas = filtradas.filter(
      (d) => new Date(d.created_at) >= new Date(datas.dataInicio!)
    );
  }

  if (datas.dataFim) {
    filtradas = filtradas.filter(
      (d) => new Date(d.created_at) <= new Date(datas.dataFim!)
    );
  }

  // ordenação
  filtradas.sort((a, b) => {
    const dataA = new Date(a.created_at).getTime();
    const dataB = new Date(b.created_at).getTime();

    return ordem === "desc" ? dataB - dataA : dataA - dataB;
  });

  return filtradas;
}