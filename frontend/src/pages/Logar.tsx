import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import api from "../services/api";
import logo from "../assets/logo.svg";
import { mapearTipo, useUsuario } from "../context/UserContext";
import Toast from "../components/Toast";
import Botao from "../components/Botao";
import { solicitarRedefinicaoSenha } from "../services/usuarioService";

function Logar() {
  const { definirUsuario } = useUsuario();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [tipoMensagem, setTipoMensagem] = useState<"sucesso" | "erro">("sucesso");

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

      const infoUsuario = await api.get("/auth/me", {
          headers: {
            Authorization: `${response.data.token_type} ${response.data.access_token}`,
          },
      });

      definirUsuario({
        id: infoUsuario.data.id,
        nome_completo: infoUsuario.data.nome_completo,
        data_nascimento: infoUsuario.data.data_nascimento,
        cpf: infoUsuario.data.cpf,
        cep: infoUsuario.data.cep,
        telefone: infoUsuario.data.telefone,
        email: infoUsuario.data.email,
        tipos: infoUsuario.data.funcao?.map((f: any) => mapearTipo(f.tipo_usuario)) || [], // a pessoa pode ter mais de uma função e quero pegar todas elas
        data_cadastro: new Date().toISOString()
      });

      // Redirecionar para a página de escolha de cadastro
      navigate("/conta");
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

  const handleEsqueciSenha = async () => {
    if (!email) {
      setMensagem("Digite seu email para recuperar a senha.");
      setTipoMensagem("erro");
      return;
    }

    try {
      await solicitarRedefinicaoSenha(email);

      setMensagem("Se o email estiver cadastrado, você receberá as instruções para redefinir a senha.");
      setTipoMensagem("sucesso");

    } catch {
      setMensagem("Erro ao solicitar recuperação de senha.");
      setTipoMensagem("erro");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--base-5)]">
      {/* header */}
      <Header />

      {/* body */}
      <main className="flex-1 flex items-center justify-center py-6 sm:py-8 md:py-12 px-3 sm:px-4 md:px-6 mt-16 sm:mt-20 md:mt-24">
        <div className="w-full max-w-md sm:max-w-lg md:max-w-2xl">
          <Toast mensagem={mensagem} tipo={tipoMensagem} />

         {/* título e logo da caneta */}
           <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap text-center mb-6 sm:mb-8">
            <img src={logo} alt="Logo Canetas que Mudam o Mundo" className="h-12 sm:h-16 md:h-20 flex-shrink-0" />
                 
            <h1 className="header-medio text-xl sm:text-2xl md:text-3xl leading-tight">
              Canetas que Mudam o Mundo
            </h1>
        </div>

          {/* Caixa de Login */}
          <div className="rounded-lg p-5 sm:p-8 md:p-12 bg-[var(--primario-5)] shadow-[2px_10px_40px_rgba(0,0,0,0.1)]">
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
                  Email: <span className="text-[var(--cor-resposta-obrigatoria)]">*</span>
                </label>
                <input
                  type="email"
                  autoComplete="email"
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
                  Senha: <span className="text-[var(--cor-resposta-obrigatoria)]">*</span>
                </label>
                <input
                  type="password"
                  autoComplete="current-password"
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
                  <span className="text-black">Esqueceu a sua senha? </span>
                  <button type="button" onClick={handleEsqueciSenha} className="text-[var(--cor-resposta-obrigatoria)] font-semibold hover:underline focus-acessivel">
                    Clique aqui
                  </button>
                </p>
                <p>
                  <span className="text-black">Ainda não tem um cadastro? </span>
                  <a href="/cadastro" className="text-[var(--cor-resposta-obrigatoria)] font-semibold hover:underline">
                    Clique aqui
                  </a>
                </p>
              </div>

              {/* Botões */}
              <div className="flex flex-col md:flex-row gap-4 mt-4">
                <div className="flex-1">
                  <Botao variante="cancelar" aoClicar={handleCancelar}>
                    Cancelar
                  </Botao>
                </div>

                <div className="flex-1">
                  <Botao
                    variante="confirmar"
                    tipo="submit"
                    desabilitado={carregando}
                  >
                    {carregando ? "Entrando..." : "Entrar"}
                  </Botao>
                </div>
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