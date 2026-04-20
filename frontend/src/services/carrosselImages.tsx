import type { CarrosselImage } from "../components/Carrossel";

const altMap: Record<string, string> = {
  "carrossel_caderno.png": "Imagem de vários cadernos em cima do outro de modo não organizado",
  "carrossel_cadernos.png": "Imagem de vários cadernos organizados um em cima do outro",
  "carrossel_giz.png": "Imagem de uma criança desenhando com giz de cera borrada ao fundo e mais na frente com foco uma caixa de giz de cera aberta com vários giz de cera coloridos dentro",
  "carrossel_lapis.png": "Imagem de varios lápis de cor espalhados em cima de folhas coloridas também espalhadas",
  "carrossel_mochila.png": "Imagem de uma criança com uma mochila escolar azul escura andando para frente",
  "carrossel_regua.png": "Imagem de uma régua vermelha em cima de várias folhas coloridas, junto com outros materiais escolares como lápis, canetas e tesouras também em cima das folhas coloridas",
};

export async function loadCarrosselImages(): Promise<CarrosselImage[]> {
  const images = import.meta.glob (
    "/src/assets/carrossel/*.{png,jpg,jpeg,gif,webp}",
    { eager: true } 
  ) as Record<string, { default: string }>;
  

  return Object.entries(images)
    .map(([path, module], index) => {
      const mod = module as { default: string };

      const fileName = path.split("/").pop() || `imagem-${index + 1}`;

      // ALT manual OU fallback automático
      const altManual = altMap[fileName];

      const altFallback = fileName
        .split(".")[0]
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());

      return {
        id: index + 1,
        url: mod.default,
        alt: altManual || altFallback || "Imagem do carrossel",
      };
    })
    .sort((a, b) => a.id - b.id);
}