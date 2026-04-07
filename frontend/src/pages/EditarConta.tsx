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
  const { alterou, setAlterou } = useAvisoAlteracoesNaoSalvas({ mensagem: "Você tem alterações não salvas. Deseja sair mesmo?" });
  const [mostrarModal, setMostrarModal] = useState(false);
  const [rotaDestino, setRotaDestino] = useState<string | null>(null)

  if (!usuario) {
    return <p>Nenhum usuário</p>;
  }

  function tentarSair(rota: string) {
    if (alterou) {
        setRotaDestino(rota);
        setMostrarModal(true);
    } else {
        navigate(rota);
    }
    }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--base-5)]">
      
      {/* header */}
      <Header aoNavegar={tentarSair} />

      {/* body */}
      <main className="flex-1 pt-24 pb-10">
        <div className="w-full px-6 md:px-20 flex flex-col gap-10">
          <Toast mensagem={mensagem} tipo="sucesso" />

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
                EDITAR CONTA
              </h2>

              <FormCadastroBase
                modo="edicao"
                valoresIniciais={usuario}
                mudouDados={(dados) => {
                  const mudou =
                    dados.nome.trim() !== (usuario.nome || "") ||
                    dados.dataNascimento.trim() !== (usuario.dataNascimento || "") ||
                    dados.cpf.trim() !== (usuario.cpf || "") ||
                    dados.cep.trim() !== (usuario.cep || "") ||
                    dados.telefone.trim() !== (usuario.telefone || "") ||
                    dados.email.trim() !== (usuario.email || "") ||
                    dados.senha.trim() !== ""; // só se digitou senha nova

                  setAlterou(mudou);
                }}

                textoBotaoCancelar="Cancelar edição"
                textoBotaoEnviar="Salvar alterações"
                mostrarCancelar={true}

                aoCancelar={() => tentarSair("/conta")}

                aoEnviar={(dados) => {
                  const { senha, ...dadosSemSenha } = dados;

                  definirUsuario({
                    ...usuario, // mantém dataCadastro e tipo
                    ...dadosSemSenha,
                  });

                  setAlterou(false);
                  setMensagem("Alterações salvas com sucesso!");

                  setTimeout(() => {
                    setMensagem(""); // some o toast
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
                onCancelar={() => setMostrarModal(false)}
                onConfirmar={() => {
                    setMostrarModal(false);
                    if (rotaDestino) navigate(rotaDestino);
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
export default EditarConta;