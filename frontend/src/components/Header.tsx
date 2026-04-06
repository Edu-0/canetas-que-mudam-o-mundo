import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useUsuario } from "../context/UserContext";
import logo_titulo from "../assets/logo_titulo.png";
import Botao from "./Botao";

type Props = {
  aoNavegar?: (rota: string) => void;
};

function Header({ aoNavegar }: Props) {
  
  const navigate = useNavigate();
  const location = useLocation(); // para saber qual página estamos e assim deixar o botão correspondente selecionado

  const [menuAberto, setMenuAberto] = useState(false); // controla abertura do menu mobile

  const { usuario } = useUsuario();

  let listaDeBotoes: { id: string; texto: string; rota: string }[] = [];

  // sempre tem início
  listaDeBotoes.push({ id: "inicio", texto: "Início", rota: "/" });

  if (!usuario) {
    listaDeBotoes.push(
      { id: "logar", texto: "Logar", rota: "/logar" },
      { id: "cadastro", texto: "Cadastro", rota: "/cadastro" }
    );
  } else {
    // exemplo pensando em futuro multi-tipo de usuário
    const tipos = Array.isArray(usuario.tipo) ? usuario.tipo : [usuario.tipo];

    if (tipos.includes("doador")) {
      listaDeBotoes.push({ id: "doar", texto: "Doar", rota: "/doar" });
    }

    if (tipos.includes("voluntario")) {
      listaDeBotoes.push({ id: "voluntario", texto: "Voluntariado", rota: "/triagem" });
    }

    if (tipos.includes("responsavel")) {
      listaDeBotoes.push({ id: "responsavel", texto: "Responsável", rota: "/pedido" });
    }

    // if (tipos.includes("coordenador")) {
    //   listaDeBotoes.push({ id: "coordenador", texto: "Coordenador", rota: "/coordenador" });
    // }

    // SEMPRE conta por último
    listaDeBotoes.push({ id: "conta", texto: "Conta", rota: "/conta" });
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

  function estaAtivo(rota: string) {
    if (rota === "/") return location.pathname === "/";
    return location.pathname.startsWith(rota);
  }

  function navegar(rota: string) {
    if (aoNavegar) {
      aoNavegar(rota);
    } else {
      navigate(rota);
    }
  }

  return (
    <header className="w-full bg-[var(--primario-10)] shadow-sm fixed top-0 left-0 z-50">
      
      <div className="flex items-center justify-between px-4 md:px-10 py-3">
        <img src={logo_titulo} alt="Logo" className="h-10 md:h-12 object-contain"/>

        {/* botões em tela de desktop */}
        <div className="hidden md:flex items-center gap-4">
          {listaDeBotoes.map((botao) => (
            <Botao
              key={botao.id}
              ativo={estaAtivo(botao.rota)}
              aoClicar={() => {navegar(botao.rota);}}
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
                  ativo={estaAtivo(botao.rota)}
                  aoClicar={() => {
                    setMenuAberto(false);
                    navegar(botao.rota);
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