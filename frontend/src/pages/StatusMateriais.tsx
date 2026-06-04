import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import logo from "../assets/logo.svg";
import Paginacao from "../components/Paginacao";
import Botao from "../components/Botao";
import Toast from "../components/Toast";
import ModalConfirmacao from "../components/ModalConfirmacao";
import {atualizarStatusDoacao, atualizarStatusPedido, ItemUnificado, obterPendencias, StatusMaterial, TipoItem } from "../services/statusMateriaisService";
import ModalImagem from "../components/ModalImagem";
import { dataNaoFutura, dataValida, intervaloDataValido } from "../utils/validacoesTriagem";
import { AvaliacaoTriagem } from "../services/triagemService";

function StatusMateriais() {
  const navigate = useNavigate();
  const [mostrarModal, setMostrarModal] = useState(false);
  const [modalTipo, setModalTipo] = useState<"cancelar" | "concluir" | null>(null);
  const [itemSelecionado, setItemSelecionado] = useState<ItemUnificado | null>(null);
  const [mensagem, setMensagem] = useState("");
  const [erroModal, setErroModal] = useState<{campo?: string; mensagem: string; } | null>(null);
  const [tipoMensagem, setTipoMensagem] = useState<"sucesso" | "erro">("sucesso");

  const [itens, setItens] = useState<ItemUnificado[]>([]);
  const [expandido, setExpandido] = useState<Record<number, boolean>>({});

  const [ordem, setOrdem] = useState<"asc" | "desc">("desc");
  const [codigoFiltro, setCodigoFiltro] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState<"TODOS" | TipoItem>("TODOS");
  const [statusFiltro, setStatusFiltro] = useState<"TODOS" | StatusMaterial>("TODOS");

  const ITENS_POR_PAGINA = 5;
  const [paginaAtual, setPaginaAtual] = useState(1);

  const [erroBusca, setErroBusca] = useState("");
  const [tocadoBusca, setTocadoBusca] = useState(false);

  const [bloqueioProcessamento, setBloqueioProcessamento] = useState<Record<number, boolean>>({});
  
  const [historicoAberto, setHistoricoAberto] = useState<Record<number, boolean>>({});
  const [avaliacoes, setAvaliacoes] = useState<Record<number, AvaliacaoTriagem[]>>({});
  const jaFoiTriada = Object.values(avaliacoes).some(arr => arr.length > 0); // verifica se algum item já tem avaliação de triagem

  const [checklistPorItem, setChecklistPorItem] = useState<Record<number, Record<number, boolean>>>({});
  const [observacaoPorItem, setObservacaoPorItem] = useState<Record<number, string>>({});
  const [comentarioOpcionalPorItem, setComentarioOpcionalPorItem] = useState<Record<number, string>>({});

  const itensChecklist = [
    "Material em boas condições",
    "Sem danos estruturais",
    "Quantidade compatível",
    "Fotos suficientes",
  ];

  function obterItensPreAprovados(itensDoacao: any[] | undefined) {
    if (!itensDoacao) return [];
    return itensDoacao.filter((item) => item.status === "PRE_APROVADO");
  }

  function obterItensCancelaveis(itensDoacao: any[] | undefined) {
    if (!itensDoacao) return [];
    return itensDoacao.filter((item) => item.status !== "MATERIAL_COLETADO");
  }

  function toggleHistorico(itemId: number) {
    setHistoricoAberto(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  }

  function toggleExpandir(id: number) {
    setExpandido(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  }

  function bloquearItem(id: number) {
    setBloqueioProcessamento(prev => ({
      ...prev,
      [id]: true
    }));
  }

  function desbloquearItem(id: number) {
    setBloqueioProcessamento(prev => ({
      ...prev,
      [id]: false
    }));
  }

  function abrirCancelar(item: ItemUnificado) {
    setItemSelecionado(item);
    setModalTipo("cancelar");
  }

  function abrirConcluir(item: ItemUnificado) {
    setItemSelecionado(item);
    setModalTipo("concluir");
  }

  const validarBusca = (valor: string) => {
    if (valor.length >= 50) 
      return "Você atingiu o limite máximo de 50 caracteres";
    if (!/^[\wÀ-ÿ\s./-]*$/.test(valor))
      return "Caracteres inválidos";
    return "";
  };

  async function carregarItens() {
    const res = await obterPendencias(ordem);

    const doacoes: ItemUnificado[] = res.data.doacoes_pre_aprovadas.map((d: any) => ({
      id: d.id,
      origem: "DOACAO",
      codigo_coleta: d.codigo_coleta,
      status: d.status,
      created_at: d.created_at,
      updated_at: d.updated_at,
      prazo_retirada_limite: d.prazo_retirada_limite,
      itens: d.itens,
      doador_nome: d.doador_nome, // tenta pegar o nome do doador diretamente ou via usuário
      responsavel_nome: d.responsavel_nome, // tenta pegar o nome do responsável diretamente ou via usuário
    }));

    const pedidos: ItemUnificado[] = res.data.pedidos_aguardando_retirada.map((p: any) => ({
      id: p.id,
      origem: "PEDIDO",
      codigo_coleta: p.codigo_coleta,
      status: p.status,
      created_at: p.created_at,
      updated_at: p.updated_at,
      prazo_retirada_limite: p.prazo_retirada_limite,
      itens: p.itens,
      doador_nome: p.doador_nome, // tenta pegar o nome do doador diretamente ou via usuário
      responsavel_nome: p.responsavel_nome, // tenta pegar o nome do responsável diretamente ou via usuário
    }));

    setItens([...doacoes, ...pedidos]);

    // reseta filtros e paginação ao recarregar itens
    setExpandido({});
    setPaginaAtual(1);
  }

  // useEffect(() => {
  //   async function carregar() {
  //     const res = await obterPendencias(ordem);

  //     const doacoes: ItemUnificado[] = res.data.doacoes_pre_aprovadas.map(
  //       (d: any) => ({
  //         id: d.id,
  //         origem: "DOACAO",
  //         codigo_coleta: d.codigo_coleta,
  //         status: d.status,
  //         created_at: d.created_at,
  //         itens: d.itens,
  //         doador_nome: d.doador_nome, // tenta pegar o nome do doador diretamente ou via usuário
  //         responsavel_nome: d.responsavel_nome, // tenta pegar o nome do responsável diretamente ou via usuário
  //       })
  //     );

  //     const pedidos: ItemUnificado[] = res.data.pedidos_aguardando_retirada.map(
  //       (p: any) => ({
  //         id: p.id,
  //         origem: "PEDIDO",
  //         codigo_coleta: p.codigo_coleta,
  //         status: p.status,
  //         created_at: p.created_at,
  //         itens: p.itens,
  //         doador_nome: p.doador_nome, // tenta pegar o nome do doador diretamente ou via usuário
  //         responsavel_nome: p.responsavel_nome, // tenta pegar o nome do responsável diretamente ou via usuário
  //       })
  //     );

  //     setItens([...doacoes, ...pedidos]);
  //   }

  //    carregar();
  // }, [ordem]);

  useEffect(() => {
    carregarItens();
  }, [ordem]);

  function aplicarFiltros(lista: ItemUnificado[]) {
    return lista.filter((i) => {
      const tipoOk = tipoFiltro === "TODOS" || i.origem === tipoFiltro;

      const statusOk = statusFiltro === "TODOS" || i.status === statusFiltro;

      const codigoValido = !erroBusca;
      const codigoOk = !codigoFiltro || (codigoValido && i.codigo_coleta?.toLowerCase().includes(codigoFiltro.toLowerCase()));
      
      return tipoOk && statusOk && codigoOk;
    });
  }

  const filtrados = aplicarFiltros(itens);
  
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / ITENS_POR_PAGINA));
  const pagina = filtrados.slice((paginaAtual - 1) * ITENS_POR_PAGINA, paginaAtual * ITENS_POR_PAGINA);

  function formatarStatus(status?: string) {
    if (!status) return "Sem avaliação";

    const mapaStatus: Record<string, string> = {
      PRE_APROVADO: "Pré aprovado",
      AGUARDANDO_RETIRADA: "Aguardando retirada",
    };

    if (mapaStatus[status]) {
      return mapaStatus[status];
    }

    return status.toLowerCase().replaceAll("_", " ");
  }

  function corStatus(status: string) {
    switch (status) {
      case "PRE_APROVADO":
        return "bg-yellow-100 text-black";

      case "AGUARDANDO_RETIRADA":
        return "bg-orange-100 text-black";

      default:
        return "bg-gray-100 text-black";
    }
  }

  async function concluir(item: ItemUnificado) {
    try {
      bloquearItem(item.id);
      console.log(`Processando ${item.origem} ${item.id} status ${item.status}...`);

      if (item.origem === "DOACAO") {
        const itensPreAprovados = obterItensPreAprovados(item.itens);
        if (itensPreAprovados.length === 0) {
          setMensagem("Nenhum item PRE_APROVADO disponível para disponibilizar.");
          setTipoMensagem("erro");
          desbloquearItem(item.id);
          return;
        }

        await Promise.all(
          itensPreAprovados.map((itemDoacao) =>
            atualizarStatusDoacao(itemDoacao.id, "DISPONIVEL")
          )
        );

        setMensagem("Itens da doação marcados como disponíveis para retirada!");
        setTipoMensagem("sucesso");   
        console.log(`Atualizado status da doação ${item.id} para DISPONIVEL`);
      } else {
        await atualizarStatusPedido(item.id, "MATERIAL_COLETADO");
        setMensagem("Pedido marcado como coletado!");
        setTipoMensagem("sucesso");
        console.log(`Atualizado status do pedido ${item.id} para MATERIAL_COLETADO`);
      }

      // remove da lista 
      setItens(prev => prev.filter(i => i.id !== item.id));
      await carregarItens(); // atualiza a lista

    } catch (err) {
      setMensagem("Erro ao finalizar processo");
      setTipoMensagem("erro");

      desbloquearItem(item.id);
    }
  }

  async function cancelar(item: ItemUnificado) {
    try {
      bloquearItem(item.id);

      if (item.origem === "DOACAO") {
        const itensCancelaveis = obterItensCancelaveis(item.itens);
        if (itensCancelaveis.length === 0) {
          setMensagem("Nenhum item disponível para cancelamento.");
          setTipoMensagem("erro");
          desbloquearItem(item.id);
          return;
        }

        await Promise.all(
          itensCancelaveis.map((itemDoacao) =>
            atualizarStatusDoacao(itemDoacao.id, "CANCELADO")
          )
        );

        setMensagem("Itens da doação cancelados!");
        setTipoMensagem("sucesso");
      } else {
        await atualizarStatusPedido(item.id, "CANCELADO");
        setMensagem("Pedido cancelado!");
        setTipoMensagem("sucesso");
      }

      setItens(prev => prev.filter(i => i.id !== item.id));
      await carregarItens();

    } catch (err) {
      setMensagem("Erro ao cancelar processo");
      setTipoMensagem("erro");

      desbloquearItem(item.id);
    }
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

  useEffect(() => {
    const total = Math.ceil(filtrados.length / ITENS_POR_PAGINA);

    if (paginaAtual > totalPaginas) {
      setPaginaAtual(totalPaginas);
    }
  }, [totalPaginas, paginaAtual]);


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
                STATUS DOS MATERIAIS
              </h2>

              
              <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch gap-3 mb-6 border rounded-lg bg-[var(--base-20)] border-[var(--base-70)] p-2">

                <div className="text-black text-2xl font-extrabold font-['Nunito'] flex items-center self-stretch">Filtros:</div>
  
                  <div className="justify-start w-full sm:w-56 flex flex-col">
                    <label className="body-muito-pequeno" htmlFor="busca-tipo">Buscar por código de coleta</label>
                    {/* busca por codigo de coleta */}
                    <input id="busca" type="text" maxLength={50} placeholder="Buscar por código de coleta..." value={codigoFiltro} onChange={(e) => { const valor = e.target.value; setCodigoFiltro(valor); setPaginaAtual(1); const erro = validarBusca(valor); setErroBusca(erro);}}
                      onBlur={() => setTocadoBusca(true)} className={`input-padrao h-9 w-full ${ tocadoBusca && erroBusca ? "border-[var(--cor-resposta-errada)] focus:ring-[var(--cor-resposta-errada)]" : "hover:border-2 border-[var(--base-70)] focus-acessivel"}`} aria-invalid={!!erroBusca} aria-label="Pesquisar por código de coleta"/>
                    
                    {tocadoBusca && erroBusca && <div className="text-[var(--cor-resposta-errada)] mt-1 text-sm">{erroBusca}</div>}
                  </div>

                  <div className="justify-start w-full sm:w-24 flex flex-col">
                    <label className="body-muito-pequeno" htmlFor="busca-tipo">Tipo</label>
                    {/* status */}
                    <select id="busca-tipo" value={tipoFiltro} onChange={(e) => { setTipoFiltro(e.target.value as any); setPaginaAtual(1);}} className="input-padrao h-9 w-full sm:w-24 hover:border-2 border-[var(--base-70)] focus-acessivel" aria-label="Selcionar por tipo doação ou pedido">
                      <option value="TODOS">Todos</option>
                      <option value="DOACAO">Doação</option>
                      <option value="PEDIDO">Pedido</option>
                    </select>
                  </div>

                  <div className="justify-start w-full sm:w-48 flex flex-col">
                    <label className="body-muito-pequeno" htmlFor="busca-status">Status</label>
                    {/* status */}
                    <select id="busca-status" value={statusFiltro} onChange={(e) => { setStatusFiltro(e.target.value as any); setPaginaAtual(1);}} className="input-padrao h-9 w-full sm:w-48 hover:border-2 border-[var(--base-70)] focus-acessivel" aria-label="Selcionar por status">
                      <option value="TODOS">Todos os status</option>
                      <option value="PRE_APROVADO">Pré aprovado</option>
                      <option value="AGUARDANDO_RETIRADA">Aguardando retirada</option>
                    </select>
                  </div>
  
                  <div className="justify-start w-full sm:w-44 flex flex-col">
                    <label className="body-muito-pequeno" htmlFor="busca-ordem">Ordem de exibição</label>
                    <select id="busca-ordem" value={ordem} onChange={(e) => { setOrdem(e.target.value as any); setPaginaAtual(1);}} className="input-padrao h-9 w-full sm:w-44 hover:border-2 border-[var(--base-70)] focus-acessivel" aria-label="Selcionar a ordem de exibição das doações">
                      <option value="desc">Mais novas</option>
                      <option value="asc">Mais antigas</option>
                    </select>
                  </div>
  
                </div>
  
                {itens.length === 0 ? (
                  <div className="text-center body-semibold-pequeno py-6">
                    Nenhuma entrega/coleta vinculada a esta ONG.
                  </div>

                ) : filtrados.length === 0 ? (
                  <div className="text-center body-semibold-pequeno py-6">
                    Nenhuma entrega/coleta encontrada com esses filtros.
                  </div>

                ) : (
                  <>

                    {/* LISTA */}
                    <div className="flex flex-col gap-4">

                      {pagina.map((i, index) => (
                        <div key={i.id} className="relative p-4 pt-8 bg-white rounded-lg border">

                          <span className="font-['Nunito'] font-semibold text-sm sm:text-base md:text-lg truncate mt-4">
                            {String((paginaAtual - 1) * ITENS_POR_PAGINA + index + 1).padStart(3, "0")} - {i.origem} #{i.id} {/* número sequencial considerando a paginação */}
                          </span>
                          {/* TAGS */}
                          <div className="flex gap-2">
                            <span className="px-2 py-1 bg-gray-200 text-xs rounded mt-2">{formatarStatus(i.status)}</span>
                          </div>

                          {i.codigo_coleta && (
                            <div>
                              <span className="body-muito-pequeno">
                                <strong className="body-semibold-muito-pequeno">Código: </strong>{i.codigo_coleta}
                              </span>
                            </div>
                          )}

                          {i.doador_nome && (
                            <div>
                              <span className="body-muito-pequeno">
                                <strong className="body-semibold-muito-pequeno">Nome do Doador: </strong>{i.doador_nome} {/* pega o nome do doador */}
                              </span>
                            </div>
                          )}

                          {i.responsavel_nome && (
                            <div>
                              <span className="body-muito-pequeno">
                                <strong className="body-semibold-muito-pequeno">Nome do Responsável: </strong>{i.responsavel_nome} {/* pega o nome do responsável pela triagem */}
                              </span>
                            </div>
                          )}

                          <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                            <div>
                              <span className="body-muito-pequeno">
                                <strong className="body-semibold-muito-pequeno">Registrado em: </strong>{formatarData(i.created_at)}
                              </span>
                            </div>

                            {i.prazo_retirada_limite && (
                              <div>
                                <span className="body-muito-pequeno">
                                  <strong className="body-semibold-muito-pequeno">Prazo para retirada: </strong>{formatarData(i.prazo_retirada_limite)}
                                </span>
                              </div>
                            )}
                            
                            {i.updated_at && (
                              <div>
                                <span className="body-muito-pequeno">
                                  <strong className="body-semibold-muito-pequeno">Última atualização: </strong>{formatarData(i.updated_at)}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* EXPANDIR */}
                          {expandido[i.id] && (
                            <div className="mt-3 p-2 rounded text-sm">
                              
                              {i.origem === "DOACAO" && (
                                <>

                                  <div className="w-full max-w-4xl bg-white rounded-2xl shadow-md p-4 sm:p-6 border border-[var(--base-40)] flex flex-col gap-4">
              
                                    {/* Itens da doação */}
                                    <div>
                                      <h4 className="body-bold-muito-pequeno sm:body-bold-pequeno mb-3 text-center">
                                        Itens da Doação #{i.id}
                                      </h4>
                
                                      <div className="flex flex-col gap-4">
                                      
                                        {i.itens?.map((item: any, idx: number) => (
                                          <div key={item.id} className="relative border rounded-lg p-3 bg-[var(--base-10)] flex flex-col gap-2" >
                
                                            <p className="body-muito-pequeno sm:body-pequeno mt-8 sm:mt-4 text-center">
                                              <strong className="body-semibold-muito-pequeno sm:body-semibold-pequeno">Item {idx + 1} - Tipo:</strong> {item.tipo_material}
                                            </p>
                
                                            <p className="body-muito-pequeno sm:body-pequeno">
                                              <strong className="body-semibold-muito-pequeno sm:body-semibold-pequeno">Descrição:</strong> {item.descricao}
                                            </p>
                
                                            <p className="body-muito-pequeno sm:body-pequeno">
                                              <strong className="body-semibold-muito-pequeno sm:body-semibold-pequeno">Quantidade:</strong> {item.quantidade}
                                            </p>
                
                                            {/* Fotos */}
                                            {item.fotos?.length > 0 && (
                                              <div>
                                                <p className="body-muito-pequeno sm:body-pequeno mb-1">
                                                  <strong className="body-semibold-muito-pequeno sm:body-semibold-pequeno">Fotos:</strong>
                                                </p>
                
                                                <div className="flex flex-wrap gap-2">
                                                  {item.fotos.map((foto: any, index: number) => (
                                                    <img key={foto.id} src={foto.url} alt={`Foto ${index + 1} do item`} tabIndex={0} role="button" onClick={() => abrirImagem(item.fotos?.map((f: any) => f?.url), index)} 
                                                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); abrirImagem(item.fotos?.map((f: any) => f?.url), index);}}} 
                                                    className=" w-24 h-24 object-cover rounded-md border cursor-pointer hover:scale-110 hover:shadow-md transition focus:outline-none focus:ring-2 focus:ring-[var(--base-50)]"/>
                                                  ))}
                                                </div>

                                              </div>
                                            )}
                
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </>
                              )}

                              {i.origem === "PEDIDO" && (
                                <>
                                  <div className="w-full max-w-4xl bg-white rounded-2xl shadow-md p-4 sm:p-6 border border-[var(--base-40)] flex flex-col gap-4">
                                    {/* Itens do Pedido */}
                                    <div className="border-t pt-3">
                                      <h4 className="body-bold-muito-pequeno sm:body-bold-pequeno mb-3 text-center">
                                        Itens do Pedido #{i.id}
                                      </h4>
                                    
                                      {i.itens?.map((item: any, idx: number) => (
                                              
                                        <div key={item.id} className="relative border rounded-lg p-3 bg-[var(--base-10)] flex flex-col gap-2" >
                  
                                          <p className="body-muito-pequeno sm:body-pequeno mt-8 sm:mt-4 text-center">
                                            <strong className="body-semibold-muito-pequeno sm:body-semibold-pequeno">Item {idx + 1} - Tipo:</strong> {item.tipo_material}
                                          </p>

                                          <p className="body-muito-pequeno sm:body-pequeno">
                                            <strong className="body-semibold-muito-pequeno sm:body-semibold-pequeno">Quantidade:</strong> {item.quantidade}
                                          </p>

                                        </div>
                                      
                                      ))}
                                    </div>
                                  </div>
                                </>
                              )}

                
                            </div>
                          )}

                          <div className="border-t pt-3 mt-6"></div>

                          <div>
                            <h4 className="body-bold-muito-pequeno sm:body-bold-pequeno mb-3 text-center">Gerenciar processo </h4>
                          </div>

                          {/* BOTÕES */}
                          <div className="flex gap-2">

                            <div>
                              <button onClick={() => toggleExpandir(i.id)} aria-label="Botão para expandir ou recolher informações" className="absolute top-2 right-2 text-xs sm:text-sm text-black body-semibold-muito-pequeno sm:body-semibold-pequeno px-2 py-1 rounded-full bg-[var(--base-30)] hover:bg-[var(--base-40)] transition">
                                {expandido[i.id] ? "Fechar" : "Expandir"}
                              </button>

                            </div>

                            <div className="flex gap-3 justify-center flex-wrap w-full">
                              <div className="flex-1">
                                <Botao variante="cancelar" desabilitado={bloqueioProcessamento[i.id]} aoClicar={() => abrirCancelar(i)}>Cancelar</Botao>
                              </div>

                              <div className="flex-1">
                              <Botao variante="confirmar" desabilitado={bloqueioProcessamento[i.id]} aoClicar={() => abrirConcluir(i)}> {i.origem === "DOACAO" ? "Doação entregue" : "Pedido coletado"}</Botao>
                              </div>
                            </div>
                          </div>

                        </div>
                      ))}
                    </div>

                  </>
                )}

                <Paginacao
                  paginaAtual={paginaAtual}
                  totalPaginas={totalPaginas}
                  setPagina={setPaginaAtual}
                />
                
                <ModalConfirmacao
                  aberto={modalTipo === "cancelar"}
                  titulo="Cancelar processo"
                  descricao="Tem certeza que deseja cancelar todo o processo envolvendo esse material? Essa ação não pode ser desfeita."
                  botaoCancelar="Manter ativo"
                  botaoConfirmar="Desativar"
                  varianteCancelar="confirmar"
                  varianteConfirmar="cancelar"
                  onCancelar={() => setModalTipo(null)} // só fecha o modal
                  onConfirmar={async () => {
                    if (itemSelecionado) await cancelar(itemSelecionado);
                    setModalTipo(null);
                  }}
                />

                <ModalConfirmacao
                  aberto={modalTipo === "concluir"}
                  titulo="Finalizar processo"
                  descricao="Tem certeza que deseja finalizar todo o processo envolvendo esse material? Essa ação não pode ser desfeita."
                  botaoCancelar="Cancelar"
                  botaoConfirmar="Finalizar"
                  varianteCancelar="cancelar"
                  varianteConfirmar="confirmar"
                  onCancelar={() => setModalTipo(null)} 
                  onConfirmar={async () => {
                    if (itemSelecionado) await concluir(itemSelecionado);
                    setModalTipo(null);
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
export default StatusMateriais;