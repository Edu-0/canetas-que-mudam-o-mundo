import { useState } from "react";
import logo_titulo from "../assets/logo_titulo.png";

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="w-full bg-[var(--primario-10)] shadow-sm fixed top-0 left-0 z-50">
      
      <div className="flex items-center justify-between px-4 md:px-10 py-3">
        <img src={logo_titulo} alt="Logo" className="h-10 md:h-12 object-contain"/>
        {/* botões na tela grande */}
        <div className="hidden md:flex items-center gap-4">
          
          <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-[var(--primario-100)] to-[var(--secundario-100)] border border-[var(--secundario-100)] body-semibold-pequeno">
            Início
          </button>

          <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-[var(--base-40)] to-[var(--secundario-100)] border border-[var(--secundario-100)] body-semibold-pequeno">
            Logar
          </button>

          <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-[var(--base-40)] to-[var(--secundario-100)] border border-[var(--secundario-100)] body-semibold-pequeno">
            Se cadastrar
          </button>
        </div>

        {/* quando mobile, esconde os botões */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-2xl"
          aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
        >
          ☰
        </button>
      </div>

      {/* botoes no mobile */}
      {menuOpen && (
        <div id="mobile-menu" className="md:hidden flex flex-col items-center gap-3 pb-4">
          
          <button className="w-[90%] py-2 rounded-lg bg-gradient-to-r from-[var(--primario-100)] to-[var(--secundario-100)] body-semibold-pequeno">
            Início
          </button>

          <button className="w-[90%] py-2 rounded-lg bg-gradient-to-r from-[var(--base-40)] to-[var(--secundario-100)] body-semibold-pequeno">
            Logar
          </button>

          <button className="w-[90%] py-2 rounded-lg bg-gradient-to-r from-[var(--base-40)] to-[var(--secundario-100)] body-semibold-pequeno">
            Se cadastrar
          </button>
        </div>
      )}
    </header>
  );
}

export default Header;