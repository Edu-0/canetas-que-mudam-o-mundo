import { useState, useEffect, useRef } from "react";

export interface CarrosselImage {
  id: number;
  url: string;
  alt: string;
}

export interface CarrosselProps {
  images: CarrosselImage[];
  autoPlay?: boolean;
  interval?: number;
  imagesPerView?: number;
}

function Carrossel({ images, autoPlay = true, interval = 5000, imagesPerView = 4 }: CarrosselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const autoPlayTimerRef = useRef<number | null>(null);

  // Auto-play functionality
  useEffect(() => {
    if (!autoPlay || images.length === 0) return;

    autoPlayTimerRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, interval);

    return () => {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    };
  }, [autoPlay, interval, images.length]);

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
    if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
  };

  if (images.length === 0) {
    return null;
  }

  const visibleImages = [];
  for (let i = 0; i < imagesPerView; i++) {
    visibleImages.push(images[(currentIndex + i) % images.length]);
  }

  return (
    <div className="w-full bg-[var(--base-5)] flex flex-col items-center justify-center py-8">
      <div className="relative w-full max-w-6xl px-4">
        {/* Container das imagens */}
        <div className="flex gap-4 justify-center border-[16px] border-yellow-500 rounded-lg p-4">
          {visibleImages.map((image, idx) => (
            <div
              key={`${image.id}-${currentIndex}-${idx}`}
              className="flex-shrink-0 w-40 h-40 md:w-48 md:h-48 lg:w-56 lg:h-56 transition-transform duration-300"
            >
              <img
                src={image.url}
                alt={image.alt}
                className="w-full h-full object-cover rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 hover:scale-105"
              />
            </div>
          ))}
        </div>

        {/* Botões de navegação */}
        <button
          onClick={goToPrevious}
          className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-3 rounded-full transition-all duration-300 z-10 m-2"
          aria-label="Anterior"
        >
          &#10094;
        </button>

        <button
          onClick={goToNext}
          className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-3 rounded-full transition-all duration-300 z-10 m-2"
          aria-label="Próximo"
        >
          &#10095;
        </button>

        {/* Indicadores de progresso */}
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: images.length }).map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? "bg-[#8EAE00] w-8"
                  : "bg-gray-300 w-2"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Carrossel;
