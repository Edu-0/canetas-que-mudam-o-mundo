import api from "./api";

export async function enviarResultadoQuiz(usuario_id: number, pontuacao: number) {
  const response = await api.post("/usuario/quiz/triagem", {
    usuario_id,
    pontuacao_total: pontuacao
  });
  return response.data;
}