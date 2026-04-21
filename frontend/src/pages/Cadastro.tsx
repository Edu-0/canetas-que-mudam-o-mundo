import { useNavigate } from "react-router-dom";
import { useUsuario, mapearTipo } from "../context/UserContext";
import { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import logo from "../assets/logo.svg";
import FormCadastroBase from "../components/FormCadastroBase";
import { useAvisoAlteracoesNaoSalvas } from "../hooks/useAvisoAlteracoesNaoSalvas";
import Toast from "../components/Toast";
import ModalConfirmacao from "../components/ModalConfirmacao";

function Cadastro() {
  const { definirUsuario } = useUsuario();
  const navigate = useNavigate();
  const [mensagem, setMensagem] = useState("");

  const {setAlterou, tentarSair, mostrarModal, setMostrarModal, } = useAvisoAlteracoesNaoSalvas({
    mensagem: "Você começou o cadastro. Deseja sair mesmo?",});

  const [tipoMensagem, setTipoMensagem] = useState<"sucesso" | "erro">("sucesso");

  const [erroModal, setErroModal] = useState<{
    campo?: string;
    mensagem: string;
  } | null>(null);


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
                CADASTRO
              </h2>

              <FormCadastroBase 
                modo="cadastro"

                mudouDados={(dados) => {
                  const mudou =
                    dados.nome_completo.trim() !== "" ||
                    dados.data_nascimento.trim() !== "" ||
                    dados.cpf.trim() !== "" ||
                    dados.cep.trim() !== "" ||
                    dados.telefone.trim() !== "" ||
                    dados.email.trim() !== "" ||
                    dados.senha.trim() !== "" ||
                    dados.confirmarSenha.trim() !== ""; 

                  setAlterou(mudou);
                }}

                textoBotaoCancelar="Cancelar cadastro"
                textoBotaoEnviar="Cadastrar"
                mostrarCancelar={true}

                aoErro={(erro) => {
                  setErroModal(erro);
                }}

                aoCancelar={() => tentarSair("/")}

                aoEnviar={(usuarioCadastrado) => {
                  definirUsuario({
                    id: usuarioCadastrado.id,
                    nome_completo: usuarioCadastrado.nome_completo,
                    data_nascimento: usuarioCadastrado.data_nascimento,
                    cpf: usuarioCadastrado.cpf,
                    cep: usuarioCadastrado.cep,
                    telefone: usuarioCadastrado.telefone,
                    email: usuarioCadastrado.email,
                    tipos: usuarioCadastrado.funcao?.map(f => mapearTipo(f.tipo_usuario)) || [], // a pessoa pode ter mais de uma função e quero pegar todas elas
                    data_cadastro: new Date().toISOString()
                  });

                  setAlterou(false); // reseta o estado de alteração para evitar alerta ao sair depois de cadastrar
                  setMensagem("Cadastro realizado com sucesso!");
                  setTipoMensagem("sucesso");

                  setTimeout(() => {
                    setMensagem(""); // some o toast
                    navigate("/conta");
                  }, 2000);
                }}
              />

              <ModalConfirmacao
                aberto={mostrarModal} // mostra o modal de erro se tiver erro e não estiver mostrando o modal de confirmação (para evitar os dois modais juntos)
                titulo="Alterações não salvas"
                descricao="Você começou o cadastro. Deseja sair mesmo?"
                botaoCancelar="Continuar cadastro"
                botaoConfirmar="Sair sem salvar o cadastro"
                varianteCancelar={"confirmar"}  
                varianteConfirmar={"cancelar"}
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
                titulo="Erro no cadastro"
                descricao={erroModal?.mensagem || ""}
                varianteCancelar={"cancelar"} 
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

export default Cadastro;