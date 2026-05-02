import Header from "../components/Header";
import Footer from "../components/Footer";
import logo from "../assets/logo.svg";
import icon_colar from "../assets/icon_colar.png";
import { useLocation } from "react-router-dom";

function LinkParaVoluntario() {
  const location = useLocation();
  const link = location.state?.link;

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

              <div className="flex justify-center focus-acessivel">
                <div className="flex items-center justify-between gap-4 mb-5 px-6 py-4 bg-[var(--base-10)] border border-[var(--base-40)] rounded-lg shadow-sm w-full max-w-xl cursor-pointer group">
                      
                  <div className="flex items-center gap-4 overflow-hidden focus-acessivel">
                    <p className="text-center">
                      O link para o cadastro do voluntário vinculado a ONG é: <br />
                      <a href="https://canetas-que-mudam-o-mundo.vercel.app/cadastro" className="text-blue-500 hover:text-blue-800 underline focus-acessivel" target="_blank" rel="noopener noreferrer">
                        https://canetas-que-mudam-o-mundo.vercel.app/cadastro
                      </a>

                      <a href={link} className="text-blue-500 hover:text-blue-800 underline focus-acessivel" target="_blank" rel="noopener noreferrer">
                        {link}
                      </a>
                    </p>
                  </div>
                
                  <button
                    onClick={(e) => { // copiar link para área de transferência
                      e.preventDefault();
                      navigator.clipboard.writeText(link);
                    }}
                    className="p-3 rounded-full hover:bg-[var(--base-20)] transition">
                    <img src={icon_colar} alt="Download do documento dos Padrões de Qualidade" className="w-7 h-7 focus-acessivel"/>
                  </button>
                </div>
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