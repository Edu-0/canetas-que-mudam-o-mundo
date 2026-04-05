export function nomeCompletoValido(nome: string) {
  return nome.trim().split(" ").length >= 2;
}

export function dataValida(data: string) {
  if (!data) return false;
  const hoje = new Date();
  const dataInput = new Date(data);
  return dataInput <= hoje;
}

export function validarCPF(cpf: string) {
  cpf = cpf.replace(/\D/g, "");

  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

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
  
  if (resto === 10 || resto === 11) resto = 0;

  return resto === parseInt(cpf.substring(10, 11));
}

export function telefoneValido(telefone: string) {
  return telefone.length >= 14;
}

export function emailValido(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); // uma letra no início, seguida de um @, depois mais letras, um ponto e mais letras
}

export function senhaForte(senha: string) {
  return /^(?=.*[A-Z])(?=.*\d).{6,}$/.test(senha); // pelo menos 6 caracteres, uma letra maiúscula e um número
}

export function verificarRequisitosSenha(senha: string) {
  return {
    tamanho: senha.length >= 6,
    maiuscula: /[A-Z]/.test(senha),
    numero: /\d/.test(senha),
  };
}

export function senhasIguais(senha: string, confirmar: string) {
  return senha === confirmar;
}