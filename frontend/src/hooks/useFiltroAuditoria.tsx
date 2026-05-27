type StatusAvaliacao = "todos" | "PRE_APROVADO" | "INAPTO";
type StatusFiltro = "todos" | "PRE_APROVADO" | "INAPTO" | "INCOMPLETO" | "EM_QUARENTENA";

function extrairData(data: string) {
  return data.split(" ")[0]; // pega só YYYY-MM-DD
}

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

  // data 
  if (datas.dataInicio) {
    const dataInicio = new Date(datas.dataInicio);
    dataInicio.setHours(0, 0, 0, 0); // início do dia

    filtradas = filtradas.filter(
      (a) => extrairData(a.created_at) >= datas.dataInicio!
    );
  }

  if (datas.dataFim) {
    const dataFim = new Date(datas.dataFim);
    dataFim.setHours(23, 59, 59, 999); // final do dia

    filtradas = filtradas.filter(
      (a) => extrairData(a.created_at) <= datas.dataFim!
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