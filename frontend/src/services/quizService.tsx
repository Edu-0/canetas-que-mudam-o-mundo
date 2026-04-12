import api from "./api";

export interface ImagemTeste {
  id: string;
  url: string;
}

export interface ResultadoQuiz {
  aprovado: boolean;
}

// Buscar imagens do quiz
export async function obterImagensQuiz(): Promise<ImagemTeste[]> {
  const response = await api.get("/quiz-imagens");
  return response.data;
}

// Enviar respostas do quiz
export async function enviarRespostasQuiz(respostas: Record<string, "apto" | "inapto">): Promise<ResultadoQuiz> {
  const response = await api.post("/quiz-imagens", {
    respostas
  });
  return response.data;
}