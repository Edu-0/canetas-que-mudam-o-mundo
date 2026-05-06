import { ONG } from "../context/OngContext";

function limparCNPJ(valor: string) {
  return valor.replace(/\D/g, ""); 
}

export function useFiltroONGs(
  ongs: ONG[], // array de ONGs a filtrar
  busca: string,
  estadoSelecionado: string,
  ordem: "nome-asc" | "nome-desc"
) {

  const buscaTexto = busca.toLowerCase();
  const buscaCNPJ = limparCNPJ(busca);

  return ongs
    // filtro por nome e CNPJ
    .filter(o => {
      const nomeMatch = o.nome.toLowerCase().includes(buscaTexto);

      const cnpjLimpo = limparCNPJ(o.cnpj);
      const cnpjMatch = cnpjLimpo.includes(buscaCNPJ);

      const estadoMatch = !estadoSelecionado || o.estado === estadoSelecionado;

      return (nomeMatch || cnpjMatch) && estadoMatch;
    })

    // ordenação
    .sort((a, b) => {
      if (ordem === "nome-asc") {
        return a.nome.localeCompare(b.nome);
      }
      return b.nome.localeCompare(a.nome);
    });
}