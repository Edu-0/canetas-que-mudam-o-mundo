export function nomeCompletoValido(nome_completo: string) {
  return nome_completo.trim().split(" ").length >= 2;
}

function parseDataLocal(data: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return null;

  const [anoTexto, mesTexto, diaTexto] = data.split("-");
  const ano = Number(anoTexto);
  const mes = Number(mesTexto);
  const dia = Number(diaTexto);

  if ([ano, mes, dia].some(Number.isNaN)) return null;

  const dataLocal = new Date(ano, mes - 1, dia);

  if (Number.isNaN(dataLocal.getTime())) return null;

  // Garante que datas inválidas (ex.: 2026-02-31) não sejam normalizadas automaticamente.
  if (
    dataLocal.getFullYear() !== ano ||
    dataLocal.getMonth() !== mes - 1 ||
    dataLocal.getDate() !== dia
  ) {
    return null;
  }

  return dataLocal;
}

export function dataNaoFutura(data: string) {
  const dataInput = parseDataLocal(data);
  if (!dataInput) return false;

  const agora = new Date();
  const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate()); // ignora a parte de horário para comparar apenas as datas
  return dataInput <= hoje;
}

export function idadeValida(data: string) {
  const nascimento = parseDataLocal(data);
  if (!nascimento) return false;

  const hoje = new Date();

  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const mes = hoje.getMonth() - nascimento.getMonth();

  if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
    idade--;
  }

  return idade >= 18 && idade <= 130; // data minima de 18 anos e máxima de 130 anos para evitar datas inválidas
}

export function validarCPF(cpf: string) {
  cpf = cpf.replace(/\D/g, "");

  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false; // verifica se tem 11 dígitos e se não são todos iguais

  let soma = 0;
  let resto;

  for (let i = 1; i <= 9; i++)
    soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);

  resto = (soma * 10) % 11;
  
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.substring(9, 10))) return false;

  soma = 0;

  for (let i = 1; i <= 10; i++)
    soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);

  resto = (soma * 10) % 11;
  
  if (resto === 10 || resto === 11) resto = 0; // se o resultado for 10 ou 11, considera como 0 para a validação do dígito verificador

  return resto === parseInt(cpf.substring(10, 11)); // verifica o segundo dígito verificador
}

export function emailValido(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); // uma letra no início, seguida de um @, depois mais letras, um ponto e mais letras
}

export function senhaValida(senha: string) {
  const requisitos = verificarRequisitosSenha(senha);
  return Object.values(requisitos).every((requisito) => requisito);
}

export function verificarRequisitosSenha(senha: string) { // pelo menos 8 caracteres, uma letra maiúscula, uma letra minúscula, um número e um caractere especial
  return {
    tamanho: senha.length >= 8,
    minuscula: /[a-z]/.test(senha),
    maiuscula: /[A-Z]/.test(senha),
    numero: /\d/.test(senha),
    caractereEspecial: /[\W_]/.test(senha),
  };
}

export function senhasIguais(senha: string, confirmar: string) {
  return senha === confirmar;
}