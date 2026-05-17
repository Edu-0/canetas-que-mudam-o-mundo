  export function dataValida(data: string) {
    return !isNaN(new Date(data).getTime());
  }

  export function dataNaoFutura(data: string) {
    const hoje = new Date();
    const d = new Date(data);
    return d <= hoje;
  }

  export function intervaloDataValido(inicio?: string, fim?: string) {
    if (!inicio || !fim) return true;

    const d1 = new Date(inicio);
    const d2 = new Date(fim);

    return d1 <= d2;
  }