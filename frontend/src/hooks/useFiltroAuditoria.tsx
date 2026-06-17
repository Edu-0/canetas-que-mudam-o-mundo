type StatusAvaliacao = "todos" | "PRE_APROVADO" | "INAPTO";
type StatusFiltro = "todos" | "PRE_APROVADO" | "INAPTO" | "INCOMPLETO" | "EM_QUARENTENA";

function converterDataParaTimestamp(data: string, fimDoDia = false) {
  const dataParte = data.trim().slice(0, 10);
  const [ano, mes, dia] = dataParte.split("-").map(Number);

  const dataNormalizada = new Date(ano, mes - 1, dia);

  if (fimDoDia) {
    dataNormalizada.setHours(23, 59, 59, 999);
  } else {
    dataNormalizada.setHours(0, 0, 0, 0);
  }

  return dataNormalizada.getTime();
}

function converterFiltroParaTimestamp(data: string, fimDoDia = false) {
  const [ano, mes, dia] = data.split("-").map(Number);
  const dataNormalizada = new Date(ano, mes - 1, dia);

  if (fimDoDia) {
    dataNormalizada.setHours(23, 59, 59, 999);
  } else {
    dataNormalizada.setHours(0, 0, 0, 0);
  }

  return dataNormalizada.getTime();
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
    const dataInicio = converterFiltroParaTimestamp(datas.dataInicio);

    filtradas = filtradas.filter(
      (a) => converterDataParaTimestamp(a.created_at) >= dataInicio
    );
  }

  if (datas.dataFim) {
    const dataFim = converterFiltroParaTimestamp(datas.dataFim, true);

    filtradas = filtradas.filter(
      (a) => converterDataParaTimestamp(a.created_at) <= dataFim
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