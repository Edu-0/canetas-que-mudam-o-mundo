import { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import logo from "../assets/logo.svg";
import { obterTodasONGs } from "../services/usuarioService";
import { ONG } from "../context/OngContext";
import { useFiltroONGs } from "../hooks/useFiltroONGs";
import Paginacao from "../components/Paginacao";
import CardONG from "../components/CardONG";

function ListarONGs() {
  const [ongs, setOngs] = useState<ONG[]>([]);
  const [busca, setBusca] = useState("");
  const [ordem, setOrdem] = useState<"nome-asc" | "nome-desc">("nome-asc");
  const [erroBusca, setErroBusca] = useState("");
  const [tocadoBusca, setTocadoBusca] = useState(false);

  const ITENS_POR_PAGINA = 5;
  const [paginaAtual, setPaginaAtual] = useState(1);

  const ongsFiltradas = useFiltroONGs(ongs, busca, ordem);
  
  const totalPaginas = Math.max(1, Math.ceil(ongsFiltradas.length / ITENS_POR_PAGINA)); // garente pelo menos 1 página

  const ongsPagina = ongsFiltradas.slice(
    (paginaAtual - 1) * ITENS_POR_PAGINA,
    paginaAtual * ITENS_POR_PAGINA
  );

  const validarBusca = (valor: string) => {
    if (valor.length >= 100) return "Você atingiu o limite máximo de 100 caracteres";
    if (!/^[a-zA-ZÀ-ÿ\s]*$/.test(valor)) return "Apenas letras e espaços";
    return "";
  };

  useEffect(() => {
    async function carregar() {
      const dados = await obterTodasONGs();
      setOngs(dados);
    }

    carregar();
  }, []);

  useEffect(() => {
    if (paginaAtual > totalPaginas) {
      setPaginaAtual(totalPaginas);
    }
  }, [ongsFiltradas]);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--base-5)]">
      
      {/* header */}
      <Header />

      {/* body */}
      <main className="flex-1 pt-24 pb-10">
        <div className="w-full px-6 md:px-20 flex flex-col gap-10">

          {/* título e logo da caneta */}
          <div className="flex items-center justify-center gap-4 flex-wrap text-center">
            <img src={logo} alt="Logo" className="h-16 md:h-20" />
        
            <h1 className="header-medio text-center">
              Canetas que Mudam o Mundo
            </h1>
          </div>

          <div className="flex flex-col items-center px-4">

            {/* título do formulário */}
            <div className="w-full max-w-4xl bg-[var(--primario-5)] shadow-[2px_10px_40px_rgba(0,0,0,0.1)] rounded-lg p-6">

              <h2 className="header-pequeno text-center mb-6">
                LISTA DE ONGs NA PLATAFORMA
              </h2>

              <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch gap-3 mb-6 border rounded-lg bg-[var(--base-20)] border-[var(--base-70)] p-2">
  
                <div className="text-black text-2xl font-extrabold font-['Nunito']">Filtros:</div>

                <div className="flex-1 min-w-0">
                  
                  {/* busca por nome */}
                  <input id="busca" type="text" maxLength={100} placeholder="Buscar por nome ou CNPJ (ex: 12.345.678/0001-90)..." value={busca} onChange={(e) => { const valor = e.target.value; setBusca(valor); setPaginaAtual(1); const erro = validarBusca(valor); setErroBusca(erro);}}
                    onBlur={() => setTocadoBusca(true)} className={`input-padrao w-full ${ tocadoBusca && erroBusca ? "border-[var(--cor-resposta-errada)] focus:ring-[var(--cor-resposta-errada)]" : "hover:border-2 border-[var(--base-70)] focus-acessivel"}`} aria-invalid={!!erroBusca} aria-label="Pesquisar por nome ou CNPJ"/>
                  
                  {tocadoBusca && erroBusca && <div className="text-[var(--cor-resposta-errada)] mt-1 text-sm">{erroBusca}</div>}
                </div>

                <div>
                  <select id="ordem" value={ordem} onChange={(e) => { setOrdem(e.target.value as any); setPaginaAtual(1);}} className="input-padrao w-full sm:w-48 hover:border-2 border-[var(--base-70)] focus-acessivel">
                    <option value="nome-asc">Nome A-Z</option>
                    <option value="nome-desc">Nome Z-A</option>
                  </select>
                </div>

              </div>

              {/* lista */}
              {ongsPagina.length === 0 ? (
                <p className="text-center body-semibold-pequeno py-6">
                  Nenhuma ONG encontrada com esses filtros.
                </p>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  {ongsPagina.map((ong) => (
                    <CardONG key={ong.id} ong={ong} />
                  ))}
                </div>
              )}

              {/* paginação */}
              <div className="mt-6">
                <Paginacao
                  paginaAtual={paginaAtual}
                  totalPaginas={totalPaginas}
                  setPagina={setPaginaAtual}
                />
              </div>


            </div>
          </div>
        </div>
      </main>

      {/* footer */}
      <Footer />
    </div>
  );
}
export default ListarONGs;