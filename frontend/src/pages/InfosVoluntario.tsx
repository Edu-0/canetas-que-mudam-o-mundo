import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import logo from "../assets/logo.svg";
import Botao from "../components/Botao";
import Toast from "../components/Toast";
import ModalConfirmacao from "../components/ModalConfirmacao";
import { AnaliseQuarentena } from "../services/triagemService";
import { deletarVoluntarioONG } from "../services/usuarioService";
import { obterVoluntarioONG } from "../services/usuarioService";
import { obterONG } from "../services/ongService";
import { useONG } from "../context/OngContext";

function AuditoriaVoluntario() {
  const { id } = useParams();
  const { ong, definirONG } = useONG();
  const voluntarioId = Number(id); // converte o id para número, já que os ids dos voluntários são numéricos
  const temIdValido = Number.isFinite(voluntarioId); // verifica se o id é um número válido (não é NaN, infinito, etc)

  const [voluntarioSelecionado, setVoluntarioSelecionado] = useState<number | null>(null);
  const navigate = useNavigate();
  const [voluntario, setVoluntario] = useState<any>(null);
  const [analises, setAnalises] = useState<AnaliseQuarentena[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState("");
  
  const [carregandoExclusao, setCarregandoExclusao] = useState(false);
  
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erroModal, setErroModal] = useState<{
    campo?: string;
    mensagem: string;
  } | null>(null);

  const [tipoMensagem, setTipoMensagem] = useState<"sucesso" | "erro">("sucesso");

  const emQuarentena = analises.some(a => a.em_quarentena);

  function formatarDataHora(data?: string) {
    if (!data) return "N/A";

    const iso = data.replace(" ", "T");
    const d = new Date(iso);

    const dataFormatada = d.toLocaleDateString("pt-BR");
    const horaFormatada = d.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return `${dataFormatada}`;
  }

  useEffect(() => {
    async function carregarVoluntario() {
      if (!temIdValido) {
        setCarregando(false);
        return;
      }

      setCarregando(true);
      setErroCarregamento("");

      try {
        // Sempre recarrega a ONG do usuário logado para evitar usar um valor antigo salvo no contexto/localStorage.
        const ongAtual = await obterONG();

        if (!ongAtual?.id) {
          setErroCarregamento("Não foi possível identificar a ONG do usuário logado.");
          return;
        }

        if (!ong || ong.id !== ongAtual.id) {
          definirONG(ongAtual);
        }

        const voluntario = await obterVoluntarioONG(ongAtual.id, voluntarioId);
        setVoluntario(voluntario);
      } catch (err) {
        console.error("Erro ao carregar voluntário:", err);

        const status = (err as any)?.response?.status;

        if (status === 403) {
          setErroCarregamento("Você não tem permissão para acessar os voluntários desta ONG.");
        } else if (status === 404) {
          setErroCarregamento("Voluntário não encontrado ou não pertence a esta ONG.");
        } else {
          setErroCarregamento("Não foi possível carregar os dados do voluntário.");
        }
      } finally {
        setCarregando(false);
      }
    }

    carregarVoluntario();
  }, [ong, definirONG, temIdValido, voluntarioId]);

  const nivelConfianca = voluntario?.nivel_confianca;
  const statusConfianca = nivelConfianca !== undefined && nivelConfianca < 10
    ? "Voluntário novato (Em quarentena)"
    : "Voluntário experiente";

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

              {!temIdValido && (
                <div className="border rounded p-4 mb-6 bg-white">
                  <p className="body-pequeno">
                    Nenhum voluntário foi selecionado.
                  </p>
                </div>
              )}

              {carregando && temIdValido && (
                <div className="border rounded p-4 mb-6 bg-white">
                  <p className="body-pequeno">Carregando dados do voluntário...</p>
                </div>
              )}

              {erroCarregamento && (
                <div className="border rounded p-4 mb-6 bg-white">
                  <p className="body-pequeno">{erroCarregamento}</p>
                </div>
              )}

              {/* Informação do voluntário selecionado */}
              {!carregando && voluntario && (
                <>
                  {emQuarentena && (
                    <div className="mb-4 p-3 bg-yellow-100 rounded">
                      Este voluntário está em quarentena. Revise suas decisões com atenção.
                    </div>
                  )}

                  <div className="border rounded p-4 mb-6 bg-white">
                    <p><strong>Nome:</strong> {voluntario.nome_completo}</p>

                    <p><strong>Email:</strong> {voluntario.email}</p>

                    <p><strong>Registrado em:</strong> {formatarDataHora(voluntario.data_cadastro)}</p>

                    <p><strong>Nível de confiança:</strong>{" "}
                      {nivelConfianca !== undefined ? nivelConfianca : "N/A"}
                    </p>

                    <p><strong>Classificação:</strong>{" "}
                      {statusConfianca}
                    </p>
                  </div>

                  <div className="flex flex-col md:flex-row gap-2 w-full">
                    <div className="w-full">
                      <Botao variante="confirmar" className="w-full" aoClicar={() => navigate(`/analise-voluntarios`)}>Voltar</Botao>
                    </div>

                    <div className="w-full">
                      <Botao variante="cancelar" className="w-full" desabilitado={carregandoExclusao} aoClicar={() => {setVoluntarioSelecionado(voluntario.id); setMostrarModal(true)}}>Desativar</Botao>
                    </div>
                    
                  </div>
                </>
              )}
              
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
                    await deletarVoluntarioONG(voluntarioSelecionado);
                    setMensagem("Voluntário desativado com sucesso!");
                    setTipoMensagem("sucesso");

                    // volta para a lista
                    setTimeout(() => {
                      navigate("/analise-voluntarios");
                    }, 800);

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
export default AuditoriaVoluntario;