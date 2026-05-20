import { useEffect, useRef, useState } from "react";

type Props = {
  aberto: boolean;
  imagens: string[];
  indexInicial: number;
  onFechar: () => void;
};

export default function ModalImagem({ aberto, imagens, indexInicial, onFechar }: Props) {
  const [index, setIndex] = useState(indexInicial);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const ZOOM_MIN = 1;
  const ZOOM_MAX = 3;

  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (aberto) {
      setIndex(indexInicial);
      setZoom(1);
      setPos({ x: 0, y: 0 });

      modalRef.current?.focus();
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [aberto, indexInicial]);

  function proxima() {
    setIndex((i) => (i + 1) % imagens.length);
  }

  function anterior() {
    setIndex((i) => (i - 1 + imagens.length) % imagens.length);
  }

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault();

    setZoom((z) => {
      const novo = z + (e.deltaY > 0 ? -0.1 : 0.1);
      return Math.min(Math.max(novo, ZOOM_MIN), ZOOM_MAX);
    });
  }

  // 🔒 LIMITAR MOVIMENTO
  function limitarPosicao(x: number, y: number) {
    const LIMITE = 100; // controla o quanto pode mover

    return {
      x: Math.max(Math.min(x, LIMITE), -LIMITE),
      y: Math.max(Math.min(y, LIMITE), -LIMITE),
    };
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!aberto) return;

      if (e.key === "Escape") onFechar();

      // zoom
      if (e.key === "+" || e.key === "=") {
        setZoom((z) => Math.min(z + 0.1, ZOOM_MAX));
      }

      if (e.key === "-") {
        setZoom((z) => Math.max(z - 0.1, ZOOM_MIN));
      }

      if (e.key === "0") {
        setZoom(1);
        setPos({ x: 0, y: 0 });
      }

      // navegação
      if (zoom === 1) {
        if (e.key === "ArrowRight") proxima();
        if (e.key === "ArrowLeft") anterior();
      }

      // mover imagem
      if (zoom > 1) {
        const STEP = 40;

        if (e.key === "ArrowUp") {
          setPos((p) => limitarPosicao(p.x, p.y + STEP));
        }
        if (e.key === "ArrowDown") {
          setPos((p) => limitarPosicao(p.x, p.y - STEP));
        }
        if (e.key === "ArrowLeft") {
          setPos((p) => limitarPosicao(p.x + STEP, p.y));
        }
        if (e.key === "ArrowRight") {
          setPos((p) => limitarPosicao(p.x - STEP, p.y));
        }
      }

      // focus trap para acessibilidade
      if (e.key === "Tab" && modalRef.current) {
        const focaveis = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [tabindex]:not([tabindex="-1"])'
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

    if (aberto) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [aberto, zoom]);

  if (!aberto) return null;

  return (
    <div ref={modalRef} tabIndex={-1} role="dialog" aria-modal="true" className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 outline-none" onClick={onFechar}>
      <div className="relative w-full max-w-5xl h-[90vh] flex items-center justify-center overflow-hidden" onClick={(e) => e.stopPropagation()} >
        {/* fechar */}
        <button onClick={onFechar} className="absolute top-2 right-2 z-10 bg-white rounded-full w-10 h-10 shadow focus-acessivel outline-4 outline-[var(--base-50)] hover:bg-slate-200" >
          ✕
        </button>

        {/* anterior */}
        {imagens.length > 1 && (
          <button onClick={anterior} className="absolute left-2 z-10 text-white text-4xl px-3 focus-acessivel outline-4 outline-[var(--base-50)]" >
            ‹
          </button>
        )}

        {/* imagem */}
        <img src={imagens[index]} onWheel={handleWheel} style={{ transform: `scale(${zoom}) translate(${pos.x}px, ${pos.y}px)` }} className="max-h-full max-w-full object-contain transition" />

        {/* próxima */}
        {imagens.length > 1 && (
          <button onClick={proxima} className="absolute right-2 z-10 text-white text-4xl px-3 focus-acessivel outline-4 outline-[var(--base-50)]" >
            ›
          </button>
        )}
      </div>
    </div>
  );
}