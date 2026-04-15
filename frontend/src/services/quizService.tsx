import api from "./api";

export async function enviarResultadoQuiz(usuario_id: number, pontuacao: number) {
  return api.post("/usuario/quiz/triagem", {
    usuario_id,
    pontuacao_total: pontuacao
  });
}