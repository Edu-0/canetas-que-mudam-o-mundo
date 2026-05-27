function pegarData(data: string) {
  return data.split(" ")[0];
}
function normalizarInicio(data: string) {
  const d = new Date(data);
  d.setHours(0, 0, 0, 0);
  return d;
}

function normalizarFim(data: string) {
  const d = new Date(data);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function dataValida(data: string) {
  return !!data;
}

export function dataNaoFutura(data: string) {
  const hoje = new Date();
  hoje.setHours(23, 59, 59, 999);

  const d = new Date(data);

  return d <= hoje;
}

export function intervaloDataValido(inicio?: string, fim?: string) {
  if (!inicio || !fim) return true;

  const d1 = new Date(inicio);
  d1.setHours(0, 0, 0, 0);

  const d2 = new Date(fim);
  d2.setHours(23, 59, 59, 999);

  return d1 <= d2;
}