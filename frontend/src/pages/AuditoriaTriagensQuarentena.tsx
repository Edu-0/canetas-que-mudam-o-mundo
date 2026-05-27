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
import { CriarTriagemEnvio, AnaliseQuarentena, obterAnalisesQuarentena, ResultadoTriagem, StatusDoacao, obterAvaliacoes, AvaliacaoTriagem, respostaAuditoriaTriagem } from "../services/triagemService";
import ModalImagem from "../components/ModalImagem";
import { dataNaoFutura, dataValida, intervaloDataValido } from "../utils/validacoesTriagem";

function AuditoriaTriagensQuarentena() {
  const [analises, setAnalises] = useState<AnaliseQuarentena[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<Record<number, AvaliacaoTriagem[]>>({});
  const [expandido, setExpandido] = useState<number | null>(null);
  const [validacao, setValidacao] = useState<{[key: number]: {resultado_validado?: boolean; comentario_coordenador?: string;}}>({});
  const [analiseId, setAnaliseId] = useState<number | null>(null);
  
  const [mostrarModalConfirmar, setMostrarModalConfirmar] = useState(false);
  const [mostrarModalDiscordar, setMostrarModalDiscordar] = useState(false);

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
  const [statusFiltro, setStatusFiltro] = useState<"todos" | "PRE_APROVADO" | "INAPTO" | "INCOMPLETO" | "EM_QUARENTENA">("todos");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [erroBusca, setErroBusca] = useState("");
  const [tocadoBusca, setTocadoBusca] = useState(false);
  const analisesFiltradas = useFiltroAuditoria(analises, statusAvaliacao, statusFiltro, { dataInicio, dataFim }, ordem);
  
  const [checklistPorItem, setChecklistPorItem] = useState<Record<number, Record<number, boolean>>>({});
  const [observacaoPorItem, setObservacaoPorItem] = useState<Record<number, string>>({});
  const [comentarioOpcionalPorItem, setComentarioOpcionalPorItem] = useState<Record<number, string>>({});

  const [bloqueioAuditoria, setBloqueioAuditoria] = useState<Record<number, boolean>>({});
  
  const [statusPorItem, setStatusPorItem] = useState<Record<number, StatusDoacao | null>>({});
  const [statusTriagem, setStatusTriagem] = useState<ResultadoTriagem | null>(null);

  const [historicoAberto, setHistoricoAberto] = useState<Record<number, boolean>>({});
  const [triagemAberta, setTriagemAberta] = useState<Record<number, boolean>>({});
  const jaFoiTriada = Object.values(avaliacoes).some(arr => arr.length > 0); // verifica se algum item já tem avaliação de triagem

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
  
  const itensChecklist = [
    "Material em boas condições",
    "Sem danos estruturais",
    "Quantidade compatível",
    "Fotos suficientes",
  ];

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
    try {
      const dados = validacao[id] || {};

      await respostaAuditoriaTriagem(id, {
        resultado_validado: aprovado,
        comentario_coordenador: dados.comentario_coordenador || undefined
      });

      setMensagem("Auditoria realizada com sucesso!");
      setTipoMensagem("sucesso");

      // bloqueia para não permitir múltiplas auditorias no mesmo item enquanto a página não for recarregada
      setBloqueioAuditoria(prev => ({
        ...prev,
        [id]: true
      }));

      // recarrega análises para atualizar status da quarentena
      const res = await obterAnalisesQuarentena();
      setAnalises(res.data);

      setPaginaAtual(prev => Math.min(prev, 1)); // fica na primeira página, já que a maioria dos itens em quarentena provavelmente vai para a primeira página
    } catch (err) {
      setMensagem("Erro ao realizar auditoria");
      setTipoMensagem("erro");
    }
  }

  useEffect(() => {
    async function carregar() {
      try {
        const res = await obterAnalisesQuarentena();
        const analisesData = res.data;
        setAnalises(analisesData);

        const avaliacoesMap: Record<number, AvaliacaoTriagem[]> = {};

        const idsUnicos = Array.from(
          new Set<number>(analisesData.map((a: AnaliseQuarentena) => a.item_doacao.id))
        );

        for (const itemId of idsUnicos) {

          const analise = analisesData.find(
            (a: AnaliseQuarentena) => a.item_doacao.id === itemId
          );

          console.log("Carregando avaliações para item:", itemId);
          console.log("Analise:", analise);

          if (analise) {
            console.log("Analise ID:", analise.id);
            console.log("Item da doação:", analise.item_doacao);
            console.log("Doação relacionada:", analise.item_doacao.doacao);
          }

          try {
            const resAvaliacoes = await obterAvaliacoes(itemId);
            avaliacoesMap[itemId] = resAvaliacoes.data;
          } catch {
            avaliacoesMap[itemId] = [];
          }
        }

        setAvaliacoes(avaliacoesMap);

      } catch (err) {
        console.error("Erro ao carregar análises:", err);
        setAnalises([]);
      }
    }

    carregar();
  }, []);

  function toggleChecklist(itemId: number, index: number) {
    setChecklistPorItem((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [index]: !prev[itemId]?.[index],
      },
    }));
  }

  function toggleHistorico(itemId: number) {
    setHistoricoAberto(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  }

  function toggleTriagem(id: number) {
    setTriagemAberta(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  }

  function formatarData(data?: string) {  
    if (!data) return "N/A";

    const iso = data.replace(" ", "T");
    const d = new Date(iso);

    const dataFormatada = d.toLocaleDateString("pt-BR");

    return `${dataFormatada}`;
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
  
  function formatarStatus(status?: string) {
    if (!status) return "Sem avaliação";

    const mapaStatus: Record<string, string> = {
      PRE_APROVADO: "Pré aprovado",
      AGUARDANDO_RETIRADA: "Aguardando retirada",
      EM_QUARENTENA: "Em quarentena",
    };

    if (mapaStatus[status]) {
      return mapaStatus[status];
    }

    return status.toLowerCase().replaceAll("_", " ");
  }

  function corStatus(status?: string) {
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

      case "EM_QUARENTENA":
        return "bg-blue-100 text-blue-800";

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
                AUDITORIA DE TRIAGENS EM QUARENTENA
              </h2>
              
              <div className="mb-6 p-4 bg-[var(--primario-10)] border border-[var(--base-70)] rounded">
                <p className="body-muito-pequeno mb-2">Clique em <span className="body-bold-muito-pequeno">"Concordar"</span> se você concorda com a triagem feita pelo voluntário para aquele item específico, ou <span className="font-bold">"Discordar"</span> se você discorda da avaliação feita pelo voluntário. Se você discordar, será solicitado que você forneça um comentário explicando o motivo da discordância, para que o voluntário possa entender e a doação possa ir novamente para a triagem.</p>
              </div>

              <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch gap-3 mb-6 border rounded-lg bg-[var(--base-20)] border-[var(--base-70)] p-2">
                
                <div className="text-black text-2xl font-extrabold font-['Nunito'] flex items-center self-stretch">Filtros:</div>

                <div className="justify-start w-full sm:w-32 flex flex-col">
                  <label className="body-muito-pequeno" htmlFor="busca-avaliacao">Status da triagem</label>
                  
                  <select id="busca-avaliacao" value={statusAvaliacao} onChange={(e) => { setStatusAvaliacao(e.target.value as any); setPaginaAtual(1); }} className="input-padrao h-9 w-full sm:w-32 hover:border-2 border-[var(--base-70)] focus-acessivel" aria-label="Filtrar por status da triagem">
                    <option value="todos">Todos</option>
                    <option value="PRE_APROVADO">Pré-Aprovado</option>
                    <option value="INAPTO">Inapto</option>
                    <option value="EM_QUARENTENA">Em quarentena</option>
                  </select>
                </div>

                <div className="justify-start w-full sm:w-32 flex flex-col">
                  <label className="body-muito-pequeno" htmlFor="busca-status">Status da doação</label>
                  
                  <select id="busca-status" value={statusFiltro} onChange={(e) => { setStatusFiltro(e.target.value as any); setPaginaAtual(1); }} className="input-padrao h-9 w-full sm:w-32 hover:border-2 border-[var(--base-70)] focus-acessivel" aria-label="Filtrar por status da doação">
                    <option value="todos">Todos</option>
                    <option value="PRE_APROVADO">Pré-Aprovado</option>
                    <option value="INAPTO">Inapto</option>
                    <option value="INCOMPLETO">Incompleto</option>
                    <option value="EM_QUARENTENA">Em quarentena</option>
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

              {!analises.length ? (
                <div className="text-center body-semibold-pequeno py-6">
                  Nenhuma triagem aguardando auditoria vinculada a esta ONG.
                </div>

              ) : analisesFiltradas.length === 0 ? (
                <div className="text-center body-semibold-pequeno py-6">
                  Nenhuma triagem encontrada com esses filtros.
                </div>

              ) : ( 
                <>
                
                  <div className="flex flex-col gap-4">
                    {paginaDados.map((analise) => {
                      const doacao = analise.item_doacao.doacao;
                      const item = analise.item_doacao;
                      const voluntario = analise.voluntario_triagem;

                      return (
                        
                        <div key={`${analise.id}-${item.id}`} className="relative border rounded-lg p-4 bg-white flex flex-col gap-3">

                          <div className="flex justify-between items-start">

                            <div className="flex flex-col">

                              <span className="font-bold mt-2">Doação #{doacao.id}</span>

                              {/* tags */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-2 mt-2 w-full">
                                
                                {/* datas */}
                                <p className="body-muito-pequeno w-full">
                                  <strong className="body-semibold-muito-pequeno">Doação registrada em: </strong>
                                  <span>{formatarData(doacao.created_at)}</span>
                                </p>

                              
                                <p className="body-muito-pequeno w-full text-left sm:text-right">
                                  <strong className="body-semibold-muito-pequeno">Triado em: </strong>
                                  <span>{formatarData(doacao.created_at)}</span>
                                </p>

                                {/* status */}
                                <p className="body-muito-pequeno w-full">
                                  <strong className="body-semibold-muito-pequeno">Status da triagem: </strong>
                                  {analise.em_quarentena ? (
                                    <span className={`tag ${corStatus("EM_QUARENTENA")}`}>
                                      {formatarStatus("EM_QUARENTENA")}
                                    </span>
                                  ) : (
                                    <span className={`tag ${corStatus(analise.resultado || "")}`}>
                                      {formatarStatus(analise.resultado || "Sem Avaliação")}
                                    </span>
                                  )}
                                </p>
                            
                                <p className="body-muito-pequeno w-full text-left sm:text-right">
                                  <strong className="body-semibold-muito-pequeno">Status da doação: </strong>
                                  <span className={`tag ${corStatus(doacao.status)}`}>
                                    {formatarStatus(doacao.status)}
                                  </span>
                                </p>
                                
                              </div>
                            </div>

                          </div>
                          <div>

                            <button onClick={() => toggleTriagem(analise.id)} aria-label="Botão para expandir ou recolher informações da triagem" className="absolute top-2 right-2 text-xs sm:text-sm text-black body-semibold-muito-pequeno sm:body-semibold-pequeno px-2 py-1 rounded-full bg-[var(--base-30)] hover:bg-[var(--base-40)] transition">
                                {triagemAberta[analise.id] ? "Recolher ▲" : "Expandir ▼"}
                            </button>

                            {/* itens da doação */}
                            {triagemAberta[analise.id] && (
                              <div className="w-full max-w-4xl bg-white rounded-2xl shadow-md p-2 sm:p-4 border border-[var(--base-40)] flex flex-col gap-4">
            
                                <h2 className="body-bold-medio text-center">
                                  Informações da Doação #{doacao.id}
                                </h2>
            
                                {/* Observação do doador */}
                                {doacao.observacao_doador && (
                                  <div className="border-t pt-3">
                                    <h4 className="body-bold-muito-pequeno sm:body-bold-pequeno mb-2 text-center">
                                      Observação do doador
                                    </h4>
                                    <p className="body-muito-pequeno sm:body-pequeno text-center">
                                      {doacao.observacao_doador}
                                    </p>
                                  </div>
                                )}
            
                                {/* Itens da doação */}
                                <div className="border-t pt-3">
                                  <h4 className="body-bold-muito-pequeno sm:body-bold-pequeno mb-2 text-center">
                                    Itens doados
                                  </h4>
                        
                                  <div className="flex flex-col gap-4">

                                    {[item].map((item, idx) => (
                                      
                                      <div key={`${doacao.id}-${item.id}`} className="relative border rounded-lg p-3 bg-[var(--base-10)] flex flex-col gap-2" >
            
                                        <p className="body-muito-pequeno sm:body-pequeno mt-8 sm:mt-4 text-center">
                                          <strong className="body-semibold-muito-pequeno sm:body-semibold-pequeno">Item {idx + 1} - Tipo:</strong> {item.tipo_material}
                                        </p>
            
                                        <p className="body-muito-pequeno sm:body-pequeno">
                                          <strong className="body-semibold-muito-pequeno sm:body-semibold-pequeno">Descrição:</strong> {item.descricao}
                                        </p>
            
                                        <p className="body-muito-pequeno sm:body-pequeno">
                                          <strong className="body-semibold-muito-pequeno sm:body-semibold-pequeno">Possíveis defeitos:</strong> {item.possiveis_defeitos || "Nenhum informado"}
                                        </p>
            
                                        <p className="body-muito-pequeno sm:body-pequeno">
                                          <strong className="body-semibold-muito-pequeno sm:body-semibold-pequeno">Quantidade:</strong> {item.quantidade}
                                        </p>
            
                                        {/* Fotos */}
                                        {item.fotos.length > 0 && (
                                          <div>
                                            <p className="body-muito-pequeno sm:body-pequeno mb-1">
                                              <strong className="body-semibold-muito-pequeno sm:body-semibold-pequeno">Fotos:</strong>
                                            </p>
            
                                            <div className="flex flex-wrap gap-2">
                                              {item.fotos.map((foto: { id: number; url: string }, index: number) => (
                                                <img key={`${item.id}-${foto.id}`} src={foto.url} alt={`Foto ${index + 1} do item`} tabIndex={0} role="button" onClick={() => abrirImagem(item.fotos.map((f: { url: string }) => f.url), index)} 
                                                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); abrirImagem(item.fotos.map((f: { url: string }) => f.url), index);}}}
                                                className=" w-24 h-24 object-cover rounded-md border cursor-pointer hover:scale-110 hover:shadow-md transition focus:outline-none focus:ring-2 focus:ring-[var(--base-50)]"/>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                        
                                        <p className="body-muito-pequeno sm:body-pequeno">
                                          <strong className="body-semibold-muito-pequeno sm:body-semibold-pequeno">Registrado em:</strong> {formatarData(doacao.created_at)}
                                        </p>
            
                                        {/* Só mostrar data de atualização se a doação já foi triada */}
                                        {avaliacoes[item.id]?.length > 0 && (
                                          <p className="body-muito-pequeno sm:body-pequeno">
                                            <strong className="body-semibold-muito-pequeno sm:body-semibold-pequeno">Atualizado em:</strong> {formatarData(doacao.updated_at)}
                                          </p>
                                        )}
                                                    
                                        {avaliacoes[item.id]?.length > 0 && (
            
                                          <div>
            
                                            <button onClick={() => toggleHistorico(item.id)} aria-label="Botão para expandir ou recolher histórico da doação" className="absolute top-2 right-2 text-xs sm:text-sm text-black body-semibold-muito-pequeno sm:body-semibold-pequeno px-2 py-1 rounded-full bg-[var(--base-30)] hover:bg-[var(--base-40)] transition">
                                              {historicoAberto[item.id] ? "Ocultar histórico" : "Ver histórico"}
                                            </button>
            
                                            {/* histórico */}
                                            {historicoAberto[item.id] && (
                                              <>
                                                <div className="border-t pt-3"></div>
            
                                                <div>
                                                  <h4 className="body-bold-muito-pequeno sm:body-bold-pequeno mb-3 text-center"> Histórico de Triagem desse Item </h4>
                                                </div>
                        
                                                <div className="mt-2">
                                                  {avaliacoes[item.id].map((av) => (      
                            
                                                    <div key={av.id} className="bg-gray-50 border rounded p-2 mb-2">
          
                                                      <p className="body-muito-pequeno sm:body-pequeno">
                                                        <strong className="body-semibold-muito-pequeno sm:body-semibold-pequeno">Triado em:</strong> {formatarData(av.created_at)}
                                                      </p>
          
                                                      <p className="body-muito-pequeno sm:body-pequeno">
                                                        <strong className="body-semibold-muito-pequeno sm:body-semibold-pequeno">Triado por:</strong> {av.voluntario_triagem?.nome_completo}
                                                      </p>
          
                                                      <p className="body-muito-pequeno sm:body-pequeno">
                                                        <strong className="body-semibold-muito-pequeno sm:body-semibold-pequeno">Voluntário estava em quarentena:</strong> {av.em_quarentena ? "Sim" : "Não"}
                                                      </p>
          
                                                      <p className="body-muito-pequeno sm:body-pequeno">
                                                        <strong className="body-semibold-muito-pequeno sm:body-semibold-pequeno">Resultado da Triagem:</strong> {av.resultado}
                                                      </p>
          
                                                      <div className="mt-2 mb-2">
                                                        <p className="body-semibold-muito-pequeno sm:body-semibold-pequeno">Checklist:</p>
          
                                                        <ul className="mt-1 flex flex-col gap-1">
                                                          {itensChecklist.map((texto, index) => {
                                                            const valor = av.checklist?.[index] === true;
          
                                                            return (
                                                              <li key={index} className="body-muito-pequeno sm:body-pequeno flex items-center gap-2">
                                                                <span className={valor ? "text-[var(--cor-resposta-correta)]" : "text-[var(--cor-resposta-errada)]"}>
                                                                  {valor ? "✔" : "✖"}
                                                                </span>
                                                                <span>{texto}</span>
                                                              </li>
                                                            );
                                                          })}
                                                        </ul>
                                                      </div>
          
                                                      {av.comentario && (
                                                        <p className="body-muito-pequeno sm:body-pequeno">
                                                          <strong className="body-semibold-muito-pequeno sm:body-semibold-pequeno">Comentário:</strong> {av.comentario}
                                                        </p>
                                                      )}
          
                                                      {av.motivo_inaptidao && (
                                                        <p className="body-muito-pequeno sm:body-pequeno">
                                                          <strong className="body-semibold-muito-pequeno sm:body-semibold-pequeno">Motivo de ser inapto:</strong> {av.motivo_inaptidao}
                                                        </p>
                                                      )}
          
                                                    </div>
                                                  ))}
                                                </div>
                                              </>
                                            )}
        
                                          </div>
                                        )}

                                        <div className="border-t pt-3 mt-3 flex flex-col gap-2">

                                          <div>
                                            <h4 className="body-bold-muito-pequeno sm:body-bold-pequeno mb-3 text-center">Validar decisão do voluntário </h4>
                                          </div>

                                          <textarea placeholder="Feedback do coordenador (opcional)" maxLength={5000} className="input-padrao" onChange={(e) => setValidacao(prev => ({ ...prev, [analise.id]: { ...prev[analise.id], comentario_coordenador: e.target.value}}))}/>

                                          <div className="flex gap-3 justify-center flex-wrap mt-4">
                                            <div className="flex-1">
                                              <Botao variante="apto_selecionado" className="h-8 w-full" desabilitado={!analise.id || bloqueioAuditoria[analise.id]} aoClicar={() => {if (!analise.id) return; setAnaliseId(analise.id); setMostrarModalConfirmar(true);}}>Concordar</Botao>
                                            </div>

                                            <div className="flex-1">
                                              <Botao variante="inapto_selecionado" className="h-8 w-full" desabilitado={!analise.id || bloqueioAuditoria[analise.id]} aoClicar={() => {if (!analise.id) return; setAnaliseId(analise.id); setMostrarModalDiscordar(true);}}>Discordar</Botao>
                                            </div>
                                          </div>
                                        </div>
          
                                      </div>
                                    ))}
                                  </div> 
                                  
                                </div>
                                
                              </div>
                          
                            )}
                          </div>
                        </div>
                    
                      );
                    })}
                  </div>
                </>
              )}
              
              <Paginacao
                paginaAtual={paginaAtual}
                totalPaginas={totalPaginas}
                setPagina={setPaginaAtual}
              />

              <ModalConfirmacao
                aberto={mostrarModalConfirmar}
                titulo="Confirmar finalização da triagem"
                descricao={`Deseja confirmar a decisão desta triagem?`}
                botaoCancelar="Cancelar"
                botaoConfirmar="Confirmar"
                varianteConfirmar="confirmar"
                varianteCancelar="cancelar"
                onCancelar={() => setMostrarModalConfirmar(false)}
                onConfirmar={() => {
                  if (analiseId !== null) {
                    revisar(analiseId, true);
                  }
                  setMostrarModalConfirmar(false);
                }}
              />
              
              <ModalConfirmacao
                aberto={mostrarModalDiscordar}
                titulo="Discordar da triagem"
                descricao="Tem certeza que deseja que refaçam a triagem?"
                botaoCancelar="Não"
                botaoConfirmar="Sim"
                varianteConfirmar="confirmar"
                varianteCancelar="cancelar"
                onCancelar={() => setMostrarModalDiscordar(false)}
                onConfirmar={() => {
                  if (analiseId !== null) {
                    revisar(analiseId, false);
                  }
                  setMostrarModalDiscordar(false);
                }}
              />
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
export default AuditoriaTriagensQuarentena;