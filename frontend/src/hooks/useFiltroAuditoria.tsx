type StatusAvaliacao = "todos" | "PRE_APROVADO" | "INAPTO";
type StatusFiltro = "todos" | "PRE_APROVADO" | "INAPTO" | "INCOMPLETO";

export function useFiltroAuditoria(
  doacoes: any[],
  avaliacao: StatusAvaliacao,
  status: StatusFiltro,
  ordem: "asc" | "desc"
) {
  const filtradas =
    avaliacao === "todos"
      ? doacoes
      : doacoes.filter((d) => d.resultado_triagem === avaliacao);

    status === "todos"
      ? doacoes
      : doacoes.filter((d) => d.status === status);

  const ordenadas = [...filtradas].sort((a, b) => {
    const dataA = new Date(a.created_at).getTime();
    const dataB = new Date(b.created_at).getTime();

    return ordem === "desc" ? dataB - dataA : dataA - dataB;
  });

  return ordenadas;
}