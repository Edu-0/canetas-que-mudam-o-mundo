import { useSearchParams, useNavigate } from "react-router-dom";
import { useUsuario } from "../context/UserContext";
import { useState } from "react";
import logo from "../assets/logo.svg";
import Toast from "../components/Toast";
import FormTrocarSenha from "../components/FormTrocaSenha";
import { useAvisoAlteracoesNaoSalvas } from "../hooks/useAvisoAlteracoesNaoSalvas";
import ModalConfirmacao from "../components/ModalConfirmacao";
import { redefinirSenha } from "../services/usuarioService";
import Botao from "../components/Botao";

function TrocarSenha() {
  const { usuario, definirUsuario } = useUsuario();
  const navigate = useNavigate();
  
  const [params] = useSearchParams();
  const token = params.get("token");

  const [mensagem, setMensagem] = useState("");
  const { alterou, setAlterou } = useAvisoAlteracoesNaoSalvas({ mensagem: "Você tem alterações não salvas. Deseja sair mesmo?" });
  const [mostrarModal, setMostrarModal] = useState(false);
  const [rotaDestino, setRotaDestino] = useState<string | null>(null)

  const [tipoMensagem, setTipoMensagem] = useState<"sucesso" | "erro">("sucesso");

  const [erroModal, setErroModal] = useState<{
      campo?: string;
      mensagem: string;
    } | null>(null);

  if (!token) {
    return (
      <div className="min-h-screen flex flex-col overflow-x-hidden bg-[var(--base-5)]">
      
        {/* body */}
        <main className="flex-1 pt-24 pb-10">
          <div className="w-full px-6 md:px-20 flex flex-col gap-10">

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
                  TROCAR A SENHA DA CONTA
                </h2>

                <div>
                  <h2 className="body-pequeno text-center mb-6">Link para redefinir a senha inválido ou expirado</h2>
                  <Botao variante="cancelar" aria-label="Voltar para a tela de login" aoClicar={() => navigate("/logar")}>
                    Voltar para a tela de logar
                  </Botao>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>  
    );
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
    <div className="min-h-screen flex flex-col overflow-x-hidden bg-[var(--base-5)]">
      

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
                TROCAR A SENHA DA CONTA
              </h2>

              <FormTrocarSenha

                mudouDados={(dados) => {
                  const mudou = dados.senha.trim() !== "";
                  setAlterou(mudou);
                }}

                aoErro={(erro) => {
                  setErroModal(erro);
                }}

                aoEnviar={async (senha) => {
                  try {
                    await redefinirSenha(token, senha);

                    setAlterou(false);
                    setMensagem("Redefinição de senha salva com sucesso!");
                    setTipoMensagem("sucesso");

                    setTimeout(() => {
                      setMensagem("");
                      navigate("/logar");
                    }, 2000);

                  } catch (error: any) {
                    setErroModal({
                      mensagem: error.response?.data?.detail || "Erro ao redefinir senha"
                    });
                  }

                  setAlterou(false);
                  setMensagem("Redefinição de senha salva com sucesso!");
                  setTipoMensagem("sucesso");

                  setTimeout(() => {
                    setMensagem("");
                    navigate("/logar");
                  }, 2000);
                }}
              />

              <ModalConfirmacao
                aberto={mostrarModal}
                titulo="Alterações para a troca da senha não foram salvas"
                descricao="Você tem alterações não salvas. Deseja sair mesmo?"
                botaoCancelar="Continuar redefinindo a senha"
                botaoConfirmar="Sair sem redefinir a senha"    
                varianteCancelar="confirmar"
                varianteConfirmar="cancelar"
                onCancelar={() => setMostrarModal(false)}
                onConfirmar={() => {
                    setMostrarModal(false);
                    if (rotaDestino) navigate(rotaDestino);
                }}
              />

              <ModalConfirmacao
                aberto={!!erroModal}
                titulo="Erro para redefinir a senha"
                descricao={erroModal?.mensagem || ""}
                botaoConfirmar="Fechar"
                onCancelar={() => setErroModal(null)}
                onConfirmar={() => setErroModal(null)}
              />

            </div>
          </div>
        </div>
      </main>

    </div>
  );
}
export default TrocarSenha;