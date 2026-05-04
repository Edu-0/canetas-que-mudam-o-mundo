import Botao from "./Botao";
import gerarPaginas from "../components/GerarPaginas";

type Props = {
  paginaAtual: number;
  totalPaginas: number;
  setPagina: (n: number) => void;
};

export default function Paginacao({ paginaAtual, totalPaginas, setPagina }: Props) {

  const paginas = gerarPaginas(paginaAtual, totalPaginas);

  return (
    <div className="paginacao-container mt-6">

      {/* anterior */}
      <Botao variante="paginacao" aoClicar={() => setPagina(paginaAtual - 1)} desabilitado={paginaAtual === 1} className={`paginacao-nav ${paginaAtual === 1 ? "paginacao-desabilitado" : ""}`}>← Anterior</Botao>

      {/* números */}
      {paginas.map((p, index) => {
        if (p === "...") {
          return (
            <span key={index} className="px-2 body-semibold-pequeno">...</span>
          );
        }

        return (
          <Botao variante="paginacao" key={p} aoClicar={() => setPagina(p)} ativo={paginaAtual === p} className={`paginacao-item ${paginaAtual === p ? "paginacao-ativa" : ""}`}>{String(p).padStart(2, "0")}</Botao>
        );
      })}

      {/* próximo */}
      <Botao variante="paginacao" aoClicar={() => setPagina(paginaAtual + 1)} desabilitado={paginaAtual === totalPaginas} className={`paginacao-nav ${paginaAtual === totalPaginas ? "paginacao-desabilitado" : ""}`}>Próximo →</Botao>

    </div>
  );
}