import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import logo from "../assets/logo.svg";
import { obterDoacao } from "../services/triagemService";
import { Doacao } from "../context/DoacaoContext";
import Toast from "../components/Toast";
import ModalConfirmacao from "../components/ModalConfirmacao";

function Triagem() {

  const { id } = useParams();
  const [doacao, setDoacao] = useState<Doacao | null>(null);
  const [carregando, setCarregando] = useState(true);

  const [mensagem, setMensagem] = useState("");
  const [tipoMensagem, setTipoMensagem] = useState<"sucesso" | "erro">("sucesso");

  const [mostrarModalFinal, setMostrarModalFinal] = useState(false);
  const [carregandoFinalizacao, setCarregandoFinalizacao] = useState(false);

  const [checklist, setChecklist] = useState<Record<number, boolean>>({});
  const [statusTriagem, setStatusTriagem] = useState<string | null>(null);
  const [observacaoTriagem, setObservacaoTriagem] = useState("");

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

  const [modalArquivoAberto, setModalArquivoAberto] = useState(false);
  const [arquivoSelecionado, setArquivoSelecionado] = useState<string | null>(null);

  function abrirDocumento(url: string) {
    setArquivoSelecionado(url);
    setModalArquivoAberto(true);
  }

  function fecharModal() {
    setModalArquivoAberto(false);
    setArquivoSelecionado(null);
  }

  useEffect(() => {
    async function carregar() {
      try {
        if (!id) return;

        const resposta = await obterDoacao(Number(id));
        setDoacao(resposta.data);
      } catch (erro) {
        console.error("Erro ao carregar doação:", erro);
      } finally {
        setCarregando(false);
      }
    }

    carregar();
  }, [id]);

  async function finalizarTriagem() {
    setCarregandoFinalizacao(true);

    try {
      // chamar depois o backend para salvar a triagem, usando checklist, statusTriagem e observacaoTriagem
      console.log({
        checklist,
        statusTriagem,
        observacaoTriagem,
      });

      setMensagem("Triagem finalizada com sucesso!");
      setTipoMensagem("sucesso");

      setMostrarModalFinal(false);

    } catch (e) {
      console.error(e);

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
                  Carregando links...
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
                        <h4 className="body-bold-pequeno mb-2 text-center">
                          Observação do doador
                        </h4>
                        <p className="body-pequeno text-center">
                          {doacao.observacao_doador}
                        </p>
                      </div>
                    )}

                    {/* Itens da doação */}
                    <div className="border-t pt-3">
                      <h4 className="body-bold-pequeno mb-2 text-center">
                        Itens doados
                      </h4>

                      <div className="flex flex-col gap-4">
                        {doacao.itens.map((item) => (
                          <div key={item.id} className="border rounded-lg p-3 bg-[var(--base-10)] flex flex-col gap-2" >
                            <p className="body-pequeno">
                              <strong>Tipo:</strong> {item.tipo_material}
                            </p>

                            <p className="body-pequeno">
                              <strong>Descrição:</strong> {item.descricao}
                            </p>

                            <p className="body-pequeno">
                              <strong>Quantidade:</strong> {item.quantidade}
                            </p>

                            {/* Fotos */}
                            {item.fotos.length > 0 && (
                              <div>
                                <p className="body-pequeno mb-1">
                                  <strong>Fotos:</strong>
                                </p>

                                <div className="flex flex-wrap gap-2">
                                  {item.fotos.map((foto) => (
                                    <img key={foto.id} src={foto.url} alt="Foto do item" onClick={() => abrirDocumento(foto.url)} className="w-24 h-24 object-cover rounded-md border cursor-pointer hover:scale-105 transition" />
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="body-bold-pequeno mb-3 text-center"> Checklist de Triagem </h4>

                      <div className="flex flex-col gap-3">
                        {itensChecklist.map((item, index) => (
                          <label key={index} className="flex items-center gap-2 cursor-pointer" >
                            <input type="checkbox" checked={!!checklist[index]} onChange={() => toggleChecklist(index)} />
                            <span className="body-pequeno">{item}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="border-t pt-4 flex flex-col gap-3">

                      <h4 className="body-bold-pequeno text-center">
                        Resultado da Triagem
                      </h4>

                      <div className="flex gap-3 justify-center flex-wrap">

                        <button onClick={() => setStatusTriagem("apto")} className="px-4 py-2 btn-apto-selecionado">Apto</button>

                        <button onClick={() => setStatusTriagem("inapto")} className="px-4 py-2 btn-inapto-selecionado">Inapto</button>

                        <button onClick={() => setStatusTriagem("incompleto")} className="px-4 py-2 btn-incompleto-selecionado">Incompleto</button>

                      </div>
                    </div>

                    {(statusTriagem === "inapto" || statusTriagem === "incompleto") && (
                      <div className="border-t pt-4 flex flex-col gap-2">

                        <h4 className="body-bold-pequeno text-center">
                          Observação obrigatória
                        </h4>

                        <textarea value={observacaoTriagem} onChange={(e) => setObservacaoTriagem(e.target.value)} className="border rounded p-2 w-full" placeholder="Descreva o que falta ou o problema encontrado..."/>

                        {observacaoTriagem.trim() === "" && (
                          <p className="text-red-500 text-sm text-center">
                            Observação obrigatória para este status
                          </p>
                        )}

                      </div>
                    )}

                    <button disabled={ (statusTriagem === "inapto" || statusTriagem === "incompleto") && observacaoTriagem.trim() === ""}
                      className="w-full mt-4 py-2 btn-confirmar rounded" onClick={() => setMostrarModalFinal(true)}>   {/* w-full mt-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50 */}
                      Finalizar Triagem
                    </button>

                  </div>
                </>
              )}

              <ModalConfirmacao
                aberto={mostrarModalFinal}
                titulo="Finalizar triagem"
                descricao="Tem certeza que deseja finalizar a triagem? Essa ação não poderá ser desfeita."
                botaoCancelar="Cancelar"
                botaoConfirmar="Finalizar"
                varianteCancelar="cancelar"
                varianteConfirmar="confirmar"
                onCancelar={() => setMostrarModalFinal(false)}
                onConfirmar={finalizarTriagem}
              />

            </div>
          </div>
        </div>
      </main>

      {/* footer */}
      <Footer />

      {modalArquivoAberto && arquivoSelecionado && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          
          <div className="bg-white w-[90%] h-[90%] rounded-lg relative overflow-hidden">

            {/* botão fechar */}
            <button
              onClick={fecharModal}
              className="absolute top-2 right-3 text-black text-2xl z-10"
            >
              ✕
            </button>

            {/* viewer automático */}
            {arquivoSelecionado.endsWith(".pdf") ? (
              <iframe
                src={arquivoSelecionado}
                className="w-full h-full"
              />
            ) : (
              <img
                src={arquivoSelecionado}
                className="w-full h-full object-contain bg-black"
              />
            )}

          </div>
        </div>
      )}
    </div>
  );
}
export default Triagem;