import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import api from "../services/api";
import logo from "../assets/logo.svg";

function Logar() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const navigate = useNavigate();

  const handleEntrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    try {
      const response = await api.post("/auth/login", {
        email,
        senha,
      });

      // Salvar token no localStorage
      localStorage.setItem("access_token", response.data.access_token);
      localStorage.setItem("token_type", response.data.token_type);

      // Redirecionar para a página de escolha de cadastro
      navigate("/escolha-cadastro");
    } catch (err: any) {
      setErro(err.response?.data?.detail || "Erro ao fazer login. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  };

  const handleCancelar = () => {
    setEmail("");
    setSenha("");
    setErro("");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--base-5)]">
      {/* header */}
      <Header />

      {/* body */}
      <main className="flex-1 flex items-center justify-center py-6 sm:py-8 md:py-12 px-3 sm:px-4 md:px-6 mt-16 sm:mt-20 md:mt-24">
        <div className="w-full max-w-md sm:max-w-lg md:max-w-2xl">
         {/* título e logo da caneta */}
           <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap text-center mb-6 sm:mb-8">
            <img src={logo} alt="Logo" className="h-12 sm:h-16 md:h-20 flex-shrink-0" />
                 
            <h1 className="header-medio text-xl sm:text-2xl md:text-3xl leading-tight">
              Canetas que Mudam o Mundo
            </h1>
        </div>

          {/* Caixa de Login */}
          <div className="bg-white rounded-lg shadow-lg p-5 sm:p-8 md:p-12">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-6 sm:mb-8">LOGIN</h2>

            {/* Mensagem de erro */}
            {erro && (
              <div className="mb-4 p-3 sm:p-4 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm sm:text-base">
                {erro}
              </div>
            )}

            <form onSubmit={handleEntrar} className="space-y-4 sm:space-y-6">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block font-semibold mb-2 text-sm sm:text-base">
                  Email: <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  placeholder="Digite aqui o seu email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm sm:text-base"
                  required
                  disabled={carregando}
                />
              </div>

              {/* Senha */}
              <div>
                <label htmlFor="senha" className="block font-semibold mb-2 text-sm sm:text-base">
                  Senha: <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  id="senha"
                  placeholder="Digite aqui a sua senha"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm sm:text-base"
                  required
                  disabled={carregando}
                />
              </div>

              {/* Links de ajuda */}
              <div className="space-y-2 text-xs sm:text-sm">
                <p>
                  <span className="text-gray-700">Esqueceu a sua senha? </span>
                  <a href="#" className="text-orange-500 font-semibold hover:underline">
                    Clique aqui
                  </a>
                </p>
                <p>
                  <span className="text-gray-700">Ainda não tem um cadastro? </span>
                  <a href="/cadastro" className="text-orange-500 font-semibold hover:underline">
                    Clique aqui
                  </a>
                </p>
              </div>

              {/* Botões */}
              <div className="flex gap-3 sm:gap-6 justify-center mt-6 sm:mt-8 flex-wrap">
                <button
                  type="button"
                  onClick={handleCancelar}
                  className="px-6 sm:px-8 py-2 bg-red-300 text-black font-semibold rounded-md hover:bg-red-400 transition-colors disabled:opacity-50 text-sm sm:text-base"
                  disabled={carregando}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 sm:px-8 py-2 bg-green-300 text-black font-semibold rounded-md hover:bg-green-400 transition-colors disabled:opacity-50 text-sm sm:text-base"
                  disabled={carregando}
                >
                  {carregando ? "Entrando..." : "Entrar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* footer */}
      <Footer />
    </div>
  );
}

export default Logar;