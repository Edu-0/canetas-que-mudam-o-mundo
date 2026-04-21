import { useNavigate } from "react-router-dom";
import { useUsuario } from "../context/UserContext";
import { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import logo from "../assets/logo.svg";
import Toast from "../components/Toast";
import FormCadastroBase from "../components/FormCadastroBase";
import { useAvisoAlteracoesNaoSalvas } from "../hooks/useAvisoAlteracoesNaoSalvas";
import ModalConfirmacao from "../components/ModalConfirmacao";

function EditarConta() {
  const { usuario, definirUsuario } = useUsuario();
  const navigate = useNavigate();
  const [mensagem, setMensagem] = useState("");
  
  const {setAlterou, tentarSair, mostrarModal, setMostrarModal, } = useAvisoAlteracoesNaoSalvas({
    mensagem: "Você tem alterações não salvas. Deseja sair mesmo?",});

  const [tipoMensagem, setTipoMensagem] = useState<"sucesso" | "erro">("sucesso");

  const [erroModal, setErroModal] = useState<{
    campo?: string;
    mensagem: string;
  } | null>(null);

  if (!usuario) {
    return <p>Nenhum usuário</p>;
  }

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden bg-[var(--base-5)]">
      
      {/* header */}
      <Header />

      {/* body */}
      <main className="flex-1 pt-24 pb-10">
        <div className="w-full px-6 md:px-20 flex flex-col gap-10">
          <Toast mensagem={mensagem} tipo={tipoMensagem} />

          {/* título e logo da caneta */}
          <div className="flex items-center justify-center gap-4 flex-wrap text-center">
            <img src={logo} alt="Logo Canetas que Mudam o Mundo" className="h-16 md:h-20" />
        
            <h1 className="header-medio text-center">
              Canetas que Mudam o Mundo
            </h1>
          </div>

          <div className="flex flex-col items-center px-4">

            {/* título do formulário */}
            <div className="w-full max-w-4xl bg-[var(--primario-5)] shadow-[2px_10px_40px_rgba(0,0,0,0.1)] rounded-lg p-6">

              <h2 className="header-pequeno text-center mb-6">
                EDITAR CONTA
              </h2>

              <FormCadastroBase
                modo="edicao"
                valoresIniciais={usuario}

                aoMensagemSucessoSenha={(msg) => {
                  setMensagem(msg);

                  setTimeout(() => {
                    setMensagem("");
                  }, 3000);
                }}
                
                mudouDados={(dados) => {
                  const mudou =
                    dados.nome_completo.trim() !== (usuario.nome_completo || "") ||
                    dados.data_nascimento.trim() !== (usuario.data_nascimento || "") ||
                    dados.cpf.replace(/\D/g, "") !== (usuario.cpf || "") ||
                    dados.cep.replace(/\D/g, "") !== (usuario.cep || "") ||
                    (dados.telefone || "").replace(/\D/g, "") !== (usuario.telefone || "") || // telefone é opcional, então comparo com string vazia se for undefined
                    dados.email.trim() !== (usuario.email || "");

                  setAlterou(mudou);
                }}

                textoBotaoCancelar="Cancelar edição"
                textoBotaoEnviar="Salvar alterações"
                mostrarCancelar={true}

                aoErro={(erro) => {
                  setErroModal(erro);
                }}

                aoCancelar={() => tentarSair("/conta")}

                aoEnviar={(usuarioAtualizado) => {
                  definirUsuario({
                    ...usuario,
                    ...usuarioAtualizado,
                  });

                  setAlterou(false);
                  setMensagem("Alterações salvas com sucesso!");
                  setTipoMensagem("sucesso");

                  setTimeout(() => {
                    setMensagem("");
                    navigate("/conta");
                  }, 2000);
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
                aberto={!!erroModal}
                titulo="Erro na edição"
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
export default EditarConta;