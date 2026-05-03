import Header from "../components/Header";
import Footer from "../components/Footer";
import logo from "../assets/logo.svg";
import icon_copiar from "../assets/icon_copiar.png";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import Botao from "../components/Botao";
import useLinkVoluntario from "../hooks/useLinkVoluntario";

function LinkParaVoluntario() {

  const navigate = useNavigate();
  const { link, carregando } = useLinkVoluntario();
  const [copiado, setCopiado] = useState(false);

  function copiarLink() {
    if (!link) return;

    navigator.clipboard.writeText(link);
    setCopiado(true);

    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--base-5)]">
      
      {/* header */}
      <Header />

      {/* body */}
      <main className="flex-1 pt-24 pb-10">
        <div className="w-full px-6 md:px-20 flex flex-col gap-10">

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
                LINK PARA O VOLUNTÁRIO
              </h2>

                {carregando ? (
                  <p className="text-center">Carregando link...</p>
                ) : !link ? (
                  <p className="text-center text-[var(--cor-resposta-errada)]">
                    Você ainda não possui uma ONG cadastrada.
                  </p>

                ) : (
                  <div className="flex justify-center">
                    <div className="flex items-center justify-between gap-4 px-6 py-4 bg-[var(--base-10)] border border-[var(--base-40)] rounded-lg shadow-sm w-full max-w-xl focus-acessivel">

                      <div className="flex flex-col overflow-hidden">
                        <p className="body-semibold-medio text-center mb-2">
                          Este é o link para o cadastro do voluntário vinculado a ONG, compartilhe este link com o voluntário:
                        </p>

                        <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-800 underline break-all text-center focus-acessivel">
                          {link}
                        </a>

                        {copiado && (
                          <span className="text-[var(--cor-resposta-sucesso)] text-xs text-center mt-1">Link copiado!</span>
                        )}
                      </div>

                      <button onClick={copiarLink} className="p-3 rounded-full hover:bg-[var(--base-20)] transition" aria-label="Copiar link">
                        <img src={icon_copiar} alt="Copiar link" className="w-7 h-7 focus-acessivel"/>
                      </button>
                    </div>
                  </div>
                )}
                <div className="flex gap-4 mt-8">
                  <Botao variante="confirmar" aoClicar={() => navigate("/conta")}>Voltar para a conta</Botao>
                </div>

            </div>
          </div>
        </div>
      </main>

      {/* footer */}
      <Footer />
    </div>
  );
}
export default LinkParaVoluntario;