import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useUsuario, mapearTipo, TipoUsuario, Usuario } from "../context/UserContext";
import { atualizarTiposUsuario, criarONG, obterONG, obterPerfil } from "../services/usuarioService";
import Header from "../components/Header";
import Footer from "../components/Footer";
import logo from "../assets/logo.svg";
import FormCadastroONG from "../components/FormCadastroONG";
import Toast from "../components/Toast";
import { useAvisoAlteracoesNaoSalvas } from "../hooks/useAvisoAlteracoesNaoSalvas";
import ModalConfirmacao from "../components/ModalConfirmacao";
import {useONG } from "../context/OngContext";

function CadastroONG() {
  const navigate = useNavigate();
  const { usuario, definirUsuario } = useUsuario();
  const {ong, definirONG} = useONG();
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
                modo="cadastro"

                mudouDados={(dados) => {
                  const alterou =
                    dados.nome.trim() !== "" ||
                    dados.cnpj.trim() !== "" ||
                    dados.cep.trim() !== "" ||
                    dados.rua.trim() !== "" ||
                    dados.bairro.trim() !== "" ||
                    dados.cidade.trim() !== "" ||
                    dados.estado.trim() !== "" ||
                    dados.numero.trim() !== "" ||
                    dados.complemento.trim() !== "" ||
                    dados.telefone.trim() !== "" ||
                    dados.email.trim() !== "" ||
                    dados.diasFuncionamento.length > 0 ||
                    dados.horarioInicio.trim() !== "" ||
                    dados.horarioFim.trim() !== "" ||
                    dados.sobre.trim() !== "" ||
                    dados.instagram.trim() !== "" ||
                    dados.facebook.trim() !== "" ||
                    dados.site.trim() !== "";

                  setAlterou(alterou);
                }}
                
                textoBotaoCancelar="Cancelar cadastro"
                textoBotaoEnviar="Cadastrar ONG"
                mostrarCancelar={true}

                aoErro={(erro) => {
                  setErroModal(erro);
                }}

                aoCancelar={() => {
                  const podeSair = tentarSair("/conta");
                  if (podeSair) {
                    navigate("/conta");
                  }
                }}

                aoEnviar={async (dados) => {
                  setDadosPendentes(dados);
                  setMostrarConfirmacaoCadastro(true);
                }}
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

                    const resposta = await criarONG(dadosPendentes);

                    const ongCriada = await obterONG();
                    definirONG(ongCriada);

                    const perfilAtualizado = await obterPerfil();
                    definirUsuario(perfilAtualizado);

                    setAlterou(false);
                    setMensagem("ONG cadastrada com sucesso!");
                    setTipoMensagem("sucesso");

                    setMostrarConfirmacaoCadastro(false);

                    setTimeout(() => {
                      navigate("/conta/link-para-voluntario", {
                        state: { link: resposta.link_convite }
                      });
                    }, 1500);

                  } catch (error: any) {
                    const erroBackend = error.response?.data?.detail;
                    console.log("Erro no backend:", error.response?.data);

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