import { TokenLink } from "../services/usuarioService";

export function useFiltroLinks(
  links: TokenLink[],
  busca: string,
  ordem: "novo" | "antigo",
  status: "todos" | "ativos" | "desativados"
) {
  return [...links]

    .filter((link) => {
      if (status === "ativos") {
        return link.ativo !== false;
      }

      if (status === "desativados") {
        return link.ativo === false;
      }

      return true;
    })

    .filter((link) =>
      link.link.toLowerCase().includes(busca.toLowerCase())
    )

    .sort((a, b) => {
      const dataA = new Date(a.data_criacao ?? 0).getTime();
      const dataB = new Date(b.data_criacao ?? 0).getTime();

      if (ordem === "novo") {
        return dataB - dataA; 
      }

      return dataA - dataB;
    });
}