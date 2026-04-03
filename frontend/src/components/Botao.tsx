import { ReactNode } from "react";

type PropriedadesBotao = {
  children: ReactNode; // o que tem dentro do botão
  ativo?: boolean; // se o botão está selecionado
  aoClicar?: () => void;
  variante?: "padrao" | "confirmar" | "cancelar" | "editar" | "sair";
  tipo?: "button" | "submit";
};

export default function Botao({children, ativo = false, aoClicar, variante = "padrao", tipo = "button"}: PropriedadesBotao) {
  
  let estilo = "btn-padrao";

  if (ativo) estilo = "btn-ativado";
  else if (variante === "confirmar") estilo = "btn-confirmar";
  else if (variante === "cancelar") estilo = "btn-cancelar";
  else if (variante === "editar") estilo = "btn-editar";
  else if (variante === "sair") estilo = "btn-sair";

  return (
    <button
      type={tipo}
      onClick={aoClicar}
      className={`
        btn-base ${estilo} w-full
      `}
    >
      {children}
    </button>
  );
}