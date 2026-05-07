import { TokenLink } from "../services/usuarioService";

export function useFiltroLinks(
  links: TokenLink[],
  busca: string,
  ordem: "novo" | "antigo"
) {
  return [...links]

    .filter((link) =>
      link.link.toLowerCase().includes(busca.toLowerCase())
    )

  .sort((a, b) => {
    const dataA = a.data_criacao ? Date.parse(a.data_criacao) : 0;
    const dataB = b.data_criacao ? Date.parse(b.data_criacao) : 0;

    return ordem === "novo"
      ? dataB - dataA // mais recente primeiro
      : dataA - dataB; // mais antigo primeiro
  });
}