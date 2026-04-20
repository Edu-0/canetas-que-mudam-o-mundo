import { useEffect, useRef } from "react";

type Props = {
  aberto: boolean;
  titulo: string;
  descricao: string;
  botaoConfirmar?: string;
  botaoCancelar?: string;
  onConfirmar: () => void;
  onCancelar: () => void;

  varianteConfirmar?: "confirmar" | "cancelar";
  varianteCancelar?: "confirmar" | "cancelar";
};

function ModalConfirmacao({
  aberto,
  titulo,
  descricao,
  botaoConfirmar,
  botaoCancelar,
  onConfirmar,
  onCancelar,
  varianteConfirmar,
  varianteCancelar,
}: Props) {
  if (!aberto) return null;

  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (aberto && modalRef.current) {
      modalRef.current.focus();
    }
  }, [aberto]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // ESC fecha modal
      if (e.key === "Escape") {
        onCancelar();
      }

      // focus trap
      if (e.key === "Tab" && modalRef.current) {
        const focaveis = modalRef.current.querySelectorAll<HTMLElement>(
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

    if (aberto) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [aberto]);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div ref={modalRef} tabIndex={-1} role="dialog" aria-label="Janela de confirmação" aria-modal="true" aria-labelledby="modal-titulo" aria-describedby="modal-descricao" className="bg-[var(--secundario-10)] rounded-lg border border-[var(--secundario-20)] p-6 w-full max-w-md shadow-lg">
        <h2 id="modal-titulo" className="text-lg font-semibold mb-2">{titulo}</h2>
        <p id="modal-descricao" className="text-sm mb-6">{descricao}</p>

        <div className="flex justify-between gap-3">
          {botaoCancelar && (
            <button
              onClick={onCancelar}
              className={`px-4 py-2 rounded border border-black focus-acessivel ${
                varianteCancelar === "confirmar"
                  ? "bg-[var(--base-20)] hover:bg-[var(--base-40)]" 
                  : "bg-[var(--cor-resposta-obrigatoria)] text-white hover:bg-red-700"
              }`}
            >
              {botaoCancelar}
            </button>
          )}

          {botaoConfirmar && (
            <button
              onClick={onConfirmar}
              className={`px-4 py-2 rounded border border-black focus-acessivel ${
                varianteConfirmar === "confirmar"
                  ? "bg-[var(--base-20)] hover:bg-[var(--base-40)]"
                  : "bg-[var(--cor-resposta-obrigatoria)] text-white hover:bg-red-700"
              }`}
            >
              {botaoConfirmar}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ModalConfirmacao;