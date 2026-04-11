import type { CarrosselImage } from "../components/Carrossel";

export async function loadCarrosselImages(): Promise<CarrosselImage[]> {
  const images = import.meta.glob<{ default: string }>(
    "/src/assets/carrossel/*.(png|jpg|jpeg|gif|webp)",
    { eager: true }
  );

  return Object.entries(images)
    .map(([path, module], index) => {
      // Extrai o nome do arquivo para usar como alt
      const fileName = path.split("/").pop()?.split(".")[0] || `Imagem ${index + 1}`;
      const altText = fileName
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());

      return {
        id: index + 1,
        url: module.default,
        alt: altText,
      };
    })
    .sort((a, b) => a.id - b.id);
}
