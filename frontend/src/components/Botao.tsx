import { ReactNode } from "react";

type PropriedadesBotao = {
  children: ReactNode; // o que tem dentro do botão
  ativo?: boolean; // se o botão está selecionado
  aoClicar?: () => void;
  variante?: "padrao" | "confirmar" | "cancelar" | "editar" | "sair" | "tipo-selecionado" | "apto_selecionado" | "inapto_selecionado" | "quiz-resposta";
  tipo?: "button" | "submit";
  desabilitado?: boolean;
};

export default function Botao({children, ativo = false, aoClicar, variante = "padrao", tipo = "button", desabilitado = false}: PropriedadesBotao) {
  
  let estilo = "btn-padrao";

  if (variante === "confirmar") estilo = "btn-confirmar";
  else if (variante === "cancelar") estilo = "btn-cancelar";
  else if (variante === "editar") estilo = "btn-editar";
  else if (variante === "sair") estilo = "btn-sair";
  else if (variante === "tipo-selecionado") estilo = "btn-tipo-selecionado";
  else if (variante === "apto_selecionado") estilo = "btn-apto-selecionado";
  else if (variante === "inapto_selecionado") estilo = "btn-inapto-selecionado";
  else if (variante === "quiz-resposta") estilo = "btn-quiz-resposta";
  
  if (ativo && variante === "padrao") {
    estilo = "btn-ativado";
  }

  return (
    <button
      type={tipo}
      disabled={desabilitado}
      onClick={desabilitado ? undefined : aoClicar}
      className={`
        btn-base ${estilo} w-full
        ${desabilitado ? "cursor-not-allowed opacity-50" : "hover:brightness-95"}
      `}
    >
      {children}
    </button>
  );
}