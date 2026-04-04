import { useNavigate } from "react-router-dom";
import { useUsuario } from "../context/UserContext";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Botao from "../components/Botao";
import logo from "../assets/logo.svg";

function Conta() {
  const { usuario, definirUsuario } = useUsuario();
  const navigate = useNavigate();

  function sair() {
    definirUsuario(null);
    navigate("/");
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--base-5)]">

      <Header />

      <main className="flex-1 pt-24 flex flex-col items-center gap-6">
        <div className="w-full px-6 md:px-20 flex flex-col gap-10">

          {/* título e logo da caneta */}
          <div className="flex items-center justify-center gap-4 flex-wrap text-center">
            <img src={logo} alt="Logo" className="h-16 md:h-20" />
        
            <h1 className="header-medio text-center">
              Canetas que Mudam o Mundo
            </h1>
          </div>

          <div className="flex flex-col items-center px-4">

            <div className="w-full max-w-4xl bg-[var(--primario-5)] shadow-[2px_10px_40px_rgba(0,0,0,0.1)] rounded-lg p-6">
              <h2 className="header-medio text-center mb-6">
                CONTA
              </h2>

              {/* Informações da conta */}
              <div className="flex flex-col gap-2 mb-6">
                {usuario ? (
                  <>
                    <p>
                      <span className="body-semibold-pequeno">Email:</span>{" "}
                      <span className="body-pequeno">{usuario.email}</span>
                    </p>

                    {usuario.tipo && (
                      <p>
                        <span className="body-semibold-pequeno">Tipo:</span>{" "}
                        <span className="body-pequeno">{usuario.tipo}</span>
                      </p>
                    )}
                  </>
                ) : (
                  <p className="body-semibold-pequeno">
                    Nenhum usuário logado
                  </p>
                )}
              </div>


              {/* Editar, Excluir e Sair */}
              {usuario && (
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <Botao variante="editar" aoClicar={() => alert("Editar futuramente")}>Editar dados</Botao>
                  </div>

                  <div className="flex-1">
                    <Botao variante="cancelar" aoClicar={() => alert("Excluir futuramente")}>Excluir conta</Botao>
                  </div>
  
                  <div className="flex-1">
                    <Botao variante="sair" aoClicar={sair}>Sair</Botao>
                  </div>
                </div>
              )}

              {/* linha separadora */}
              <div className="border-t border-[var(--primario-40)] my-6" />

              <h3 className="header-pequeno text-center mb-6">
                Escolha seu tipo de conta
              </h3>

              {/* botões para os tipos de cadastros */}
              <div className="flex flex-col md:flex-row gap-4 w-full">
                <div className="flex-1">
                  <Botao aoClicar={() => navigate("/cadastro/doador")} variante="confirmar">Doador</Botao>
                </div>

                <div className="flex-1">
                  <Botao aoClicar={() => navigate("/cadastro/voluntario")} variante="confirmar">Voluntário</Botao>
                </div>

                <div className="flex-1">
                  <Botao aoClicar={() => navigate("/cadastro/responsavel")} variante="confirmar">Responsável</Botao>
                </div>
              </div>

            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}

export default Conta;