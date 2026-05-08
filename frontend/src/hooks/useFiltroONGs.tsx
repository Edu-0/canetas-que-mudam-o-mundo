import { ONG } from "../context/OngContext";

function limparCNPJ(valor: string) {
  return valor.replace(/\D/g, ""); 
}

function normalizarTexto(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD") // separa acentos
    .replace(/[\u0300-\u036f]/g, ""); // remove acentos
}

export function useFiltroONGs(
  ongs: ONG[], // array de ONGs a filtrar
  busca: string,
  estadoSelecionado: string,
  ordem: "nome-asc" | "nome-desc"
) {

  const buscaTexto = normalizarTexto(busca.trim());
  const buscaCNPJ = limparCNPJ(busca);

  return ongs
    // filtro por nome e CNPJ
    .filter(o => {
      const nomeNormalizado = normalizarTexto(o.nome);
      const cnpjLimpo = limparCNPJ(o.cnpj);

      const nomeMatch = nomeNormalizado.includes(buscaTexto);
      const cnpjMatch = cnpjLimpo.includes(buscaCNPJ);

      const estadoMatch = !estadoSelecionado || o.estado === estadoSelecionado;

      const temNumeroNaBusca = buscaCNPJ.length > 0;

      return ((nomeMatch || (temNumeroNaBusca && cnpjMatch)) && estadoMatch);
    })

    // ordenação
    .sort((a, b) => {
      if (ordem === "nome-asc") {
        return a.nome.localeCompare(b.nome);
      }
      return b.nome.localeCompare(a.nome);
    });
}