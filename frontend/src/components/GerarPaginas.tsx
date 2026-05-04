export default function gerarPaginas(paginaAtual: number, totalPaginas: number) {
  const paginas: (number | "...")[] = [];

  const delta = 1; // quantos lados mostrar

  const inicio = Math.max(2, paginaAtual - delta);
  const fim = Math.min(totalPaginas - 1, paginaAtual + delta);

  paginas.push(1);

  if (inicio > 2) {
    paginas.push("...");
  }

  for (let i = inicio; i <= fim; i++) {
    paginas.push(i);
  }

  if (fim < totalPaginas - 1) {
    paginas.push("...");
  }

  if (totalPaginas > 1) {
    paginas.push(totalPaginas);
  }

  return paginas;
}