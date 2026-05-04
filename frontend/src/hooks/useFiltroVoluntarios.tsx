import { DadosUsuario } from "../services/usuarioService";

type PeriodoFiltro = | "todos" | "0-1" | "2-3" | "4-5" | "6-7" | "8-9" | "10-11" | "12" | "24" | "25+";

export function useFiltroVoluntarios(
  voluntarios: DadosUsuario[],
  buscaNome: string,
  periodo: PeriodoFiltro,
  ordem: "nome-asc" | "nome-desc" | "data-asc" | "data-desc",
) {
  function calcularMeses(data?: string) {
    if (!data) return 0;

    const inicio = new Date(data);
    const hoje = new Date();

    let meses =
      (hoje.getFullYear() - inicio.getFullYear()) * 12 +
      (hoje.getMonth() - inicio.getMonth());

    if (hoje.getDate() < inicio.getDate()) {
      meses--;
    }

    return Math.max(meses, 0);
  }

  function filtrarPorPeriodo(meses: number) {
    switch (periodo) {
      case "0-1":
        return meses <= 1;

      case "2-3":
        return meses >= 2 && meses <= 3;

      case "4-5":
        return meses >= 4 && meses <= 5;

      case "6-7":
        return meses >= 6 && meses <= 7;

      case "8-9":
        return meses >= 8 && meses <= 9;

      case "10-11":
        return meses >= 10 && meses <= 11;

      case "12":
        return meses >= 12 && meses < 24;

      case "24":
        return meses >= 24 && meses < 36;

      case "25+":
        return meses >= 36;

      default:
        return true;
    }
  }

  return voluntarios
    // busca por nome
    .filter(v =>
      v.nome_completo.toLowerCase().includes(buscaNome.toLowerCase())
    )

    // período
    .filter(v => filtrarPorPeriodo(calcularMeses(v.data_cadastro)))

    // ordem
    .sort((a, b) => {
      if (ordem === "nome-asc") {
        return a.nome_completo.localeCompare(b.nome_completo);
      }

      if (ordem === "nome-desc") {
        return b.nome_completo.localeCompare(a.nome_completo);
      }

      // ordenação por data
      const dataA = a.data_cadastro ? new Date(a.data_cadastro).getTime() : 0;
      const dataB = b.data_cadastro ? new Date(b.data_cadastro).getTime() : 0;

      if (ordem === "data-asc") {
        return dataA - dataB; // mais antigos primeiro
      }

      if (ordem === "data-desc") {
        return dataB - dataA; // mais novos primeiro
      }

      return 0;
    });
}