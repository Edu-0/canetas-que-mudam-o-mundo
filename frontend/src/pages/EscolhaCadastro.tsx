import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

function EscolhaCadastro() {
  const navigate = useNavigate();

  const opcoes = [
    {
      label: "Doador",
      rota: "/cadastro-beneficiario",
      cor: "bg-green-200 hover:bg-green-300"
    },
    {
      label: "Beneficiário",
      rota: "/cadastro-beneficiario",
      cor: "bg-yellow-200 hover:bg-yellow-300"
    },
    {
      label: "Voluntário",
      rota: "/cadastro-beneficiario",
      cor: "bg-blue-200 hover:bg-blue-300"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--base-5)]">
      {/* header */}
      <Header />

      {/* body */}
      <main className="flex-1 flex items-center justify-center py-6 sm:py-8 md:py-12 px-3 sm:px-4 md:px-6 mt-16 sm:mt-20 md:mt-24">
        <div className="w-full max-w-6xl">
          <div className="flex flex-col items-center gap-12 md:gap-16">
            {/* Título */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center">
              Escolha qual cadastro você quer fazer:
            </h1>

            {/* Botões */}
            <div className="flex flex-col sm:flex-row gap-6 md:gap-8 justify-center flex-wrap w-full px-4">
              {opcoes.map((opcao) => (
                <button
                  key={opcao.label}
                  onClick={() => navigate(opcao.rota)}
                  className={`${opcao.cor} px-12 sm:px-16 md:px-20 py-8 md:py-10 text-2xl sm:text-3xl md:text-4xl font-semibold rounded-lg transition-all duration-300 border-2 border-gray-400 hover:border-gray-600 shadow-md hover:shadow-lg transform hover:scale-105`}
                >
                  {opcao.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* footer */}
      <Footer />
    </div>
  );
}

export default EscolhaCadastro;
