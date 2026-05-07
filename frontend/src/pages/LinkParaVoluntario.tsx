import Header from "../components/Header";
import Footer from "../components/Footer";
import logo from "../assets/logo.svg";
import icon_copiar from "../assets/icon_copiar.png";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Botao from "../components/Botao";
import Toast from "../components/Toast";
import ModalConfirmacao from "../components/ModalConfirmacao";
import { gerarLinkVoluntario, listarTokenOng, desativarTokenOng, obterONG, type TokenLink} from "../services/usuarioService";
import { useFiltroLinks } from "../hooks/useFiltroLinks";
import Paginacao from "../components/Paginacao";

function LinkParaVoluntario() {

  const navigate = useNavigate();

  const [tokens, setTokens] = useState<TokenLink[]>([]);
  const [ongId, setOngId] = useState<number | null>(null);

  const [mensagem, setMensagem] = useState("");
  const [tipoMensagem, setTipoMensagem] = useState<"sucesso" | "erro">("sucesso");

  const [carregando, setCarregando] = useState(true);
  const [gerando, setGerando] = useState(false);

  const [mostrarModal, setMostrarModal] = useState(false);
  const [tokenSelecionado, setTokenSelecionado] = useState<number | null>(null);
  const [carregandoExclusao, setCarregandoExclusao] = useState(false);

  const ITENS_POR_PAGINA = 5;
  const [paginaAtual, setPaginaAtual] = useState(1);

  const [busca, setBusca] = useState("");
  const [ordem, setOrdem] = useState<"novo" | "antigo">("novo");
  const [status, setStatus] = useState<"todos" | "ativos" | "desativados">("todos");
  const [erroBusca, setErroBusca] = useState("");
  const [tocadoBusca, setTocadoBusca] = useState(false);

  const linksFiltrados = useFiltroLinks(tokens, busca, ordem, status);

  const totalPaginas = Math.max(1, Math.ceil(linksFiltrados.length / ITENS_POR_PAGINA));
  const linksPagina = linksFiltrados.slice((paginaAtual - 1) * ITENS_POR_PAGINA, paginaAtual * ITENS_POR_PAGINA);

  async function copiarLink(link: string) {
    try {
      await navigator.clipboard.writeText(link);

      setMensagem("Link copiado com sucesso!");
      setTipoMensagem("sucesso");
    } catch (e) {
      console.error(e);

      setMensagem("Erro ao copiar link.");
      setTipoMensagem("erro");
    }
  }

  async function gerarNovoLink() {
    if (!ongId) return;

    setGerando(true);

    try {
      await gerarLinkVoluntario();

      const listaAtualizada = await listarTokenOng(ongId);

      setTokens(listaAtualizada);

      setMensagem("Link gerado com sucesso!");
      setTipoMensagem("sucesso");
    } catch (e) {
      console.error(e);

      setMensagem("Erro ao gerar link.");
      setTipoMensagem("erro");
    } finally {
      setGerando(false);
    }
  }

  const validarBusca = (valor: string) => {
    if (valor.length >= 100) return "Você atingiu o limite máximo de 100 caracteres";
    return "";
  };

  useEffect(() => {
    async function carregar() {
      try {
        const ong = await obterONG();
        setOngId(ong.id);

        const lista = await listarTokenOng(ong.id);
        setTokens(lista);
      } catch (e) {
        console.error(e);
        setMensagem("Erro ao carregar links.");
        setTipoMensagem("erro");
      } finally {
        setCarregando(false);
      }
    }

    carregar();
  }, []);

  useEffect(() => {
    const total = Math.max(1, Math.ceil(linksFiltrados.length / ITENS_POR_PAGINA));

    if (paginaAtual > total) {
      setPaginaAtual(total);
    }
  }, [linksFiltrados, paginaAtual]);

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
                LINK PARA O VOLUNTÁRIO
              </h2>

              <div className="flex justify-center mb-6">
                <Botao variante="confirmar" aoClicar={gerarNovoLink} desabilitado={gerando}>
                  {gerando ? "Gerando..." : "Gerar novo link"}
                </Botao>

              </div>

              <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch gap-3 mb-6 border rounded-lg bg-[var(--base-20)] border-[var(--base-70)] p-2">
   
                <div className="text-black text-2xl font-extrabold font-['Nunito']">Filtros:</div>

                <div className="flex-1 min-w-0">
                  {/* busca */}
                  <input id="busca" type="text" maxLength={100} placeholder="Pesquisar por link..." value={busca} onChange={(e) => { const valor = e.target.value; setBusca(valor); setPaginaAtual(1); const erro = validarBusca(valor); setErroBusca(erro);}}
                    onBlur={() => setTocadoBusca(true)} className={`input-padrao w-full ${ tocadoBusca && erroBusca ? "border-[var(--cor-resposta-errada)] focus:ring-[var(--cor-resposta-errada)]" : "hover:border-2 border-[var(--base-70)] focus-acessivel"}`} aria-invalid={!!erroBusca} aria-label="Pesquisar por link"/>
                  
                  {tocadoBusca && erroBusca && <div className="text-[var(--cor-resposta-errada)] mt-1 text-sm">{erroBusca}</div>}
                </div>

                <div>
                  {/* ordem */}
                  <select id="busca-ordem" value={ordem} onChange={(e) => { setOrdem(e.target.value as any); setPaginaAtual(1);}} className="input-padrao w-full sm:w-48 hover:border-2 border-[var(--base-70)] focus-acessivel" aria-label="Selcionar a ordem de exibição dos links">
                    <option value="novo">Links recentes</option>
                    <option value="antigo">Links mais antigos</option>
                  </select>
                </div>

                <div>
                  {/* status */}
                  <select id="busca-status" value={status} onChange={(e) => { setStatus(e.target.value as any); setPaginaAtual(1); }} className="input-padrao w-full sm:w-48 hover:border-2 hover:border-[var(--base-70)] focus-acessivel" aria-label="Filtrar por status">
                    <option value="todos">Status</option>
                    <option value="ativos">Ativos</option>
                    <option value="desativados">Desativados</option>
                  </select>
                </div>

              </div>

              {carregando ? (
                <p className="text-center">Carregando links...</p>
              ) : tokens.length === 0 ? (
                <p className="text-center">
                  Nenhum link gerado ainda.
                </p>
              ) : (
                <div className="flex flex-col gap-4">

                  {linksPagina.map((t, index) => (
                    <div key={t.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b py-3">
                      
                      {/* esquerda */}
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold truncate">
                          {String((paginaAtual - 1) * ITENS_POR_PAGINA + index + 1).padStart(3, "0")}
                        </span>

                        <a href={t.link} target="_blank" rel="noopener noreferrer" className="text-black underline break-all">
                          {t.link}
                        </a>

                  
                      </div>

                      {/* direita */}
                      <div className="flex flex-wrap gap-3 sm:gap-2 sm:justify-center mt-2 sm:mt-0">

                        <Botao variante="botao-pequeno-editar" aoClicar={() => copiarLink(t.link)}>Copiar</Botao>

                        <Botao variante="botao-pequeno-desativar" desabilitado={carregandoExclusao} aoClicar={() => { setTokenSelecionado(t.id); setMostrarModal(true);}}>Desativar</Botao>
                              
                      </div>
                    </div>
                  ))}

                </div>
              )}

              <Paginacao
                paginaAtual={paginaAtual}
                totalPaginas={totalPaginas}
                setPagina={setPaginaAtual}
              />

              {/* modal */}
              <ModalConfirmacao
                aberto={mostrarModal}
                titulo="Desativar link"
                descricao="Tem certeza que deseja desativar esse link? Ele não poderá mais ser usado."
                botaoCancelar="Cancelar"
                botaoConfirmar="Desativar"
                varianteCancelar="confirmar"
                varianteConfirmar="cancelar"
                onCancelar={() => setMostrarModal(false)}
                onConfirmar={async () => {
                  if (!ongId || tokenSelecionado === null) return;

                  setCarregandoExclusao(true);

                  try {
                    await desativarTokenOng(ongId, tokenSelecionado);

                    setTokens(prev =>
                      prev.map(t => // se for o token que desativamos, marca como inativo
                        t.id === tokenSelecionado
                          ? { ...t, ativo: false }
                          : t
                      )
                    );

                    setMensagem("Link desativado com sucesso!");
                    setTipoMensagem("sucesso");
                  } catch (e) {
                    console.error(e);
                    setMensagem("Erro ao desativar link.");
                    setTipoMensagem("erro");
                  } finally {
                    setCarregandoExclusao(false);
                  }

                  setMostrarModal(false);
                  setTokenSelecionado(null);
                }}
              />

            </div>
          </div>
        </div>
      </main>

      {/* footer */}
      <Footer />
    </div>
  );
}
export default LinkParaVoluntario;