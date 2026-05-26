import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import logo from "../assets/logo.svg";
import Paginacao from "../components/Paginacao";
import { obterDoacoes } from "../services/triagemService";
import Botao from "../components/Botao";
import Toast from "../components/Toast";
import { useONG } from "../context/OngContext";
import { DoacaoContextType } from "../context/DoacaoContext";
import { dataNaoFutura, dataValida, intervaloDataValido } from "../utils/validacoesTriagem";
import { useUsuario } from "../context/UserContext";

function ListaTriagem() {
  const navigate = useNavigate();
  const { ong } = useONG();
  const { usuario } = useUsuario();
  const [mostrarModal, setMostrarModal] = useState(false);
  const [carregandoExclusao, setCarregandoExclusao] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erroModal, setErroModal] = useState<{
    campo?: string;
    mensagem: string;
  } | null>(null);

  const [tipoMensagem, setTipoMensagem] = useState<"sucesso" | "erro">("sucesso");
  const [doacaoSelecionada, setDoacaoSelecionada] = useState<number | null>(null);

  const ITENS_POR_PAGINA = 5;
  const [paginaAtual, setPaginaAtual] = useState(1);

  const [doacoes, setDoacoes] = useState<DoacaoContextType[]>([]);

  const [ordem, setOrdem] = useState<"asc" | "desc">("desc");
  
  const [statusFiltro, setStatusFiltro] = useState<"todos" | "AGUARDANDO_TRIAGEM" | "AGUARDANDO_NOVA_TRIAGEM">("todos");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  const [erroBusca, setErroBusca] = useState("");
  const [tocadoBusca, setTocadoBusca] = useState(false);

  const temPermissao = Boolean(usuario?.tipos?.includes("Voluntário da triagem"));

  // const doacoesFiltradas = doacoes;

  const doacoesFiltradas = doacoes.filter((d: any) => {
  // remove itens em quarentena
  if (d.itens?.some((item: any) =>
    item.avaliacoes?.some((a: any) => a.em_quarentena === true)
  )) {
    return false;
  }

  return true;
});

  const totalPaginas = Math.max(1, Math.ceil(doacoesFiltradas.length / ITENS_POR_PAGINA)); // garente pelo menos 1 página

  const doacoesPagina = doacoesFiltradas.slice(
    (paginaAtual - 1) * ITENS_POR_PAGINA,
    paginaAtual * ITENS_POR_PAGINA
  );

  function formatarDataHora(data?: string) {
  if (!data) return "N/A";

  const iso = data.replace(" ", "T");
  const d = new Date(iso);

  const dataFormatada = d.toLocaleDateString("pt-BR");
  const horaFormatada = d.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${dataFormatada} às ${horaFormatada}`;
}

    function calcularTempo(data?: string) {
    if (!data) return { meses: 0, dias: 0 };

    const inicio = new Date(data);
    const hoje = new Date();

    let meses =
      (hoje.getFullYear() - inicio.getFullYear()) * 12 +
      (hoje.getMonth() - inicio.getMonth());

    if (hoje.getDate() < inicio.getDate()) {
      meses--;
    }

    const diffMs = hoje.getTime() - inicio.getTime();
    const dias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    return {
      meses: Math.max(meses, 0),
      dias: Math.max(dias, 0),
    };
  }

  function formatarTempo(data?: string) {
    if (!data) {
      return { texto: "Sem data", tipo: "antigo" };
    }

    const { meses, dias } = calcularTempo(data);

    const inicio = new Date(data);
    const hoje = new Date();
    const diffMs = hoje.getTime() - inicio.getTime();
    const diffHoras = diffMs / (1000 * 60 * 60);

    // menos de 24h
    if (diffHoras < 24) {
      return { texto: "Últimas 24h", tipo: "novo" };
    }

    // menos de 1 mês
    if (meses < 1) {
      return { texto: `${dias} dia${dias === 1 ? "" : "s"}`, tipo: "recente" };
    }

    // mais de 1 mês
    return { texto: `${meses} mês${meses === 1 ? "" : "es"}`, tipo: "antigo" };
  }

  const validarDatas = () => {
    if (dataInicio && !dataValida(dataInicio)) {
      return "Data inicial inválida";
    }

    if (dataFim && !dataValida(dataFim)) {
      return "Data final inválida";
    }

    if (dataInicio && !dataNaoFutura(dataInicio)) {
      return "Data inicial não pode ser futura";
    }

    if (dataFim && !dataNaoFutura(dataFim)) {
      return "Data final não pode ser futura";
    }

    if (!intervaloDataValido(dataInicio, dataFim)) {
      return "A data inicial deve ser antes da final";
    }

    return "";
  };

  const validarDatasComValores = (inicio: string, fim: string) => {
    if (inicio && !dataValida(inicio)) {
      return "Data inicial inválida";
    }

    if (fim && !dataValida(fim)) {
      return "Data final inválida";
    }

    if (inicio && !dataNaoFutura(inicio)) {
      return "Data inicial não pode ser futura";
    }

    if (fim && !dataNaoFutura(fim)) {
      return "Data final não pode ser futura";
    }

    if (!intervaloDataValido(inicio, fim)) {
      return "A data inicial deve ser antes da final";
    }

    return "";
  };

  function formatarStatus(status: string) {
    return status
      .toLowerCase()
      .replaceAll("_", " ");
  }

  function corStatus(status: string) {
    switch (status) {
      case "AGUARDANDO_TRIAGEM":
        return "bg-yellow-100 text-black";

      case "AGUARDANDO_NOVA_TRIAGEM":
        return "bg-orange-100 text-black";

      default:
        return "bg-gray-100 text-black";
    }
  }

  useEffect(() => {
    async function carregar() {
      if (!temPermissao) {
        setMensagem("Voce nao tem permissao para acessar a triagem.");
        setTipoMensagem("erro");
        return;
      }

      try {

        const resposta = await obterDoacoes({
          data_inicio: dataInicio || undefined,
          data_final: dataFim || undefined,
          status:
            statusFiltro === "AGUARDANDO_TRIAGEM"
              ? "AGUARDANDO_TRIAGEM"
              : statusFiltro === "AGUARDANDO_NOVA_TRIAGEM"
              ? "AGUARDANDO_NOVA_TRIAGEM"
              : undefined,
          ordem,
        });

        setDoacoes(resposta.data as DoacaoContextType[]); // resposta já vem filtrada do backend

      } catch (erro: any) {
        console.error("Erro ao carregar doações:", erro);

        const status = erro?.response?.status;

        if (status === 403) {
          setMensagem("Você não tem permissão para ver essas doações.");
        } else if (status === 404) {
          setMensagem("ONG não encontrada.");
        } else {
          setMensagem("Erro ao carregar doações.");
        }

        setTipoMensagem("erro");
      }
    }

    if (erroBusca) return; // evita chamar backend com data inválida

    carregar();
  }, [statusFiltro, dataInicio, dataFim, ordem, temPermissao]); // recarrega ao mudar filtros ou ONG

  useEffect(() => {
    const total = Math.ceil(doacoesFiltradas.length / ITENS_POR_PAGINA);

    if (paginaAtual > totalPaginas) {
      setPaginaAtual(totalPaginas);
    }
  }, [doacoesFiltradas]);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--base-5)]">
      
      {/* header */}
      <Header />

      {/* body */}
      <main className="flex-1 pt-24 pb-10">
        <div className="w-full px-6 md:px-20 flex flex-col gap-10">
          <Toast mensagem={mensagem} tipo={tipoMensagem} />

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
                LISTA DE TRIAGEM
              </h2>

              <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch gap-3 mb-6 border rounded-lg bg-[var(--base-20)] border-[var(--base-70)] p-2">

                <div className="text-black text-2xl font-extrabold font-['Nunito'] flex items-center self-stretch">Filtros:</div>

                <div className="justify-start w-full sm:w-56 flex flex-col">
                  <label className="body-muito-pequeno" htmlFor="busca-status">Status da doação</label>
                  {/* status */}
                  <select id="busca-status" value={statusFiltro} onChange={(e) => { setStatusFiltro(e.target.value as any); setPaginaAtual(1);}} className="input-padrao h-9 w-full sm:w-56 hover:border-2 border-[var(--base-70)] focus-acessivel" aria-label="Selcionar o status das doações">
                    <option value="todos">Todos os status</option>
                    <option value="AGUARDANDO_TRIAGEM">Aguardando triagem</option>
                    <option value="AGUARDANDO_NOVA_TRIAGEM">Aguardando nova triagem</option>
                  </select>
                </div>

                <div className="justify-start w-full sm:w-44 flex flex-col">
                  <label className="body-muito-pequeno" htmlFor="busca-ordem">Ordem de exibição</label>
                  <select id="busca-ordem" value={ordem} onChange={(e) => { setOrdem(e.target.value as any); setPaginaAtual(1);}} className="input-padrao h-9 w-full sm:w-44 hover:border-2 border-[var(--base-70)] focus-acessivel" aria-label="Selcionar a ordem de exibição das doações">
                    <option value="desc">Doações mais novas</option>
                    <option value="asc">Doações mais antigas</option>
                  </select>
                </div>

                <div className="border rounded-lg bg-[var(--base-30)] border-[var(--base-70)] px-1 pb-1 flex-1 min-w-0">
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex flex-col sm:flex-row gap-2 w-full">

                      {/* Data início */}
                      <div className="flex flex-col flex-1 min-w-0 w-full">
                        <label className="body-muito-pequeno" htmlFor="dataInicio">Período (inicio) </label>

                        <input id="dataInicio" type="date" value={dataInicio} onChange={(e) => {const valor = e.target.value; setDataInicio(valor); setPaginaAtual(1); const erro = validarDatasComValores(valor, dataFim); setErroBusca(erro);}}
                          onBlur={() => { setErroBusca(validarDatas()); }} className={`input-padrao h-8 px-2 w-full ${ erroBusca ? "border-[var(--cor-resposta-errada)]" : "hover:border-2 border-[var(--base-70)] focus-acessivel" }`} aria-invalid={!!erroBusca}
                          aria-describedby={erroBusca ? "erro-dataFim" : undefined} />
                      </div>

                      <span className="body-muito-pequeno flex items-center justify-center sm:items-end">até</span>

                      {/* Data fim */}
                      <div className="flex flex-col flex-1 min-w-0 w-full">
                        <label className="body-muito-pequeno" htmlFor="dataFim">Período (final) </label>

                        <input id="dataFim" type="date" value={dataFim} onChange={(e) => {const valor = e.target.value; setDataFim(valor); setPaginaAtual(1); const erro = validarDatasComValores(dataInicio, valor); setErroBusca(erro);}}
                          onBlur={() => { setErroBusca(validarDatas()); }} className={`input-padrao h-8 px-2 w-full ${ erroBusca ? "border-[var(--cor-resposta-errada)]" : "hover:border-2 border-[var(--base-70)] focus-acessivel" }` } aria-invalid={!!erroBusca}
                          aria-describedby={erroBusca ? "erro-dataInicio" : undefined} />
                      </div>
                    </div>

                    {/* erro */}
                    {erroBusca && <div className="text-[var(--cor-resposta-errada)] mt-1 text-sm">{erroBusca}</div>}
                  </div>
                </div>

              </div>

              {doacoes.length === 0 ? (
                <div className="text-center body-semibold-pequeno py-6">
                  Nenhuma doação encontrada.
                </div> 

              ) : doacoesPagina.length === 0 ? (
                <div className="text-center body-semibold-pequeno py-6">
                  Nenhuma doação encontrada com esses filtros.
                </div>

              ) : (
                <div className="flex flex-col gap-4">
                  {doacoesPagina.map((d, index) => {

                    const criadoEm = formatarDataHora(d.created_at);
                    const tempo = formatarTempo(d.created_at);

                    return (
                      <div key={d.id} className="flex flex-col sm:flex-row gap-3 border-b py-3 w-full">

                        {/* Esquerda */}
                        <div className="flex flex-col min-w-0 flex-1">

                          <span className="font-['Nunito'] font-semibold text-sm sm:text-base md:text-lg truncate">
                            {String((paginaAtual - 1) * ITENS_POR_PAGINA + index + 1).padStart(3, "0")} - {"Doação " + d.id} {/* número sequencial considerando a paginação */}
                          </span>

                          {/* data */}
                          <span className="body-muito-pequeno mt-1">
                            <strong className="body-semibold-muito-pequeno">Registrado em: </strong> {criadoEm}
                          </span>

                          {/* tempo desde o registro */}
                          <span className={`
                            text-[10px] sm-text-[12px] px-1 py-[2px] text-center leading-none rounded-sm w-fit mt-1
                            ${
                              tempo.tipo === "novo"
                                ? "bg-[var(--base-15)] text-black"
                                : tempo.tipo === "recente"
                                ? "bg-blue-100 text-black"
                                : "bg-[var(--secundario-100)] text-black"
                            }`}>
                            {tempo.texto}
                          </span> 

                          {/* status */}
                          <span className={`px-2 py-1  text-[10px] sm-text-[12px] rounded w-fit mt-1 capitalize ${corStatus(d.status)}`}>
                            {formatarStatus(d.status)}
                          </span>
                        
                        </div>

                        {/* Direita */}
                        <div className="flex flex-row items-center justify-between gap-2 mt-2 sm:mt-0 w-full sm:w-auto">

                          {/* já vai com o ID da doação */}
                          <Botao variante="botao-pequeno-editar" aoClicar={() => navigate(`/lista-triagem/triagem/${d.id}`)}>Analisar</Botao>
                        </div>
                      </div>
                    );
                  })}
              
                  <Paginacao
                    paginaAtual={paginaAtual}
                    totalPaginas={totalPaginas}
                    setPagina={setPaginaAtual}
                  />
                </div>
              )}

            </div>
          </div>
        </div>
      </main>

      {/* footer */}
      <Footer />
    </div>
  );
}
export default ListaTriagem;