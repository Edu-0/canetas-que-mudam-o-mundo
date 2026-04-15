import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUsuario, TipoUsuario, mapearTipo } from "../context/UserContext";
import Header from "../components/Header";
import Footer from "../components/Footer";
import logo from "../assets/logo.svg";
import Botao from "../components/Botao";
import { useAvisoAlteracoesNaoSalvas } from "../hooks/useAvisoAlteracoesNaoSalvas";
import Toast from "../components/Toast";
import ModalConfirmacao from "../components/ModalConfirmacao";
import { obterImagensQuiz, enviarRespostasQuiz  } from "../services/quizService";
import { DadosUsuario, obterUsuario, atualizarTiposUsuario } from "../services/usuarioService";

interface ImagemTeste {
  id: string;
  url: string;
}

export default function QuizVoluntario() {
  const { usuario, definirUsuario } = useUsuario();
  const navigate = useNavigate();

  const [mensagem, setMensagem] = useState("");
  const [tipoMensagem, setTipoMensagem] = useState<"sucesso" | "erro">("sucesso");

  const { alterou, setAlterou } = useAvisoAlteracoesNaoSalvas({ mensagem: "Você começou o quiz do voluntário da triagem. Deseja sair mesmo?" });
  const [mostrarModal, setMostrarModal] = useState(false);
  const [rotaDestino, setRotaDestino] = useState<string | null>(null);

  const [passo, setPasso] = useState(1);
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [imagens, setImagens] = useState<ImagemTeste[]>([]);
  const [respostas, setRespostas] = useState<{[id: string]: "apto" | "inapto"}>({});
  const [feedback, setFeedback] = useState<string | null>(null);

  // Função para tentar sair da página
  function tentarSair(rota: string) {
    if (alterou) {
      setMostrarModal(true);
      setRotaDestino(rota);
    } else {
      navigate(rota);
    }
  }

  function confirmarSair() {
    setMostrarModal(false);
    if (rotaDestino) navigate(rotaDestino);
  }

  // marca como "alterou" se o usuário avançar no quiz
  useEffect(() => {
    const iniciouQuiz =
      passo > 1 ||
      aceitouTermos ||
      Object.keys(respostas).length > 0;

    if (!alterou && iniciouQuiz) {
      setAlterou(true);
    }
  }, [passo, aceitouTermos, respostas, alterou, setAlterou]);

  // Carrega as imagens do quiz quando chegar no passo 3
  useEffect(() => {
    async function carregarImagens() {
      try {
        const data = await obterImagensQuiz();
        setImagens(data);
      } catch (error) {
        console.error("Erro ao carregar imagens", error);
        setMensagem("Não foi possível carregar as imagens.");
        setTipoMensagem("erro");
      }
    }

    if (passo === 3) carregarImagens();
  }, [passo]);

  function marcarResposta(id: string, valor: "apto" | "inapto") {
    setRespostas(prev => ({ ...prev, [id]: valor }));
  }

  async function enviarRespostas() {
    if (Object.keys(respostas).length < 3) {
      setMensagem("Responda todas as imagens antes de continuar.");
      setTipoMensagem("erro");
      return;
    }

    try {
      const data = await enviarRespostasQuiz(respostas);

      setFeedback(
        data.aprovado
          ? "Parabéns, seu perfil foi ativado!"
          : "Você não atingiu a pontuação mínima"
      );

      setMensagem(data.aprovado ? "Parabéns!" : "Tente novamente.");
      setTipoMensagem(data.aprovado ? "sucesso" : "erro");

      // se aprovado, adiciona o tipo "Voluntário da triagem" ao usuário no contexto
      if (data.aprovado && usuario) {
        // pega dados atualizados do backend
        const usuarioAtualizado: DadosUsuario = await obterUsuario(usuario.id);

        const tiposAtuais: TipoUsuario[] = usuarioAtualizado.funcao?.map((f: any) => mapearTipo(f.tipo_usuario)) || [];

        // evita duplicar tipo
        const novosTipos: TipoUsuario[] = tiposAtuais.includes("Voluntário da triagem")
          ? tiposAtuais
          : [...tiposAtuais, "Voluntário da triagem"];

        // salva no backend
        await atualizarTiposUsuario(usuario.id, novosTipos);

        // atualiza frontend
        definirUsuario({
          ...usuario,
          tipos: novosTipos
        });
      }

      setPasso(4);
      setAlterou(false);

    } catch (error) {
      console.error("Erro ao enviar respostas", error);
      setMensagem("Erro ao enviar respostas, tente novamente.");
      setTipoMensagem("erro");
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--base-5)]">
      {/* header */}
      <Header aoNavegar={tentarSair} />

      {/* body */}
      <main className="flex-1 pt-24 pb-10">
        <div className="w-full px-6 md:px-20 flex flex-col gap-10">
          <Toast mensagem={mensagem} tipo={tipoMensagem} />

          {/* título e logo da caneta */}
          <div className="flex items-center justify-center gap-4 flex-wrap text-center">
            <img src={logo} alt="Logo" className="h-16 md:h-20" />
            <h1 className="header-medio text-center">Canetas que Mudam o Mundo</h1>
          </div>

          <div className="flex flex-col items-center px-4">
            <div className="w-full max-w-4xl bg-[var(--primario-5)] shadow-[2px_10px_40px_rgba(0,0,0,0.1)] rounded-lg p-6">
              <h2 className="header-pequeno text-center mb-6">QUIZ DE VOLUNTÁRIO</h2>

              {/* PASSO 1: Termo */}
              {passo === 1 && (
                <div className="flex flex-col gap-4">
                  <p className="body-semibold-pequeno">Termo:</p>
                  <p className="body-pequeno">Eu como voluntário da triagem, vou respeitar as normas e procedimentos da organização. 
                    E não vou divulgar informações confidenciais.</p>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={aceitouTermos} onChange={() => setAceitouTermos(!aceitouTermos)} />
                    Li e aceito os termos
                  </label>

                  <Botao variante="quiz-proximo" desabilitado={!aceitouTermos} aoClicar={() => setPasso(2)}>Próximo</Botao>
                </div>
              )}

              {/* PASSO 2: PDF */}
              {passo === 2 && (
                <div className="flex flex-col gap-4">
                  <a href="/pdf/padroes-qualidade.pdf" target="_blank" className="px-4 py-2 bg-blue-500 text-white rounded text-center">Baixar PDF</a>
                  
                  <div className="flex flex-col md:flex-row gap-4 w-full">
                    <div className="flex-1">
                      <Botao variante="quiz-voltar" aoClicar={() => setPasso(1)}>Voltar</Botao>
                    </div>

                    <div className="flex-1">
                    <Botao variante="quiz-proximo" aoClicar={() => setPasso(3)}>Próximo</Botao>
                    </div>
                  </div>
                </div>
              )}

              {/* PASSO 3: Imagens */}
              {passo === 3 && (
                <div className="flex flex-col gap-8">
                  {imagens.slice(0, 3).map((img) => (
                    <div key={img.id} className="flex flex-col items-center gap-3">

                      {/* imagem */}
                      <img src={img.url} alt={`Teste ${img.id}`} className="max-h-56 object-contain rounded"/>

                      {/* botões apto e inapto */}
                      <div className="flex gap-4 w-full max-w-xs">
                        <Botao variante={respostas[img.id] === "apto" ? "tipo-selecionado" : "confirmar"} aoClicar={() => marcarResposta(img.id, "apto")}>Apto</Botao>
                        <Botao variante={respostas[img.id] === "inapto" ? "tipo-selecionado" : "cancelar"} aoClicar={() => marcarResposta(img.id, "inapto")}>Inapto</Botao>
                      </div>
                    </div>
                  ))}

                  {/* botões de navegação */}
                  <div className="flex gap-4">
                    <Botao variante="cancelar" aoClicar={() => setPasso(2)}>Voltar</Botao>

                    <Botao variante="confirmar" aoClicar={enviarRespostas} desabilitado={Object.keys(respostas).length < 3}>Finalizar teste</Botao>
                  </div>

                </div>
              )}

              {/* PASSO 4: Feedback */}
              {passo === 4 && feedback && (
                <div className="text-center flex flex-col gap-4">
                  <p className="text-lg font-semibold">{feedback}</p>

                  <Botao variante="confirmar" aoClicar={() => navigate("/conta")}>Voltar para a conta</Botao>
                </div>
              )}

            </div>
          </div>
        </div>
      </main>

      {/* footer */}
      <Footer />

      <ModalConfirmacao
        aberto={mostrarModal}
        titulo="Sair do quiz?"
        descricao="Você começou o quiz do voluntário da triagem. Deseja sair mesmo?"
        botaoCancelar="Cancelar"
        botaoConfirmar="Confirmar saída"
        onCancelar={() => setMostrarModal(false)}
        onConfirmar={confirmarSair}
      />
    </div>
  );
}