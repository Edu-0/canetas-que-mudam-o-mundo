import { useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useUsuario } from "../context/UserContext";
import logo_titulo from "../assets/logo_titulo.png";
import Botao from "./Botao";


function Header(){
  
  const location = useLocation(); // para saber qual página estamos e assim deixar o botão correspondente selecionado

  const [menuAberto, setMenuAberto] = useState(false); // controla abertura do menu mobile
  const botaoMenuRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const { usuario } = useUsuario();

  let listaDeBotoes: { id: string; texto: string; rota: string }[] = [];

  // início sempre fica no começo da lista
  listaDeBotoes.push({ id: "inicio", texto: "Início", rota: "/" });
  listaDeBotoes.push({ id: "ongs", texto: "ONGs", rota: "/ongs" });

  if (!usuario) {
    listaDeBotoes.push(
      { id: "logar", texto: "Logar", rota: "/logar" },
      { id: "cadastro", texto: "Cadastro", rota: "/cadastro" }
    );
  } else {
    const tipos = usuario.tipos || [];

    // mapa de tipos
    const mapaTipos: Record<string, { id: string; texto: string; rota: string }[]> = {
    "Doador": [
      { id: "doar", texto: "Doar", rota: "/doar" }
    ],

    "Voluntário da triagem": [
      { id: "triagem", texto: "Triagem", rota: "/triagem" },
      { id: "montar_kits", texto: "Kits", rota: "/montar_kits" }
    ],

    "Responsável pelo beneficiário": [
      { id: "pedido", texto: "Pedido", rota: "/pedido" }
    ],

    "Coordenador de Processos": [
      { id: "relatorio", texto: "Relatório", rota: "/relatorio" },
      { id: "analise_voluntarios", texto: "Voluntários", rota: "/analise_voluntarios" },
      { id: "auditoria", texto: "Auditoria", rota: "/auditoria" }
    ]
  };

    const adicionados = new Set();

    tipos.forEach((tipo) => {
      if (tipo === "Genérico") return; // ignora

      const botoes = mapaTipos[tipo];
      
      if (botoes) {
        botoes.forEach((botao) => {
          if (!adicionados.has(botao.id)) { // verifica se o botão existe para o tipo e se já não foi adicionado
            listaDeBotoes.push(botao);
            adicionados.add(botao.id);
          }
        });
      }
    });

    // conta sempre por último para ficar no final da lista
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

      // focus trap
      if (menuAberto && e.key === "Tab" && menuRef.current) {
        const focaveis = menuRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (focaveis.length === 0) return;

        const primeiro = focaveis[0];
        const ultimo = focaveis[focaveis.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === primeiro) {
            e.preventDefault();
            ultimo.focus();
          }
        } else {
          if (document.activeElement === ultimo) {
            e.preventDefault();
            primeiro.focus();
          }
        }
      }
    }

    window.addEventListener("resize", handleResize);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuAberto]);

    // foco para abrir e fechar
  useEffect(() => {
    if (menuAberto && menuRef.current) {
      const primeiro = menuRef.current.querySelector<HTMLElement>(
        'button, [href]'
      );
      primeiro?.focus();
    }

    if (!menuAberto) {
      botaoMenuRef.current?.focus();
    }
  }, [menuAberto]);

  function estaAtivo(rota: string) {
    if (rota === "/") return location.pathname === "/";
    return location.pathname.startsWith(rota);
  }

  return (
    <header className="w-full bg-[var(--primario-10)] shadow-sm fixed top-0 left-0 z-50">
      
      <div className="flex items-center justify-between px-4 md:px-10 py-3">
        <img src={logo_titulo} alt="Logo Canetas que mudam o mundo" className="h-10 md:h-12 object-contain"/>

        {/* botões em tela de desktop */}
        <nav aria-label="Menu principal" className="hidden md:flex items-center gap-4">
          {listaDeBotoes.map((botao) => (
            <Botao
              key={botao.id}
              ativo={estaAtivo(botao.rota)}
              navegacao={botao.rota}
            >
              {botao.texto}
            </Botao>
          ))}
        </nav>

        {/* menu hamburguer para o mobile */}
        <button
          type="button"
          ref={botaoMenuRef}
          onClick={() => setMenuAberto(!menuAberto)}
          className="md:hidden text-2xl hover:scale-125 transition focus-acessivel"
          aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
          aria-expanded={menuAberto}
          aria-haspopup="true"
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
            aria-hidden="true" /* fica ignorado por leitor de tela */
          />

          {/* botões na lateral */}
          <div id="menu-lateral" ref={menuRef} role="dialog" aria-modal="true" aria-label="Menu de navegação" className="fixed top-0 right-0 h-full w-[250px] bg-[var(--primario-10)] z-50 shadow-lg flex flex-col">
            <div className="flex justify-between px-4 py-[14px] border-b border-[var(--primario-40)]">
              <span className="body-semibold-medio">Menu</span>
              <button
                type="button"
                onClick={() => setMenuAberto(false)}
                className="text-xl hover:scale-125 transition focus-acessivel"
                aria-label="Fechar menu"
              >
                ✕
              </button>
            </div>

            <nav aria-label="Menu principal" className="flex flex-col gap-4 mt-6 px-4">
              {listaDeBotoes.map((botao) => (
                <Botao
                  key={botao.id}
                  ativo={estaAtivo(botao.rota)}
                  navegacao={botao.rota}
                  aoClicar={() => {setMenuAberto(false);}}
                >
                  {botao.texto}
                </Botao>
              ))}
            </nav>
          </div>
        </>
      )}
    </header>
  );
}

export default Header;