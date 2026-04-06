import { useEffect, useState } from "react";

type Opcoes = {
  mensagem?: string;
};

export function useAvisoAlteracoesNaoSalvas(opcoes?: Opcoes) {
  const [alterou, setAlterou] = useState(false);

  const mensagemPadrao =
    opcoes?.mensagem ||
    "Você tem alterações não salvas. Deseja sair mesmo?";

  // aviso ao sair da página (refresh, fechar aba, etc)
  useEffect(() => {
    const antesDeSair = (e: BeforeUnloadEvent) => {
      if (alterou) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", antesDeSair);

    return () => {
      window.removeEventListener("beforeunload", antesDeSair);
    };
  }, [alterou]);

  // função para usar em navegação interna (React Router)
  function confirmarSaida(): boolean {
    if (!alterou) return true;

    return confirm(mensagemPadrao);
  }

  return {alterou, setAlterou, confirmarSaida,};
}