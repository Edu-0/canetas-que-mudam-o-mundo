import { useState, useEffect, useRef } from "react";
import icon_pausa from "../assets/icon_pausa_carrossel.png";
import icon_play from "../assets/icon_play_carrossel.png";

export interface CarrosselImage {
  id: number;
  url: string;
  alt: string;
}

export interface CarrosselProps {
  images: CarrosselImage[];
  speed?: number;
}

function Carrossel({ images, speed = 0.3 }: CarrosselProps) {
  const [paused, setPaused] = useState(false);

  const trackRef = useRef<HTMLDivElement | null>(null);
  const positionRef = useRef(0);
  const animationRef = useRef<number | null>(null);

  const total = images.length;

  const extendedImages = [...images, ...images];

  // movimento continuo
  useEffect(() => {
    if (!trackRef.current || total === 0) return;

    const track = trackRef.current;

    const animate = () => {
      if (!paused) {
        positionRef.current += speed;

        const halfWidth = track.scrollWidth / 2;

        if (positionRef.current >= halfWidth) {
          positionRef.current = 0;
        }

        track.style.transform = `translateX(-${positionRef.current}px)`;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [paused, speed, total]);

  // controle por teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") positionRef.current -= 200;
    if (e.key === "ArrowRight") positionRef.current += 200;
    if (e.key === " ") {
      e.preventDefault();
      setPaused((prev) => !prev);
    }
  };

  if (total === 0) return null;

  return (
    <div className="w-full flex flex-col items-center px-1">

      <div className="flex items-center gap-4 w-full" role="region" aria-label="Galeria de imagens com navegação">

        <div className="flex items-center justify-center h-full">
          {/* botão esquerdo */}
          <button
            onClick={() => (positionRef.current -= 200)}
            aria-label="Voltar imagens"
            className="bg-[var(--base-40)] hover:bg-[var(--base-70)] text-black hover:text-white px-3 py-2 rounded-full focus-acessivel"
          >
            ❮
          </button>
        </div>


        <div className="rounded-xl shadow-[2px_8px_25px_rgba(0,0,0,0.08)] my-6">
          <div className="w-full rounded-xl p-3 bg-[var(--base-15)] border border-[rgba(0,0,0,0.04)] flex items-center">
            {/* carrossel */}
            <div
              className="relative w-full overflow-hidden rounded-xl px-2 sm:px-4"
              role="region"
              aria-label="Carrossel de imagens"
              tabIndex={0}
              onKeyDown={handleKeyDown}
            >

              {/* botão pause */}
              <button
                onClick={() => setPaused(!paused)}
                aria-label={paused ? "Iniciar carrossel" : "Pausar carrossel"}
                className="absolute bottom-3 right-3 z-20 bg-[var(--base-40)] hover:bg-[var(--base-70)] text-black hover:text-white p-2 rounded-md focus-acessivel shadow-md"
              >
                {paused ? (
                  <img src={icon_play} alt="Reproduzir carrossel" className="w-5 h-5" />
                ) : (
                  <img src={icon_pausa} alt="Pausar carrossel" className="w-5 h-5" />
                )}
              </button>

              {/* trilho */}
              <div
                ref={trackRef}
                className="flex gap-4"
              >
                {extendedImages.map((image, idx) => (
                  <div
                    key={`${image.id}-${idx}`}
                    className="flex-shrink-0 w-[90%] sm:w-[70%] md:w-[45%] lg:w-[30%] xl:w-[22%] px-1"
                  >
                    <img
                      src={image.url}
                      alt={image.alt}
                      className="w-full aspect-[4/3] object-cover rounded-lg"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center h-full">
          {/* botão direito */}
          <button
            onClick={() => (positionRef.current += 200)}
            aria-label="Avançar imagens"
            className="bg-[var(--base-40)] hover:bg-[var(--base-70)] text-black hover:text-white px-3 py-2 rounded-full focus-acessivel"
          >
            ❯
          </button>
        </div>
      </div>
    </div>
  );
}

export default Carrossel;