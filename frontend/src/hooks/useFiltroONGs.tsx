import { ONG } from "../context/OngContext";

function limparCNPJ(valor: string) {
  return valor.replace(/\D/g, ""); 
}

export function useFiltroONGs(
  ongs: ONG[], // array de ONGs a filtrar
  busca: string,
  ordem: "nome-asc" | "nome-desc"
) {

  const buscaNormalizada = limparCNPJ(busca.toLowerCase());

  return ongs
    // filtro por nome e CNPJ
    .filter(o => {
      const nomeMatch = o.nome.toLowerCase().includes(busca.toLowerCase());

      const cnpjLimpo = limparCNPJ(o.cnpj);
      const cnpjMatch = cnpjLimpo.includes(buscaNormalizada);

      return nomeMatch || cnpjMatch;
    })

    // ordenação
    .sort((a, b) => {
      if (ordem === "nome-asc") {
        return a.nome.localeCompare(b.nome);
      }
      return b.nome.localeCompare(a.nome);
    });
}