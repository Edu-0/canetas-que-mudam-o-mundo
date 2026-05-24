import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import logo from "../assets/logo.svg";
import { Doacao } from "../context/DoacaoContext";
import Toast from "../components/Toast";
import ModalConfirmacao from "../components/ModalConfirmacao";
import icon_check from "../assets/icon_check.png";
import Botao from "../components/Botao";
import { obterDoacao, criarTriagem, ResultadoTriagem, StatusDoacao, obterAvaliacoes, AvaliacaoTriagem  } from "../services/triagemService";
import ModalImagem from "../components/ModalImagem";

function Triagem() {

  const { id } = useParams();
  const navigate = useNavigate();
  const [doacao, setDoacao] = useState<Doacao | null>(null);
  const [carregando, setCarregando] = useState(true);

  const [mensagem, setMensagem] = useState("");
  const [tipoMensagem, setTipoMensagem] = useState<"sucesso" | "erro">("sucesso");

  const [mostrarModalFinal, setMostrarModalFinal] = useState(false);
  const [mostrarModalCancelar, setMostrarModalCancelar] = useState(false);
  const [carregandoFinalizacao, setCarregandoFinalizacao] = useState(false);

  const [checklist, setChecklist] = useState<Record<number, boolean>>({});

  const [statusDoacao, setStatusDoacao] = useState<StatusDoacao | null>(null);
  const [statusTriagem, setStatusTriagem] = useState<ResultadoTriagem | null>(null);

  const [historicoAberto, setHistoricoAberto] = useState<Record<number, boolean>>({});
  const [observacaoTriagem, setObservacaoTriagem] = useState("");
  const [comentarioOpcional, setComentarioOpcional] = useState("");
  const [avaliacoes, setAvaliacoes] = useState<Record<number, AvaliacaoTriagem[]>>({});
  const jaFoiTriada = Object.values(avaliacoes).some(arr => arr.length > 0); // verifica se algum item já tem avaliação de triagem

  const itensChecklist = [
    "Material em boas condições",
    "Sem danos estruturais",
    "Quantidade compatível",
    "Fotos suficientes",
  ];

  function toggleChecklist(index: number) {
    setChecklist((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  }

  function toggleHistorico(itemId: number) {
    setHistoricoAberto(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  }

  function selecionarStatusDoacao(status: StatusDoacao) {
    setStatusDoacao((prev) => (prev === status ? null : status));
  }

  function selecionarStatusTriagem(status: ResultadoTriagem) {
    setStatusTriagem((prev) => (prev === status ? null : status));
  }

  const checklistCompleto = itensChecklist.length > 0 && itensChecklist.every((_, index) => checklist[index]);

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

  useEffect(() => {
    async function carregar() {
      try {
        if (!id) return;

        const resposta = await obterDoacao(Number(id));
        const dadosDoacao = resposta.data;

        setDoacao(dadosDoacao);

        const avaliacoesArray = await Promise.all(
          dadosDoacao.itens.map(async (item) => {
            try {
              const resp = await obterAvaliacoes(item.id);

              const ordenado = resp.data.sort(
                (a: AvaliacaoTriagem, b: AvaliacaoTriagem) =>
                  new Date(b.created_at).getTime() -
                  new Date(a.created_at).getTime()
              );

              return {
                itemId: item.id,
                data: ordenado,
              };
            } catch {
              return { itemId: item.id, data: [] };
            }
          })
        );

        const avaliacoesMap: Record<number, AvaliacaoTriagem[]> = {};
        avaliacoesArray.forEach(({ itemId, data }) => {
          avaliacoesMap[itemId] = data;
        });

        setAvaliacoes(avaliacoesMap);
      } catch (erro) {
        console.error("Erro ao carregar doação:", erro);
      } finally {
        setCarregando(false);
      }
    }

    carregar();
  }, [id]);

  async function finalizarTriagem() {
    if (!doacao || !statusDoacao) return;

    setCarregandoFinalizacao(true);

    try {
      const resultadoTriagem: ResultadoTriagem = statusDoacao === "PRE_APROVADO" ? "PRE_APROVADO" : "INAPTO";

      for (const item of doacao.itens) {
        console.log(`Criando triagem item ${item.id}`);

        await criarTriagem(item.id, {
          resultado: resultadoTriagem,
          checklist: checklist, 
          motivo_inaptidao: observacaoTriagem,
          comentario: comentarioOpcional || undefined, // enviar comentário apenas se tiver sido preenchido
          em_quarentena: false,
        });
      }

      setMensagem("Triagem finalizada com sucesso!");
      setTipoMensagem("sucesso");

      navigate("/lista-triagem");

    } catch (e: any) {
      console.error("Erro ao finalizar triagem:", e);
      console.log(e?.response?.data);

      setMensagem("Erro ao finalizar triagem.");
      setTipoMensagem("erro");
    } finally {
      setCarregandoFinalizacao(false);
    }
  }

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
                TRIAGEM DOS MATERIAIS DOADOS
              </h2>

              {carregando ? (
                <p className="text-center body-semibold-pequeno py-6">
                  Carregando informações...
                </p>

              ) : !doacao ? (
                <div className="text-center body-semibold-pequeno py-6">
                  Doação não encontrada!
                </div>
              ) : (
                <>
                
                  <div className="w-full max-w-4xl bg-white rounded-2xl shadow-md p-4 sm:p-6 border border-[var(--base-40)] flex flex-col gap-4">

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
                        {doacao.itens.map((item) => (
                          <div key={item.id} className="relative border rounded-lg p-3 bg-[var(--base-10)] flex flex-col gap-2" >
                            <p className="body-muito-pequeno sm:body-pequeno">
                              <strong className="body-semibold-muito-pequeno sm:body-semibold-pequeno">Tipo:</strong> {item.tipo_material}
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
                                  {item.fotos.map((foto, index) => (
                                    <img key={foto.id} src={foto.url} alt={`Foto ${index + 1} do item`} tabIndex={0} role="button" onClick={() => abrirImagem(item.fotos.map(f => f.url), index)} 
                                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); abrirImagem(item.fotos.map(f => f.url), index);}}}
                                    className=" w-24 h-24 object-cover rounded-md border cursor-pointer hover:scale-110 hover:shadow-md transition focus:outline-none focus:ring-2 focus:ring-[var(--base-50)]"/>
                                  ))}
                                </div>
                              </div>
                            )}

                            <p className="body-muito-pequeno sm:body-pequeno">
                              <strong className="body-semibold-muito-pequeno sm:body-semibold-pequeno">Registrado em:</strong> {formatarDataHora(doacao.created_at)}
                            </p>

                            {/* Só mostrar data de atualização se a doação já foi triada */}
                            {jaFoiTriada && (
                              <p className="body-muito-pequeno sm:body-pequeno">
                                <strong className="body-semibold-muito-pequeno sm:body-semibold-pequeno">Atualizado em:</strong> {formatarDataHora(doacao.updated_at)}
                              </p>
                            )}

                            
                            {avaliacoes[item.id]?.length > 0 && (
                              <div className="border-t pt-3">

                                {/* ultima triagem */}
                                {(() => {
                                  const ultima = avaliacoes[item.id][0];

                                  return (
                                    <div className="bg-white border rounded p-2 mb-2">
                                      <p className="body-muito-pequeno sm:body-pequeno">
                                        <strong className="body-semibold-muito-pequeno sm:body-semibold-pequeno">Última triagem:</strong> {ultima.resultado}
                                      </p>

                                      <p className="body-muito-pequeno sm:body-pequeno">
                                        <strong className="body-semibold-muito-pequeno sm:body-semibold-pequeno">Data:</strong> {formatarDataHora(ultima.created_at)}
                                      </p>

                                      <p className="body-muito-pequeno sm:body-pequeno">
                                        <strong className="body-semibold-muito-pequeno sm:body-semibold-pequeno">Triado por: </strong>{" "} {ultima.voluntario_triagem?.nome_completo} (ID: {ultima.voluntario_triagem_id})
                                      </p>
                                    </div>
                                  );
                                })()}

                                <button onClick={() => toggleHistorico(item.id)} aria-label="Botão para expandir ou recolher histórico da doação" className="absolute top-2 right-2 text-xs sm:text-sm text-black body-semibold-muito-pequeno sm:body-semibold-pequeno p-2 rounded-full bg-[var(--base-10)] hover:bg-[var(--base-20)] transition">
                                  {historicoAberto[item.id] ? "Ocultar histórico" : "Ver histórico"}
                                </button>

                                {/* histórico */}
                                {historicoAberto[item.id] && (
                                  <div className="mt-2">
                                    {avaliacoes[item.id].map((av) => (                                      
                                      
                                        <div key={av.id} className="bg-gray-50 border rounded p-2 mb-2">

                                          <p className="body-muito-pequeno sm:body-pequeno">
                                            <strong className="body-semibold-muito-pequeno sm:body-semibold-pequeno">Resultado:</strong> {av.resultado}
                                          </p>

                                          <p className="body-muito-pequeno sm:body-pequeno">
                                            <strong className="body-semibold-muito-pequeno sm:body-semibold-pequeno">Triado em:</strong> {formatarDataHora(av.created_at)}
                                          </p>

                                          <p className="body-muito-pequeno sm:body-pequeno">
                                            <strong className="body-semibold-muito-pequeno sm:body-semibold-pequeno">Triado por:</strong> {av.voluntario_triagem?.nome_completo} (ID: {av.voluntario_triagem_id})
                                          </p>

                                          {av.comentario && (
                                            <p className="body-muito-pequeno sm:body-pequeno">
                                              <strong className="body-semibold-muito-pequeno sm:body-semibold-pequeno">Comentário:</strong> {av.comentario}
                                            </p>
                                          )}

                                          {av.motivo_inaptidao && (
                                            <p className="body-muito-pequeno sm:body-pequeno">
                                              <strong className="body-semibold-muito-pequeno sm:body-semibold-pequeno">Motivo:</strong> {av.motivo_inaptidao}
                                            </p>
                                          )}

                                        </div>
                                    ))}
                                  </div>
                                )}

                              </div>
                            )}


                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="body-bold-muito-pequeno sm:body-bold-pequeno mb-3 text-center"> Checklist de Triagem </h4>

                      <div className="flex flex-col gap-3">
                        {itensChecklist.map((item, index) => (
                          <label key={index} className="flex items-center gap-2 cursor-pointer focus-within:ring-2 focus-within:ring-[var(--base-50)] rounded px-1" >
                            <input type="checkbox" checked={!!checklist[index]} onChange={() => toggleChecklist(index)} tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleChecklist(index);}}} className="sr-only"/>
                              <div className={`w-5 h-5 flex items-center justify-center rounded border-2 transition hover:scale-110 ${checklist[index]  ? "bg-[var(--base-40)] border-black"  : "bg-white border-gray-400"} `}>
                                  {checklist[index] && (
                                      <img src={icon_check} alt="Check" className="w-4 h-4" />
                                  )}
                              </div>
                            <span className="body-muito-pequeno sm:body-pequeno">{item}</span>
                          </label>
                          
                        ))}
                      </div>
                    </div>

                    <div className="body-muito-pequeno sm:text-[13px]">O botão para selecionar o status da triagem como 'Pré-aprovado' permanece bloqueado enquanto houver itens pendentes no checklist.</div>


                    <div className="border-t pt-4 flex flex-col gap-2">
                      <h4 className="body-bold-muito-pequeno sm:body-bold-pequeno text-center">
                        Comentário adicional (opcional)
                      </h4>

                      <textarea value={comentarioOpcional} onChange={(e) => setComentarioOpcional(e.target.value)} className="border rounded p-2 w-full" placeholder="Escreva algo adicional sobre a triagem (opcional)..."/>
                    </div>

                    <div className="border-t pt-4 flex flex-col gap-3">

                      <h4 className="body-bold-muito-pequeno sm:body-bold-pequeno text-center">
                        Resultado da Doação
                      </h4>

                      <div className="flex gap-3 justify-center flex-wrap">

                        {/* // Quero que os botoes estejam cinzas e se selecionado fiquem com a cor do que sao, ex apto_selecioando. E se outro boto for selecioando o que estava selecionado volta a cor cinza e o novo selecionado fica com a cor do status. E se clicar no mesmo botão selecionado ele desmarca e volta para cinza e o status fica nulo. E só pode selecionar um status por vez. */}
                        <div className="flex-1">
                          <Botao variante={statusDoacao === "PRE_APROVADO" ? "apto_selecionado" : "status-neutro"} className={statusDoacao === "PRE_APROVADO" ? "" : "btn-status-neutro btn-hover-apto"}  desabilitado={!checklistCompleto} aoClicar={() => {if (!checklistCompleto) return; selecionarStatusDoacao("PRE_APROVADO");}}>Pré-aprovado</Botao>
                        </div>
                      
                        <div className="flex-1">
                          <Botao variante={`${statusDoacao === "INAPTO" ? "inapto_selecionado" : "status-neutro"}`} className={statusDoacao === "INAPTO" ? "" : "btn-status-neutro btn-hover-inapto"} aoClicar={() => selecionarStatusDoacao("INAPTO")}>Inapto</Botao>
                        </div>

                        <div className="flex-1">
                          <Botao variante={`${statusDoacao === "INCOMPLETO" ? "incompleto_selecionado" : "status-neutro"}`} className={statusDoacao === "INCOMPLETO" ? "" : "btn-status-neutro btn-hover-incompleto"} aoClicar={() => selecionarStatusDoacao("INCOMPLETO")}>Incompleto</Botao>
                        </div>

                      </div>
                    </div>

                    {(statusDoacao === "INAPTO" || statusDoacao === "INCOMPLETO") && (
                      <div className="border-t pt-4 flex flex-col gap-2">

                        <h4 className="body-bold-muito-pequeno sm:body-bold-pequeno text-center">
                          Observação obrigatória
                        </h4>

                        <textarea value={observacaoTriagem} onChange={(e) => setObservacaoTriagem(e.target.value)} className="border rounded p-2 w-full" placeholder="Descreva o que falta ou o problema encontrado..."/>

                        {observacaoTriagem.trim() === "" ? (
                          <p className="text-[var(--cor-resposta-obrigatoria)] text-sm text-center">
                            Observação obrigatória para este status
                          </p>
                        ) : observacaoTriagem.trim().length > 0 && observacaoTriagem.trim().length < 20 ? (
                          <p className="text-[var(--cor-resposta-obrigatoria)] text-sm text-center">
                            A observação deve conter pelo menos 20 caracteres
                          </p>
                        ) : null}

                      </div>
                    )}

                    <div className="flex gap-3 justify-center flex-wrap mt-4">
                      <div className="flex-1">
                        <Botao variante="cancelar" className="w-full" aoClicar={() => setMostrarModalCancelar(true)}>  
                          Cancelar triagem
                        </Botao>
                      </div>

                      <div className="flex-1">
                        <Botao variante="confirmar" desabilitado={!statusDoacao || ((statusDoacao === "INAPTO" || statusDoacao === "INCOMPLETO") && observacaoTriagem.trim() === "")}
                          className="w-full" aoClicar={() => setMostrarModalFinal(true)}>  
                          Finalizar Triagem
                        </Botao>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <ModalConfirmacao
                aberto={mostrarModalFinal}
                titulo="Finalizar triagem"
                descricao={
                  `Resumo:\n` +
                  `• Status da doação: ${statusDoacao ?? "nenhum"}\n` +
                  `• Resultado triagem: ${statusDoacao === "PRE_APROVADO" ? "PRE_APROVADO" : "INAPTO"
                  }\n` +
                  `\nGostaria de finalizar a triagem?`
                }
                botaoCancelar="Cancelar"
                botaoConfirmar="Finalizar"
                varianteConfirmar="confirmar"
                varianteCancelar="cancelar"
                onCancelar={() => setMostrarModalFinal(false)}
                onConfirmar={finalizarTriagem}
              />

              <ModalConfirmacao
                aberto={mostrarModalCancelar}
                titulo="Cancelar triagem"
                descricao="Tem certeza que deseja cancelar a triagem?"
                botaoCancelar="Não"
                botaoConfirmar="Sim"
                varianteConfirmar="confirmar"
                varianteCancelar="cancelar"
                onCancelar={() => setMostrarModalCancelar(false)}
                onConfirmar={() => {  
                  setMostrarModalCancelar(false);

                  const rota = sessionStorage.getItem("rotaDestino");
                  sessionStorage.removeItem("rotaDestino");

                  navigate(rota || "/lista-triagem");
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
        onFechar={() => setModalImagemAberto(false)}
      />

    </div>
  );
}
export default Triagem;