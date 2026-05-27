type StatusAvaliacao = "todos" | "PRE_APROVADO" | "INAPTO";
type StatusFiltro = "todos" | "PRE_APROVADO" | "INAPTO" | "INCOMPLETO" | "EM_QUARENTENA";

export function useFiltroAuditoria(
  analises: any[],
  avaliacao: StatusAvaliacao,
  status: StatusFiltro,
  datas: { dataInicio?: string; dataFim?: string },
  ordem: "asc" | "desc"
) {
  let filtradas = [...analises];

  // status da triagem (resultado)
  if (avaliacao !== "todos") {
    filtradas = filtradas.filter(
      (a) => a.resultado === avaliacao
    );
  }

  // status da doação
  if (status !== "todos") {
    filtradas = filtradas.filter(
      (a) => a.item_doacao?.doacao?.status === status
    );
  }

  // data (você precisa decidir qual usar)
  if (datas.dataInicio) {
    filtradas = filtradas.filter(
      (a) => new Date(a.created_at) >= new Date(datas.dataInicio!)
    );
  }

  if (datas.dataFim) {
    filtradas = filtradas.filter(
      (a) => new Date(a.created_at) <= new Date(datas.dataFim!)
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