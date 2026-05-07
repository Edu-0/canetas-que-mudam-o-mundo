import { ReactNode } from "react";
import { Link } from "react-router-dom";

type PropriedadesBotao = {
  children: ReactNode; // o que tem dentro do botão
  ativo?: boolean; // se o botão está selecionado
  aoClicar?: () => void;
  variante?: "padrao" | "confirmar" | "cancelar" | "editar" | "sair" | "tipo-selecionado" | "apto_selecionado" | "inapto_selecionado" | "quiz-resposta" | "botao-pequeno-editar" | "botao-pequeno-confirmar" | "botao-pequeno-desativar" | "paginacao";
  tipo?: "button" | "submit";
  desabilitado?: boolean;
  navegacao?: string; // navegação ou botão
  className?: string; // classes adicionais
};

export default function Botao({children, ativo = false, aoClicar, variante = "padrao", tipo = "button", desabilitado = false, navegacao, className}: PropriedadesBotao) {
  
  let estilo = "btn-padrao";

  if (variante === "confirmar") estilo = "btn-confirmar";
  else if (variante === "cancelar") estilo = "btn-cancelar";
  else if (variante === "editar") estilo = "btn-editar";
  else if (variante === "sair") estilo = "btn-sair";
  else if (variante === "tipo-selecionado") estilo = "btn-tipo-selecionado";
  else if (variante === "apto_selecionado") estilo = "btn-apto-selecionado";
  else if (variante === "inapto_selecionado") estilo = "btn-inapto-selecionado";
  else if (variante === "quiz-resposta") estilo = "btn-quiz-resposta";
  else if (variante === "botao-pequeno-editar") estilo = "btn-pequeno-editar";
  else if (variante === "botao-pequeno-confirmar") estilo = "btn-pequeno-confirmar";
  else if (variante === "botao-pequeno-desativar") estilo = "btn-pequeno-desativar";
  else if (variante === "paginacao") estilo = "";

  if (ativo && variante === "padrao") {
    estilo = "btn-ativado";
  }

  const usaBase = variante !== "paginacao";

  const classe = 
    `${usaBase ? "btn-base" : ""} ${estilo} 
    focus-acessivel 
    ${ variante === "botao-pequeno-editar" || variante === "botao-pequeno-desativar" || variante === "botao-pequeno-confirmar" || className?.includes("paginacao") ? "" : "w-full"}
    ${desabilitado ? "cursor-not-allowed opacity-50" : "hover:brightness-95"} 
    ${className || ""}`;

  // navergar
  if (navegacao) {  
    return (
      <Link 
        to={desabilitado ? "#" : navegacao}
        onClick={(e) => {
          if (desabilitado) e.preventDefault();
          else aoClicar?.();
        }}

        className={classe}
        aria-current={ativo ? "page" : undefined}
        aria-disabled={desabilitado}
        tabIndex={desabilitado ? -1 : 0}
      >
        {children}
      </Link>
    );
  }

  // para botão normal
  return (
    <button
      type={tipo}
      disabled={desabilitado}
      onClick={desabilitado ? undefined : aoClicar}
      className={classe}
    >
      {children}
    </button>
  );
}