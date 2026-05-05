import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import logo from "../assets/logo.svg";
import Paginacao from "../components/Paginacao";
import { DadosUsuario, obterTodosUsuarios, excluirConta } from "../services/usuarioService";
import { mapearTipo } from "../context/UserContext";
import Botao from "../components/Botao";
import Toast from "../components/Toast";
import ModalConfirmacao from "../components/ModalConfirmacao";
import { useFiltroVoluntarios } from "../hooks/useFiltroVoluntarios";

function AnaliseVoluntarios() {
  const navigate = useNavigate();
  const [mostrarModal, setMostrarModal] = useState(false);
  const [carregandoExclusao, setCarregandoExclusao] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erroModal, setErroModal] = useState<{
    campo?: string;
    mensagem: string;
  } | null>(null);

  const [tipoMensagem, setTipoMensagem] = useState<"sucesso" | "erro">("sucesso");
  const [voluntarioSelecionado, setVoluntarioSelecionado] = useState<number | null>(null);

  const ITENS_POR_PAGINA = 5;
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [voluntarios, setVoluntarios] = useState<DadosUsuario[]>([]);
  
  const [buscaNome, setBuscaNome] = useState("");
  type PeriodoFiltro = | "todos" | "0-1" | "2-3" | "4-5" | "6-7" | "8-9" | "10-11" | "12" | "24" | "25+"; 
  const [periodo, setPeriodo] = useState<PeriodoFiltro>("todos");

  const [ordem, setOrdem] = useState<"nome-asc" | "nome-desc" | "data-asc" | "data-desc">("data-desc");
  const [erroBusca, setErroBusca] = useState("");
  const [tocadoBusca, setTocadoBusca] = useState(false);

  const voluntariosFiltrados = useFiltroVoluntarios(
    voluntarios,
    buscaNome,
    periodo,
    ordem
  );
    
  const totalPaginas = Math.max(1, Math.ceil(voluntariosFiltrados.length / ITENS_POR_PAGINA)); // garente pelo menos 1 página

  const voluntariosPagina = voluntariosFiltrados.slice(
    (paginaAtual - 1) * ITENS_POR_PAGINA,
    paginaAtual * ITENS_POR_PAGINA
  );

  const validarBusca = (valor: string) => {
    if (valor.length >= 100) return "Você atingiu o limite máximo de 100 caracteres";
    if (!/^[a-zA-ZÀ-ÿ\s]*$/.test(valor)) return "Apenas letras e espaços";
    return "";
  };

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
    const { meses, dias } = calcularTempo(data);

    // se tiver menos de 24h
    if (dias <= 1) {
      return { texto: "Últimas 24h", tipo: "novo" };
    }

    // se tiver menos de 1 mês
    if (meses < 1) {
      return { texto: `${dias} dia${dias === 1 ? "" : "s"}`, tipo: "recente" };
    }

    // se tiver mais de 1 mês
    return { texto: `${meses} mês${meses === 1 ? "" : "es"}`, tipo: "antigo" };
  }

  useEffect(() => {
    async function carregar() {
      const dados = await obterTodosUsuarios();

      const filtrados = dados.filter(u =>
        u.funcao.some(f =>
          mapearTipo(f.tipo_usuario) === "Voluntário da triagem"
        )
      );

      setVoluntarios(filtrados);
    }

    carregar();
  }, []);

  useEffect(() => {
    const total = Math.ceil(voluntariosFiltrados.length / ITENS_POR_PAGINA);

    if (paginaAtual > totalPaginas) {
      setPaginaAtual(totalPaginas);
    }
  }, [voluntariosFiltrados]);

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
                ANÁLISE DOS VOLUNTÁRIOS
              </h2>

              <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch gap-3 mb-6 border rounded-lg bg-[var(--base-20)] border-[var(--base-70)] p-2">
   
                <div className="text-black text-2xl font-extrabold font-['Nunito']">Filtros:</div>

                <div className="flex-1 min-w-0">
                  {/* busca por nome */}
                  <input id="busca-nome" type="text" maxLength={100} placeholder="Pesquisar por nome..." value={buscaNome} onChange={(e) => { const valor = e.target.value; setBuscaNome(valor); setPaginaAtual(1); const erro = validarBusca(valor); setErroBusca(erro);}}
                    onBlur={() => setTocadoBusca(true)} className={`input-padrao w-full ${ tocadoBusca && erroBusca ? "border-[var(--cor-resposta-errada)] focus:ring-[var(--cor-resposta-errada)]" : "hover:border-2 border-[var(--base-70)] focus-acessivel"}`} aria-invalid={!!erroBusca} aria-label="Pesquisar por nome"/>
                  
                  {tocadoBusca && erroBusca && <div className="text-[var(--cor-resposta-errada)] mt-1 text-sm">{erroBusca}</div>}
                </div>

                <div>
                  {/* período */}
                  <select id="busca-periodo" value={periodo} onChange={(e) => { setPeriodo(e.target.value as PeriodoFiltro); setPaginaAtual(1); }} className="input-padrao w-full sm:w-48 hover:border-2 hover:border-[var(--base-70)] focus-acessivel" aria-label="Filtrar por período de cadastro">
                    <option value="todos">Período</option>
                    <option value="0-1">Até 1 mês</option>
                    <option value="2-3">2 a 3 meses</option>
                    <option value="4-5">4 a 5 meses</option>
                    <option value="6-7">6 a 7 meses</option>
                    <option value="8-9">8 a 9 meses</option>
                    <option value="10-11">10 a 11 meses</option>
                    <option value="12">1 ano</option>
                    <option value="24">2 anos</option>
                    <option value="25+">Mais de 3 anos</option>
                  </select>
                </div>

                <div>
                  {/* ordem */}
                  <select id="busca-ordem" value={ordem} onChange={(e) => { setOrdem(e.target.value as any); setPaginaAtual(1);}} className="input-padrao w-full sm:w-48 hover:border-2 border-[var(--base-70)] focus-acessivel" aria-label="Selcionar a ordem de exibição dos voluntários">
                    <option value="nome-asc">Nome [A → Z]</option>
                    <option value="nome-desc">Nome [Z → A]</option>
                    <option value="data-desc">Voluntários mais novos</option>
                    <option value="data-asc">Voluntários mais antigos</option>
                  </select>
                </div>

              </div>

              {voluntariosPagina.length === 0 && (
                <div className="text-center body-semibold-pequeno py-6">
                  Nenhum voluntário encontrado com esses filtros.
                </div>
              )}

              <div className="flex flex-col gap-4">
                {voluntariosPagina.map((v, index) => {
                  
                  const tempo = formatarTempo(v.data_cadastro);

                  return (
                    <div key={v.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b py-3">

                      {/* Esquerda */}
                      <div className="flex flex-col min-w-0">

                        <span className="font-['Nunito'] font-semibold text-sm sm:text-base md:text-lg truncate">
                          {String((paginaAtual - 1) * ITENS_POR_PAGINA + index + 1).padStart(3, "0")} - {v.nome_completo} {/* número sequencial considerando a paginação */}
                        </span>

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
                      
                      </div>

                      {/* Direita */}
                      <div className="flex flex-wrap gap-3 sm:gap-2 sm:justify-center mt-2 sm:mt-0">

                        <Botao variante="botao-pequeno-editar" aoClicar={() => navigate("/auditoria")}>Analisar</Botao>

                        <Botao variante="botao-pequeno-desativar" desabilitado={carregandoExclusao} aoClicar={() => {setVoluntarioSelecionado(v.id); setMostrarModal(true)}}>Desativar</Botao>

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

              <ModalConfirmacao
                aberto={mostrarModal}
                titulo="Desativar conta do voluntário da triagem"
                descricao="Tem certeza que deseja desativar essa conta? Essa ação não pode ser desfeita."
                botaoCancelar="Cancelar"
                botaoConfirmar="Desativar conta"
                varianteCancelar="confirmar"
                varianteConfirmar="cancelar"
                onCancelar={() => setMostrarModal(false)}
                onConfirmar={async () => {
                  if (voluntarioSelecionado === null) return; // se por algum motivo não tiver um voluntário selecionado, não faz nada

                  setCarregandoExclusao(true);

                  try {
                    await excluirConta(voluntarioSelecionado); // chama a função e coloca o id do voluntário selecionado

                    // atualiza a lista de voluntários removendo o voluntário desativado
                    setVoluntarios(prev => {
                      const novaLista = prev.filter(v => v.id !== voluntarioSelecionado);

                      const novaTotalPaginas = Math.ceil(novaLista.length / ITENS_POR_PAGINA);

                      if (paginaAtual > novaTotalPaginas) {
                        setPaginaAtual(novaTotalPaginas || 1);
                      }

                      return novaLista;
                    });

                    setMensagem("Voluntário desativado com sucesso!");
                    setTipoMensagem("sucesso");

                  } catch (erro) {
                    console.error("Erro ao desativar conta:", erro);

                    setMensagem("Erro ao desativar voluntário.");
                    setTipoMensagem("erro");
                  } finally {
                    setCarregandoExclusao(false);
                  }

                  setMostrarModal(false);
                  setVoluntarioSelecionado(null); // reseta seleção
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
export default AnaliseVoluntarios;