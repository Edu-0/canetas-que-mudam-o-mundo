import { useState, useEffect } from "react";
import logo_titulo from "../assets/logo_titulo.png";
import Botao from "./Botao";

function Header() {
  
  const [menuAberto, setMenuAberto] = useState(false); // controla abertura do menu mobile
  const [botaoAtivo, setBotaoAtivo] = useState("inicio"); // controla qual botão está selecionado

  const listaDeBotoes = [ 
    { id: "inicio", texto: "Início" },
    { id: "login", texto: "Logar" },
    { id: "cadastro", texto: "Cadastrar" },
  ];

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
              ativo={botaoAtivo === botao.id}
              aoClicar={() => setBotaoAtivo(botao.id)}
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
                  ativo={botaoAtivo === botao.id}
                  aoClicar={() => {
                    setBotaoAtivo(botao.id);
                    setMenuAberto(false); // fecha ao clicar
                  }}
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