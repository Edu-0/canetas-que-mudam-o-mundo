import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useUsuario, mapearTipo, TipoUsuario } from "../context/UserContext";
import { atualizarTiposUsuario, criarONG, obterPerfil } from "../services/usuarioService";
import Header from "../components/Header";
import Footer from "../components/Footer";
import logo from "../assets/logo.svg";
import FormCadastroONG from "../components/FormCadastroONG";
import Toast from "../components/Toast";
import { useAvisoAlteracoesNaoSalvas } from "../hooks/useAvisoAlteracoesNaoSalvas";
import ModalConfirmacao from "../components/ModalConfirmacao";

function CadastroONG() {
  const navigate = useNavigate();
  const { usuario, definirUsuario } = useUsuario();
  const [mensagem, setMensagem] = useState("");
  const [tipoMensagem, setTipoMensagem] = useState<"sucesso" | "erro">("sucesso");

  const [dadosPendentes, setDadosPendentes] = useState<any>(null);
  const [mostrarConfirmacaoCadastro, setMostrarConfirmacaoCadastro] = useState(false);
  const [carregandoCadastro, setCarregandoCadastro] = useState(false);

  const {setAlterou, tentarSair, mostrarModal, setMostrarModal, } = useAvisoAlteracoesNaoSalvas({
    mensagem: "Você tem alterações não salvas. Deseja sair mesmo?",});

  const [erroModal, setErroModal] = useState<{
    campo?: string;
    mensagem: string;
  } | null>(null);


  async function colocarTipo() {
      if (usuario) {
        try {
          const usuarioAtualizado = await obterPerfil();
  
          const tiposAtuais: TipoUsuario[] =
            usuarioAtualizado.funcao?.map((f: any) =>
              mapearTipo(f.tipo_usuario)
            ) ||
            (usuarioAtualizado as any).tipos ||
            [];
  
          let novosTipos: TipoUsuario[] = tiposAtuais.includes("Coordenador de Processos")
            ? tiposAtuais
            : [...tiposAtuais, "Coordenador de Processos"];
  
          if (!novosTipos.includes("Genérico")) {
            novosTipos.push("Genérico");
          }
  
          await atualizarTiposUsuario(usuario.id, novosTipos);
  
          const atualizado = await obterPerfil();
  
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
            <img src={logo} alt="Logo" className="h-16 md:h-20" />
        
            <h1 className="header-medio text-center">
              Canetas que Mudam o Mundo
            </h1>
          </div>

          <div className="flex flex-col items-center px-4">

            {/* título do formulário */}
            <div className="w-full max-w-4xl bg-[var(--primario-5)] shadow-[2px_10px_40px_rgba(0,0,0,0.1)] rounded-lg p-6">

              <h2 className="header-pequeno text-center mb-6">
                CADASTRO DA ONG
              </h2>

              <FormCadastroONG
                mostrarCancelar={true}
                aoCancelar={() => tentarSair("/conta")}

                mudouDados={(dados) => {
                  const alterou = Object.values(dados).some((v) => v && v !== "");
                  setAlterou(alterou);
                }}

                aoEnviar={async (dados) => {
                  setDadosPendentes(dados);
                  setMostrarConfirmacaoCadastro(true);
                }}

                aoErro={(erro) => setErroModal(erro)}
              />

              <ModalConfirmacao
                aberto={mostrarModal}
                titulo="Alterações não salvas"
                descricao="Você tem alterações não salvas. Deseja sair mesmo?"
                botaoCancelar="Continuar editando"
                botaoConfirmar="Sair sem salvar"    
                varianteCancelar="confirmar"
                varianteConfirmar="cancelar"
                onCancelar={() => setMostrarModal(false)}
                onConfirmar={() => {
                  setMostrarModal(false);

                  const rota = sessionStorage.getItem("rotaDestino");
                  sessionStorage.removeItem("rotaDestino");

                  navigate(rota || "/conta");
                }}
              />

              <ModalConfirmacao
                aberto={mostrarConfirmacaoCadastro}
                titulo="Confirmar cadastro da ONG"
                descricao="Tem certeza que deseja cadastrar esta ONG?"
                botaoCancelar="Cancelar"
                botaoConfirmar={carregandoCadastro ? "Salvando..." : "Confirmar cadastro"}
                varianteCancelar="cancelar"
                varianteConfirmar="confirmar"
                onCancelar={() => setMostrarConfirmacaoCadastro(false)}
                onConfirmar={async () => {
                  if (!usuario || !dadosPendentes) return;

                  try {
                    setCarregandoCadastro(true);

                    const resposta = await criarONG(usuario.id, dadosPendentes);

                    await colocarTipo(); // atualizar tipos do usuário para Coordenador de Processos

                    setAlterou(false);
                    setMensagem("ONG cadastrada com sucesso!");
                    setTipoMensagem("sucesso");

                    setMostrarConfirmacaoCadastro(false);

                    setTimeout(() => {
                      navigate("/conta/link_para_voluntario", {
                        state: { link: resposta.link_convite }
                      });
                    }, 1500);

                  } catch (error: any) {
                    const erroBackend = error.response?.data?.detail;

                    if (erroBackend) {
                      setErroModal(erroBackend);
                    } else {
                      setErroModal({ mensagem: "Erro ao cadastrar ONG." });
                    }
                  } finally {
                    setCarregandoCadastro(false);
                  }
                }}
              />

              <ModalConfirmacao
                aberto={!!erroModal}
                titulo="Erro no cadastro da ONG"
                descricao={erroModal?.mensagem || ""}
                botaoConfirmar="Fechar"
                onCancelar={() => setErroModal(null)}
                onConfirmar={() => setErroModal(null)}
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
export default CadastroONG;

function definirUsuario(arg0: { id: any; nome_completo: any; data_nascimento: any; cpf: any; cep: any; telefone: any; email: any; data_cadastro: any; data_edicao_conta: any; tipos: any; }) {
  throw new Error("Function not implemented.");
}
