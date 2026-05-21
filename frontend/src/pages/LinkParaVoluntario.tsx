import Header from "../components/Header";
import Footer from "../components/Footer";
import logo from "../assets/logo.svg";
import icon_copiar from "../assets/icon_copiar.png";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Botao from "../components/Botao";
import Toast from "../components/Toast";
import ModalConfirmacao from "../components/ModalConfirmacao";
import { gerarLinkVoluntario, listarTokenOng, desativarTokenOng, type TokenLink} from "../services/usuarioService";
import { obterONG } from "../services/ongService";
import { useFiltroLinks } from "../hooks/useFiltroLinks";
import Paginacao from "../components/Paginacao";
import { useUsuario } from "../context/UserContext";

function LinkParaVoluntario() {

  const navigate = useNavigate();
  const { usuario, definirUsuario } = useUsuario();

  const [tokens, setTokens] = useState<TokenLink[]>([]);
  const [ongId, setOngId] = useState<number | null>(null);

  const [mensagem, setMensagem] = useState("");
  const [tipoMensagem, setTipoMensagem] = useState<"sucesso" | "erro">("sucesso");

  const [carregando, setCarregando] = useState(true);
  const [gerando, setGerando] = useState(false);

  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarModalCadastro, setMostrarModalCadastro] = useState(false);
  const [tokenSelecionado, setTokenSelecionado] = useState<number | null>(null);
  const [carregandoExclusao, setCarregandoExclusao] = useState(false);

  const ITENS_POR_PAGINA = 5;
  const [paginaAtual, setPaginaAtual] = useState(1);

  const [busca, setBusca] = useState("");
  const [ordem, setOrdem] = useState<"novo" | "antigo">("novo");
  const [erroBusca, setErroBusca] = useState("");
  const [tocadoBusca, setTocadoBusca] = useState(false);

  const linksFiltrados = useFiltroLinks(tokens, busca, ordem);

  const totalPaginas = Math.max(1, Math.ceil(linksFiltrados.length / ITENS_POR_PAGINA));
  const linksPagina = linksFiltrados.slice((paginaAtual - 1) * ITENS_POR_PAGINA, paginaAtual * ITENS_POR_PAGINA);

  const [ultimoLink, setUltimoLink] = useState<string | null>(null);
  const [linkSelecionado, setLinkSelecionado] = useState<string | null>(null);

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
      const novoLink = await gerarLinkVoluntario(ongId);

      await navigator.clipboard.writeText(novoLink); // copia o link gerado

      setUltimoLink(novoLink); // guarda o último link gerado para destacar na lista

      const listaAtualizada = await listarTokenOng(ongId);

      setTokens(listaAtualizada);

      setMensagem("Link gerado e copiado com sucesso!");
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

  function formatarDataHora(data?: string) {
    if (!data) return "N/A";

    // normaliza o formato do Python → ISO
    const iso = data.replace(" ", "T");

    const d = new Date(iso);

    const dataFormatada = d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    const horaFormatada = d.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return `${dataFormatada} às ${horaFormatada}`;
  }

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
                  <select id="busca-ordem" value={ordem} onChange={(e) => { setOrdem(e.target.value as any); setPaginaAtual(1);}} className="input-padrao w-full sm:w-58 hover:border-2 border-[var(--base-70)] focus-acessivel" aria-label="Selcionar a ordem de exibição dos links">
                    <option value="novo">Links mais recentes primeiro</option>
                    <option value="antigo">Links mais antigos primeiro</option>
                  </select>
                </div>

              </div>

              {carregando ? (
                <p className="text-center body-semibold-pequeno py-6">
                  Carregando links...
                </p>

              ) : tokens.length === 0 ? (
                <div className="text-center body-semibold-pequeno py-6">
                  Nenhum link gerado ainda.
                </div>

              ) : linksPagina.length === 0 ? (
                <div className="text-center body-semibold-pequeno py-6">
                  Nenhum link encontrado com esses filtros.
                </div>
              
              ) : (
                <div className="flex flex-col gap-4">

                  {linksPagina.map((t, index) => {

                    const criadoEm = formatarDataHora(t.data_criacao);
                    const expiraEm = formatarDataHora(t.data_expiracao);

                    return (

                      <div key={t.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b py-3">
                        
                        {/* esquerda */}
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold truncate">
                            {String((paginaAtual - 1) * ITENS_POR_PAGINA + index + 1).padStart(3, "0")}
                          </span>

                          <button onClick={() => {setLinkSelecionado(t.link); setMostrarModalCadastro(true);}} className={`text-left underline break-all hover:bg-[var(--base-10)] hover:rounded-sm ${t.link === ultimoLink ? "text-[var(--base-60)]" : "text-black"}`}>
                            {t.link}
                          </button>
                          
                          <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                            <div className="mt-1">
                              <span className="body-muito-pequeno">
                                <strong className="body-semibold-muito-pequeno">Criado em: </strong>{criadoEm}
                              </span>
                            </div>

                            <div className="mt-1">
                              <span className="body-muito-pequeno">
                                <strong className="body-semibold-muito-pequeno">Expira em: </strong>{expiraEm}
                              </span>
                            </div>
                          </div>

                        </div>

                        {/* direita */}
                        <div className="flex flex-row items-center justify-between gap-2 mt-2 sm:mt-0 w-full sm:w-auto">

                          <Botao variante="botao-pequeno-editar" aoClicar={() => copiarLink(t.link)}>Copiar</Botao>

                          <Botao variante="botao-pequeno-desativar" desabilitado={carregandoExclusao} aoClicar={() => { setTokenSelecionado(t.id); setMostrarModal(true);}}>Desativar</Botao>
                                
                        </div>
                      </div>
                    )})}

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

                    const listaAtualizada = await listarTokenOng(ongId);
                    setTokens(listaAtualizada);

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

              {/* Quando clicar em um link */}
              <ModalConfirmacao
                aberto={mostrarModalCadastro}
                titulo="Fazer cadastro com esse link?"
                descricao="Tem certeza que deseja fazer cadastro com esse link? Você será deslogado e redirecionado para a página de cadastro."
                botaoCancelar="Cancelar"
                botaoConfirmar="Confirmar"
                varianteCancelar="cancelar"
                varianteConfirmar="confirmar"
                onCancelar={() => setMostrarModalCadastro(false)}
                onConfirmar={() => {
                  if (!linkSelecionado) return;

                  // deslogar
                  localStorage.removeItem("access_token");
                  localStorage.removeItem("token_type");
                  localStorage.removeItem("usuario");
                  definirUsuario(null);

                  const url = new URL(linkSelecionado);
                  navigate(url.pathname + url.search);

                  setMostrarModalCadastro(false);
                  setLinkSelecionado(null);
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