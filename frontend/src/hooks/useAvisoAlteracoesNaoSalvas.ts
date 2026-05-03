import { useEffect, useState } from "react";

type Opcoes = {
  mensagem?: string;
};

export function useAvisoAlteracoesNaoSalvas(opcoes?: Opcoes) {
  const [alterou, setAlterou] = useState(false);
  const [mostrarModal, setMostrarModal] = useState(false);

  const mensagemPadrao =
    opcoes?.mensagem ||
    "Você tem alterações não salvas. Deseja sair mesmo?";

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

  function tentarSair(rota?: string): boolean {
    if (!alterou) return true;

    setMostrarModal(true);

    if (rota) {
      sessionStorage.setItem("rotaDestino", rota);
    }

    return false;
  }

  return {
    alterou,
    setAlterou,
    tentarSair,
    mostrarModal,
    setMostrarModal,
    mensagemPadrao,
  };
}