import { useNavigate } from "react-router-dom";
import { useUsuario } from "../context/UserContext";
import type { Usuario } from "../context/UserContext";
import Header from "../components/Header";
import Footer from "../components/Footer";
import logo from "../assets/logo.svg";
import FormCadastroBase from "../components/FormCadastroBase";

function Cadastro() {
  const { definirUsuario } = useUsuario();
  const navigate = useNavigate();

  function handleSubmit(e: React.FormEvent) { // psso colocar o nome dess funcao para portugues?
    e.preventDefault();

    // simulação de cadastro
    const usuarioCriado: Usuario = {
      email: "teste@email.com",
      tipo: "generico",
    };

    definirUsuario(usuarioCriado); // salva o usuário no contexto global

    navigate("/conta"); // vai para próxima etapa
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

              <h2 className="header-medio text-center mb-6">
                CADASTRO
              </h2>

              <FormCadastroBase aoEnviar={(dados) => { definirUsuario({
                email: dados.email, tipo: "generico",});
                navigate("/conta");
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

export default Cadastro;