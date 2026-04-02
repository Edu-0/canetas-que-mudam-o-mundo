import { ReactNode } from "react";

type PropriedadesBotao = {
  children: ReactNode; // o que tem dentro do botão
  ativo?: boolean; // se o botão está selecionado
  aoClicar?: () => void;
};

export default function Botao({children, ativo = false, aoClicar}: PropriedadesBotao) {
  return (
    <button
      type="button"
      onClick={aoClicar}
      className={`
        btn-base 
        ${ativo ? "btn-ativado" : "btn-padrao"}
        w-full
      `}
    >
      {children}
    </button>
  );
}