import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useUsuario } from "../context/UserContext";
import logo_titulo from "../assets/logo_titulo.png";
import Botao from "./Botao";

function Header() {
  
  const navigate = useNavigate();
  const location = useLocation(); // para saber qual página estamos e assim deixar o botão correspondente selecionado

  const [menuAberto, setMenuAberto] = useState(false); // controla abertura do menu mobile

  const { usuario } = useUsuario();

  let listaDeBotoes: { id: string; texto: string; rota: string }[] = [];

  if (!usuario) {
    listaDeBotoes = [
      { id: "inicio", texto: "Início", rota: "/" },
      { id: "logar", texto: "Logar", rota: "/logar" },
      { id: "cadastro", texto: "Cadastro", rota: "/cadastro" },
    ];
  } else if (usuario.tipo === "generico") {
    listaDeBotoes = [
      { id: "inicio", texto: "Início", rota: "/" },
      { id: "conta", texto: "Conta", rota: "/conta" },
    ];
  } else if (usuario.tipo === "doador") {
    listaDeBotoes = [
      { id: "inicio", texto: "Início", rota: "/" },
      { id: "doar", texto: "Doar", rota: "/doar" },
      { id: "conta", texto: "Conta", rota: "/conta" },
    ];
  }

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 768) {
        setMenuAberto(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMenuAberto(false);
      }
    }

    window.addEventListener("resize", handleResize);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <header className="w-full bg-[var(--primario-10)] shadow-sm fixed top-0 left-0 z-50">
      
      <div className="flex items-center justify-between px-4 md:px-10 py-3">
        <img src={logo_titulo} alt="Logo" className="h-10 md:h-12 object-contain"/>

        {/* botões em tela de desktop */}
        <div className="hidden md:flex items-center gap-4">
          {listaDeBotoes.map((botao) => (
            <Botao
              key={botao.id}
              ativo={location.pathname === botao.rota}
              aoClicar={() => navigate(botao.rota)}
            >
              {botao.texto}
            </Botao>
          ))}
        </div>

        {/* menu hamburguer para o mobile */}
        <button
          type="button"
          onClick={() => setMenuAberto(!menuAberto)}
          className="md:hidden text-2xl hover:scale-125 transition"
          aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
          aria-expanded={menuAberto}
          aria-controls="menu-lateral"
        >
          ☰
        </button>
      </div>

      {/* botões em tela de mobile */}
      {menuAberto && (
        <>
          {/* overlay escuro */}
          <div 
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setMenuAberto(false)}
          />

          {/* botões na lateral */}
          <div className="fixed top-0 right-0 h-full w-[250px] bg-[var(--primario-10)] z-50 shadow-lg flex flex-col">
            <div className="flex justify-between px-4 py-[14px] border-b border-[var(--primario-40)]">
              <span className="body-semibold-medio">Menu</span>
              <button
                type="button"
                onClick={() => setMenuAberto(false)}
                className="text-xl hover:scale-125 transition"
                aria-label="Fechar menu"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-4 mt-6 px-4">
              {listaDeBotoes.map((botao) => (
                <Botao
                  key={botao.id}
                  ativo={location.pathname === botao.rota}
                  aoClicar={() => {setMenuAberto(false); navigate(botao.rota);}}
                >
                  {botao.texto}
                </Botao>
              ))}
            </div>
          </div>
        </>
      )}
    </header>
  );
}

export default Header;