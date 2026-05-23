import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import logo from "../assets/logo.svg";
import Paginacao from "../components/Paginacao";
import Botao from "../components/Botao";
import Toast from "../components/Toast";
import ModalConfirmacao from "../components/ModalConfirmacao";
import { useFiltroAuditoria } from "../hooks/useFiltroAuditoria";
import { obterDoacao, CriarTriagemEnvio, obterAnalisesPorVoluntario, ResultadoTriagem, StatusDoacao, obterAvaliacoes, AvaliacaoTriagem, respostaAuditoriaTriagem } from "../services/triagemService";
import ModalImagem from "../components/ModalImagem";
import { Doacao } from "../context/DoacaoContext";
import { dataNaoFutura, dataValida, intervaloDataValido } from "../utils/validacoesTriagem";

function AuditoriaVoluntario() {
  const { id } = useParams();
  const [voluntario, setVoluntario] = useState<any>(null);
  const [doacoes, setDoacoes] = useState<Doacao[]>([]);
  const [analises, setAnalises] = useState<AvaliacaoTriagem[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<Record<number, AvaliacaoTriagem[]>>({});
  const [expandido, setExpandido] = useState<number | null>(null);

  const [validacao, setValidacao] = useState<{[key: number]: {resultado_validado?: boolean; comentario_coordenador?: string;}}>({});
  const [historicoAberto, setHistoricoAberto] = useState<{ [key: number]: boolean }>({});

  const [mostrarModal, setMostrarModal] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erroModal, setErroModal] = useState<{
    campo?: string;
    mensagem: string;
  } | null>(null);
  const [tipoMensagem, setTipoMensagem] = useState<"sucesso" | "erro">("sucesso");

  const [buscaNome, setBuscaNome] = useState("");
  const [ordem, setOrdem] = useState<"asc" | "desc">("desc");
  const [statusAvaliacao, setStatusAvaliacao] = useState<"todos" | "PRE_APROVADO" | "INAPTO">("todos");
  const [statusFiltro, setStatusFiltro] = useState<"todos" | "PRE_APROVADO" | "INAPTO" | "INCOMPLETO">("todos");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [erroBusca, setErroBusca] = useState("");
  const [tocadoBusca, setTocadoBusca] = useState(false);
  const analisesFiltradas = useFiltroAuditoria(doacoes, statusAvaliacao, statusFiltro, ordem);

  const emQuarentena = analises.some(a => a.em_quarentena);

  const ITENS_POR_PAGINA = 5;
  const [paginaAtual, setPaginaAtual] = useState(1);  
  const totalPaginas = Math.max(1, Math.ceil(analisesFiltradas.length / ITENS_POR_PAGINA));
  const paginaDados = analisesFiltradas.slice( (paginaAtual - 1) * ITENS_POR_PAGINA, paginaAtual * ITENS_POR_PAGINA);

  const [modalImagemAberto, setModalImagemAberto] = useState(false);
  const [imagemSelecionadaIndex, setImagemSelecionadaIndex] = useState<number | null>(null);
  const [imagensAtuais, setImagensAtuais] = useState<string[]>([]);
  const [zoom, setZoom] = useState(1);
  const [posicao, setPosicao] = useState({ x: 0, y: 0 });
  const ZOOM_MIN = 1;
  const ZOOM_MAX = 3;
  const modalRef = useRef<HTMLDivElement>(null);

  function abrirImagem(imagens: string[], index: number) {
    setImagensAtuais(imagens);
    setImagemSelecionadaIndex(index);
    setZoom(1); // reseta zoom ao abrir nova imagem
    setPosicao({ x: 0, y: 0 }); // reseta posição ao abrir nova imagem
    setModalImagemAberto(true);
  }

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault();

    setZoom((prev) => {
      const novoZoom = prev + (e.deltaY > 0 ? -0.1 : 0.1);

      // não deixa diminuir abaixo de 1
      if (novoZoom < ZOOM_MIN) return ZOOM_MIN;

      // limite máximo
      if (novoZoom > ZOOM_MAX) return ZOOM_MAX;

      return novoZoom;
    });
  }

  function fecharModal() {
    setModalImagemAberto(false);
    setImagemSelecionadaIndex(null);
  }

  function proximaImagem() {
    if (imagemSelecionadaIndex === null) return;

    setImagemSelecionadaIndex((prev) =>
      prev !== null ? (prev + 1) % imagensAtuais.length : 0
    );
  }

  function imagemAnterior() {
    if (imagemSelecionadaIndex === null) return;

    setImagemSelecionadaIndex((prev) =>
      prev !== null
        ? (prev - 1 + imagensAtuais.length) % imagensAtuais.length
        : 0
    );
  }

  useEffect(() => {
    if (modalImagemAberto) {
      modalRef.current?.focus();
      document.body.style.overflow = "hidden"; // trava scroll da página
    } else {
      document.body.style.overflow = "auto"; // libera scroll da página
    }
  }, [modalImagemAberto]);

  async function revisar(id: number, aprovado: boolean) {
    const dados = validacao[id] || {};

    await respostaAuditoriaTriagem(id, {
      resultado_validado: aprovado,
      comentario_coordenador: dados.comentario_coordenador || undefined
    });

    setMensagem("Revisão salva com sucesso!");
    setTipoMensagem("sucesso");
  }

  useEffect(() => {
    async function carregar() {
      const res = await obterAnalisesPorVoluntario(Number(id));
      const dados = res.data;

      setAnalises(dados);
      setVoluntario(dados[0]?.voluntario_triagem || null);

      const mapaDoacoes: Record<number, Doacao> = {};
      const mapaAvaliacoes: Record<number, AvaliacaoTriagem[]> = {};

      dados.forEach((a) => {
        const doacao = a.item_doacao.doacao;
        const item = a.item_doacao;

        // montar doação completa com itens
        if (!mapaDoacoes[doacao.id]) {
          mapaDoacoes[doacao.id] = {
            ...doacao,
            itens: []
          };
        }

        // evitar duplicar item
        const jaExiste = mapaDoacoes[doacao.id].itens.find(i => i.id === item.id);
        if (!jaExiste) {
          mapaDoacoes[doacao.id].itens.push(item);
        }

        // avaliações por item
        const itemId = item.id;
        if (!mapaAvaliacoes[itemId]) {
          mapaAvaliacoes[itemId] = [];
        }

        mapaAvaliacoes[itemId].push(a);
      });

      setDoacoes(Object.values(mapaDoacoes));
      setAvaliacoes(mapaAvaliacoes);
    }

    carregar();
  }, []);

  function toggleHistorico(itemId: number) {
    setHistoricoAberto(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  }

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

      case "PRE_APROVADO":
        return "bg-green-100 text-green-800";

      case "INAPTO":
        return "bg-red-100 text-red-800";

      case "INCOMPLETO":
        return "bg-gray-100 text-black";

      default:
        return "bg-gray-100 text-black";
    }
  }

  useEffect(() => {
    const total = Math.ceil(analisesFiltradas.length / ITENS_POR_PAGINA);

    if (paginaAtual > totalPaginas) {
      setPaginaAtual(totalPaginas);
    }
  }, [analisesFiltradas]);

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
                AUDITORIA DO VOLUNTÁRIO
              </h2>

              {/* Informação do voluntário selecionado */}
              {voluntario && (
                <>
                  {emQuarentena && (
                    <div className="mb-4 p-3 bg-yellow-100 rounded">
                      Este voluntário está em quarentena. Revise suas decisões com atenção.
                    </div>
                  )}

                  <div className="border rounded p-4 mb-6 bg-white">
                    <p><strong>Nome:</strong> {voluntario.nome_completo}</p>
                    <p><strong>ID:</strong> {voluntario.id}</p>

                    <p>
                      <strong>Status:</strong>{" "}
                      {emQuarentena ? "Novato (em quarentena)" : "Voluntário experiente"}
                    </p>
                  </div>
                </>
              )}

              <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch gap-3 mb-6 border rounded-lg bg-[var(--base-20)] border-[var(--base-70)] p-2">
                 
                <div className="text-black text-2xl font-extrabold font-['Nunito'] flex items-center self-stretch">Filtros:</div>

                <div className="justify-start w-full sm:w-32 flex flex-col">
                  <label className="body-muito-pequeno" htmlFor="busca-avaliacao">Status da triagem</label>
                  
                  <select id="busca-avaliacao" value={statusAvaliacao} onChange={(e) => { setStatusAvaliacao(e.target.value as any); setPaginaAtual(1); }} className="input-padrao h-9 w-full sm:w-32 hover:border-2 border-[var(--base-70)] focus-acessivel" aria-label="Filtrar por status da triagem">
                    <option value="todos">Todos</option>
                    <option value="PRE_APROVADO">Pré-Aprovado</option>
                    <option value="INAPTO">Inapto</option>
                  </select>
                </div>

                <div className="justify-start w-full sm:w-32 flex flex-col">
                  <label className="body-muito-pequeno" htmlFor="busca-status">Status da doação</label>
                  
                  <select id="busca-status" value={statusFiltro} onChange={(e) => { setStatusFiltro(e.target.value as any); setPaginaAtual(1); }} className="input-padrao h-9 w-full sm:w-32 hover:border-2 border-[var(--base-70)] focus-acessivel" aria-label="Filtrar por status da doação">
                    <option value="todos">Todos</option>
                    <option value="PRE_APROVADO">Pré-Aprovado</option>
                    <option value="INAPTO">Inapto</option>
                    <option value="INCOMPLETO">Incompleto</option>
                  </select>
                </div>

                <div className="justify-start w-full sm:w-32 flex flex-col">
                  {/* ordem */}
                  <label className="body-muito-pequeno" htmlFor="busca-ordem">Ordem de exibição</label>
                  {/* ordem */}
                  <select id="busca-ordem" value={ordem} onChange={(e) => { setOrdem(e.target.value as any); setPaginaAtual(1);}} className="input-padrao h-9 w-full sm:w-32 hover:border-2 border-[var(--base-70)] focus-acessivel" aria-label="Selcionar a ordem de exibição dos voluntários">
                    <option value="desc">Mais novos</option>
                    <option value="asc">Mais antigos</option>
                  </select>
                </div>

                <div className="border rounded-lg bg-[var(--base-30)] border-[var(--base-70)] px-1 pb-1 flex-1 min-w-0">
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex flex-col sm:flex-row gap-2 w-full">

                      {/* Data início */}
                      <div className="flex flex-col flex-1 min-w-0 w-full">
                        <label className="body-muito-pequeno" htmlFor="dataInicio">Período (inicio)</label>

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

              {analises.length === 0 ? (
                <div className="text-center body-semibold-pequeno py-6">
                  Nenhuma doação vinculada a esta ONG.
                </div>

              ) : analisesFiltradas.length === 0 ? (
                <div className="text-center body-semibold-pequeno py-6">
                  Nenhuma doação encontrada com esses filtros.
                </div>

              ) : (
                <div className="flex flex-col gap-4">
                  {paginaDados.map((doacao: Doacao) => {

                    const criadoEm = formatarDataHora(doacao.created_at);
                    const triadoEm = doacao.updated_at ? formatarDataHora(doacao.updated_at) : null;
                    const isExpandido = expandido === doacao.id;
                    const ultimaAvaliacaoDoacao = doacao.itens.flatMap(item => avaliacoes[item.id] || [])
                      .sort((a, b) =>new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

                    return (
                      <div key={doacao.id} className="border rounded-lg p-4 bg-white flex flex-col gap-3">

                        <div className="flex justify-between items-start">

                          <div className="flex flex-col">

                            <span className="font-bold">Doação {doacao.id}</span>

                            {/* tags */}
                            <div className="flex flex-wrap gap-2 mt-2">

                              <span className="tag">Registrado em: {criadoEm}</span>

                              {triadoEm && (
                                <span className="tag">Triado em: {triadoEm}</span>
                              )}

                              <span className={`tag ${corStatus(ultimaAvaliacaoDoacao?.resultado || "")}`}>Status da triagem: {formatarStatus(ultimaAvaliacaoDoacao?.resultado || "Sem Avaliação")}</span>
                              <span className={`tag ${corStatus(doacao.status)}`}>Status da doação: {formatarStatus(doacao.status)}</span>

                            </div>
                          </div>

                          <button onClick={() => setExpandido(isExpandido ? null : doacao.id)} className="text-sm body-semibold-pequeno px-3 py-1 rounded-full bg-[var(--base-10)] hover:bg-[var(--base-20)]">
                            {isExpandido ? "Recolher ▲" : "Expandir ▼"}
                          </button>

                        </div>

                        {/* itens da doação */}
                        {isExpandido && (
                          <div className="flex flex-col gap-4">

                            {doacao.itens.map((item) => (
                              <div key={item.id} className="border rounded p-3 bg-[var(--base-10)]">

                                <p><strong>Tipo:</strong> {item.tipo_material}</p>
                                <p><strong>Descrição:</strong> {item.descricao}</p>
                                <p><strong>Quantidade:</strong> {item.quantidade}</p>

                                {/* Fotos */}
                                {item.fotos?.length > 0 && (
                                  <div>
                                    <p className="body-muito-pequeno sm:body-pequeno mb-1">
                                      <strong className="body-semibold-muito-pequeno sm:body-semibold-pequeno">Fotos:</strong>
                                    </p>

                                    <div className="flex flex-wrap gap-2">
                                      {item.fotos.map((foto: any, index: number) => (
                                        <img key={foto.id} src={foto.url} alt={`Foto ${index + 1} do item`} tabIndex={0} role="button" onClick={() => abrirImagem(item.fotos.map((f: any) => f.url), index)} 
                                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); abrirImagem(item.fotos.map((f: any) => f.url), index);}}}
                                        className=" w-24 h-24 object-cover rounded-md border cursor-pointer hover:scale-110 hover:shadow-md transition focus:outline-none focus:ring-2 focus:ring-[var(--base-50)]"/>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* parte da triagem */}
                                {avaliacoes[item.id]?.length > 0 && (() => {
                                  const ultima = avaliacoes[item.id][0];

                                  return (
                                    <div className="mt-3 border-t pt-2">

                                      {/* informações das triagens que já aconteceram */}
                                      <p>
                                        <strong>Triado por:</strong>{" "}
                                        {ultima.voluntario_triagem?.nome_completo}
                                      </p>

                                      <p>
                                        <strong>Resultado:</strong> {ultima.resultado}
                                      </p>

                                      <p>
                                        <strong>Data:</strong> {formatarDataHora(ultima.created_at)}
                                      </p>

                                      {ultima.comentario && (
                                        <p>
                                          <strong>Comentário:</strong> {ultima.comentario}
                                        </p>
                                      )}

                                      {ultima.motivo_inaptidao && (
                                        <p>
                                          <strong>Motivo:</strong> {ultima.motivo_inaptidao}
                                        </p>
                                      )}

                                      {/* botão de expandir */}
                                      <button onClick={() => toggleHistorico(item.id)} className="text-sm mt-2"> {historicoAberto[item.id] ? "Ocultar histórico" : "Ver histórico"}</button>

                                      {historicoAberto[item.id] && (
                                        <div className="mt-2 flex flex-col gap-2">

                                          {avaliacoes[item.id].map((av) => (
                                            <div key={av.id} className="border p-2 rounded bg-gray-50">

                                              <p><strong>Resultado:</strong> {av.resultado}</p>

                                              <p>
                                                <strong>Triado por:</strong>{" "}{av.voluntario_triagem?.nome_completo}
                                              </p>

                                              <p>
                                                <strong>Data:</strong>{" "}{formatarDataHora(av.created_at)}
                                              </p>

                                              {av.comentario && (
                                                <p><strong>Comentário:</strong> {av.comentario}</p>
                                              )}

                                              {av.motivo_inaptidao && (
                                                <p><strong>Motivo:</strong> {av.motivo_inaptidao}</p>
                                              )}

                                            </div>
                                          ))}

                                        </div>
                                      )}

                                    </div>
                                  );
                                })()}

                              </div>
                            ))}

                            <div className="border-t pt-3 mt-3 flex flex-col gap-2">

                              <label>
                                <input type="checkbox" onChange={(e) => setValidacao(prev => ({...prev, [doacao.id]: {...prev[doacao.id],resultado_validado: e.target.checked}}))}/>
                                Validar decisão do voluntário
                              </label>

                              <textarea placeholder="Feedback do coordenador (opcional)" maxLength={5000} className="input-padrao" onChange={(e) => setValidacao(prev => ({ ...prev, [doacao.id]: { ...prev[doacao.id], comentario_coordenador: e.target.value}}))}/>

                              <div className="flex gap-2">
                                <button className="botao-sucesso" disabled={!ultimaAvaliacaoDoacao} onClick={() => ultimaAvaliacaoDoacao && revisar(doacao.id, true)}>Concordar</button>

                                <button className="botao-perigo" disabled={!ultimaAvaliacaoDoacao} onClick={() => ultimaAvaliacaoDoacao && revisar(doacao.id, false)}>Discordar</button>
                              </div>

                            </div>

                          </div>
                        )}

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

      <ModalImagem
        aberto={modalImagemAberto}
        imagens={imagensAtuais}
        indexInicial={imagemSelecionadaIndex ?? 0}
        onFechar={fecharModal}
      />
    </div>
  );
}
export default AuditoriaVoluntario;