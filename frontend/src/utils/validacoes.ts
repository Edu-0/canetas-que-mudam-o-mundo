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

export function nomeONGValido(nome: string) {
  return nome.trim().length >= 3;
}

export function cnpjValido(cnpj: string) {
  cnpj = cnpj.replace(/\D/g, "");

  if (cnpj.length !== 14) return false;
  if (/^(\d)\1+$/.test(cnpj)) return false;

  let tamanho = cnpj.length - 2;
  let numeros = cnpj.substring(0, tamanho);
  let digitos = cnpj.substring(tamanho);

  let soma = 0;
  let pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += Number(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== Number(digitos.charAt(0))) return false;

  tamanho = tamanho + 1;
  numeros = cnpj.substring(0, tamanho);

  soma = 0;
  pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += Number(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);

  return resultado === Number(digitos.charAt(1));
}

export function horaValida(hora: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(hora);
}

export function horarioCoerente(inicio: string, fim: string) {
  if (!horaValida(inicio) || !horaValida(fim)) return false;

  const [h1, m1] = inicio.split(":").map(Number);
  const [h2, m2] = fim.split(":").map(Number);

  const minutosInicio = h1 * 60 + m1;
  const minutosFim = h2 * 60 + m2;

  return minutosInicio < minutosFim;
}

export function diasFuncionamentoValido(dias: number[]) {
  return Array.isArray(dias) && dias.length > 0;
}

export function textoSobreLongoValido(texto: string) {
  return texto.length <= 500; 
}

export function textoSobreCurtoValido(texto: string) {
  return texto.length >= 50; 
}

export function urlValida(url: string) {
  try {
    const u = new URL(url);

    // só aceita http e https
    if (!["http:", "https:"].includes(u.protocol)) return false;

    if (/\s/.test(url)) return false; // URLs não podem conter espaços

    // precisa ter domínio com TLD (ex: .com)
    const hostname = u.hostname;

    if (!hostname.includes(".")) return false;

    const partes = hostname.split(".");
    const tld = partes[partes.length - 1];

    // TLD precisa ter pelo menos 2 letras (ex: com, org)
    if (tld.length < 2) return false;

    return true;

  } catch {
    return false;
  }
}

export function normalizarUrl(url: string) {
  if (!url) return url;

  url = url.trim(); // tira espaços no início e no fim

  if (!/^https?:\/\//i.test(url)) {
    return "https://" + url;
  }
  return url;
}