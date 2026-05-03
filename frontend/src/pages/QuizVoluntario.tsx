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
import { DadosUsuario, obterPerfil, atualizarTiposUsuario } from "../services/usuarioService";
import { enviarResultadoQuiz } from "../services/quizService";
import icon_documento from "../assets/icon_documento.png";
import icon_download from "../assets/icon_download.png";
import icon_check from "../assets/icon_check.png";

interface ImagemTeste {
  id: string;
  url: string;
}

const imagens: ImagemTeste[] = [
  { id: "1", url: "/quiz/img1.jpeg" },
  { id: "2", url: "/quiz/img2.jpeg" },
  { id: "3", url: "/quiz/img3.jpeg" }
];

const respostasCorretas: Record<string, "apto" | "inapto"> = {
  "1": "apto",
  "2": "inapto",
  "3": "inapto"
};

export default function QuizVoluntario() {
  const { usuario, definirUsuario } = useUsuario();
  const navigate = useNavigate();

  const [mensagem, setMensagem] = useState("");
  
  const {alterou, setAlterou, tentarSair, mostrarModal, setMostrarModal, } = useAvisoAlteracoesNaoSalvas({
    mensagem: "Você começou o quiz do voluntário da triagem. Deseja sair mesmo?",});

  const [tipoMensagem, setTipoMensagem] = useState<"sucesso" | "erro">("sucesso");

  const [passo, setPasso] = useState(1);
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [respostas, setRespostas] = useState<{[id: string]: "apto" | "inapto"}>({});
  const [feedback, setFeedback] = useState<string | null>(null);

  function confirmarSair() {
    setMostrarModal(false);

    const rota = sessionStorage.getItem("rotaDestino");
    sessionStorage.removeItem("rotaDestino");

    navigate(rota || "/conta");
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

  function marcarResposta(id: string, valor: "apto" | "inapto") {
    setRespostas(prev => ({ ...prev, [id]: valor }));
  }

  async function enviarRespostas() {
    if (Object.keys(respostas).length < 3) {
      setMensagem("Responda todas as imagens antes de continuar.");
      setTipoMensagem("erro");
      return;
    }

    let pontuacao = 0;

    Object.keys(respostas).forEach((id) => {
      if (respostas[id] === respostasCorretas[id]) {
        pontuacao++;
      }
    });

    const aprovado = pontuacao === imagens.length;

    const mensagemFinal = aprovado
      ? "Parabéns, seu perfil foi ativado!"
      : "Você não atingiu a pontuação mínima. Tente novamente quando estiver pronto.";

    setFeedback(mensagemFinal);

    setPasso(4);
    setAlterou(false);

    if (usuario) {
      try {
        await enviarResultadoQuiz(usuario.id, pontuacao);
        setMensagem("Respostas salvas com sucesso!");
        setTipoMensagem("sucesso");
      } catch (error: any) {
        if (error.response?.status === 400) {
          setMensagem("Você não atingiu a pontuação mínima!");
          setTipoMensagem("erro");
        } else {
          console.error("Erro ao salvar resultado", error);
          setMensagem("Erro ao salvar respostas.");
          setTipoMensagem("erro");
          return; // para não tentar atualizar tipo do usuário se falhou ao salvar resultado
        }
      }
    }

    if (aprovado && usuario) {
      try {
        const usuarioAtualizado: DadosUsuario = await obterPerfil();

        const tiposAtuais: TipoUsuario[] =
          usuarioAtualizado.funcao?.map((f: any) =>
            mapearTipo(f.tipo_usuario)
          ) ||
          (usuarioAtualizado as any).tipos ||
          [];

        let novosTipos: TipoUsuario[] = tiposAtuais.includes("Voluntário da triagem")
          ? tiposAtuais
          : [...tiposAtuais, "Voluntário da triagem"];

        if (!novosTipos.includes("Genérico")) {
          novosTipos.push("Genérico");
        }

        await atualizarTiposUsuario(usuario.id, novosTipos);

        // busca atualizado do backend
        const atualizado = await obterPerfil();

        // normaliza igual Conta
        const usuarioNormalizado = {
          id: atualizado.id,
          nome_completo: atualizado.nome_completo,
          data_nascimento: atualizado.data_nascimento,
          cpf: atualizado.cpf,
          cep: atualizado.cep,
          telefone: atualizado.telefone,
          email: atualizado.email,
          data_cadastro: atualizado.data_cadastro,
          data_edicao_conta: atualizado.data_edicao_conta,
          tipos: atualizado.funcao?.map((f: any) =>
            mapearTipo(f.tipo_usuario)
          ) || []
        };

        definirUsuario(usuarioNormalizado);

      } catch (error) {
        console.error("Erro ao atualizar tipo do usuário", error);
      }
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
            <img src={logo} alt="Logo Canetas que Mudam o Mundo" className="h-16 md:h-20" />
            <h1 className="header-medio text-center">Canetas que Mudam o Mundo</h1>
          </div>

          <div className="flex flex-col items-center px-4">
            <div className="w-full max-w-4xl bg-[var(--primario-5)] shadow-[2px_10px_40px_rgba(0,0,0,0.1)] rounded-lg p-6">
              <h2 className="header-pequeno text-center mb-6">QUIZ DE VOLUNTÁRIO</h2>

              {/* PASSO 1: Termo */}
              {passo === 1 && (
                <div className="flex flex-col gap-4">
                  <p className="body-semibold-pequeno">Termo:</p>
                  <p className="body-pequeno">
                    Eu, como voluntário da triagem, comprometo-me a respeitar todas as normas e procedimentos da organização, 
                    atuando com responsabilidade, ética e zelo. Declaro também que não divulgarei quaisquer informações 
                    confidenciais às quais tiver acesso durante minhas atividades.
                  </p>

                  <label className="flex items-center gap-3 cursor-pointer select-none">
  
                    {/* checkbox escondido */}
                    <input
                      type="checkbox"
                      checked={aceitouTermos}
                      onChange={() => setAceitouTermos(!aceitouTermos)}
                      className="hidden"
                    />

                    {/* caixa customizada */}
                    <div
                      className={`w-5 h-5 flex items-center justify-center rounded border-2 transition hover:scale-110
                        ${aceitouTermos 
                          ? "bg-[var(--base-40)] border-black" 
                          : "bg-white border-gray-400"}
                        `}
                    >
                      {aceitouTermos && (
                        <span className="text-white text-sm">
                          <img src={icon_check} alt="Botão de confirmação do termo" className="w-4 h-4 focus-acessivel"/>
                        </span>
                      )}
                    </div>

                    {/* texto */}
                    <span className="body-pequeno">
                      Li e aceito o termo acima.
                    </span>
                  </label>

                  <div className="flex flex-col md:flex-row gap-4 w-full">
                    <div className="flex-1">
                      <Botao variante="cancelar" aoClicar={() => tentarSair("/conta")}>Cancelar quiz</Botao>
                    </div>

                    <div className="flex-1">
                    <Botao variante="confirmar" desabilitado={!aceitouTermos} aoClicar={() => setPasso(2)}>Próximo</Botao>
                    </div>
                  </div>
                </div>
              )}

              {/* PASSO 2: PDF */}
              {passo === 2 && (
                <div className="flex flex-col gap-4">
                  <p className="body-pequeno">
                    Antes de prosseguir com o quiz, é importante que você leia o documento abaixo. 
                    Ele apresenta os padrões de qualidade e os critérios utilizados na triagem, garantindo que você esteja preparado 
                    para exercer suas atividades com segurança e responsabilidade.
                  </p>

                  <div className="flex justify-center focus-acessivel">
                    <div onClick={() => window.open("/quiz/Padroes_de_Qualidade_pre_estabelecidos.pdf", "_blank")} className="flex items-center justify-between gap-4 mb-5 px-6 py-4 bg-[var(--base-10)] border border-[var(--base-40)] rounded-lg shadow-sm hover:shadow-md transition w-full max-w-xl cursor-pointer group">
                      
                      <div className="flex items-center gap-4 overflow-hidden focus-acessivel">
                        <img src={icon_documento} alt="Documento dos Padrões de Qualidade" className="w-7 h-7"/>

                        <span className="truncate body-semibold-pequeno text-base">
                          Padrões de Qualidade pré estabelecidos.pdf
                        </span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // impede de abrir o PDF
                          const link = document.createElement("a");
                          link.href = "/quiz/Padroes_de_Qualidade_pre_estabelecidos.pdf";
                          link.download = "Padroes_de_Qualidade_pre_estabelecidos.pdf";
                          link.click();
                        }}
                        className="p-3 rounded-full hover:bg-[var(--base-20)] transition">
                        <img src={icon_download} alt="Download do documento dos Padrões de Qualidade" className="w-7 h-7 focus-acessivel"/>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row gap-4 w-full">
                    <div className="flex-1">
                      <Botao variante="cancelar" aoClicar={() => setPasso(1)}>Voltar</Botao>
                    </div>

                    <div className="flex-1">
                      <Botao variante="confirmar" aoClicar={() => setPasso(3)}>Próximo</Botao>
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
                      <img src={img.url} alt={`Teste ${img.id}`} className="max-h-96 object-contain rounded"/>

                      {/* botões apto e inapto */}
                      <div className="flex gap-4 w-full max-w-xs">
                        <Botao variante={respostas[img.id] === "inapto" ? "inapto_selecionado" : "cancelar"} aoClicar={() => marcarResposta(img.id, "inapto")}>Inapto</Botao>
                        <Botao variante={respostas[img.id] === "apto" ? "apto_selecionado" : "confirmar"} aoClicar={() => marcarResposta(img.id, "apto")}>Apto</Botao>
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
              {passo === 4 && (
                <div className="text-center flex flex-col gap-4">
                  <p className="text-lg font-semibold">
                    {feedback || "Processando resultado..."}
                  </p>

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