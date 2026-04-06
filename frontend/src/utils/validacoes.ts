export function nomeCompletoValido(nome: string) {
  return nome.trim().split(" ").length >= 2;
}

export function dataValida(data: string) {
  if (!data) return false;

  const hoje = new Date();
  const dataInput = new Date(data);

  // subtrai 1 se ainda não fez aniversário este ano, pois a idade só aumenta no aniversário e não no início do ano
  const idade = hoje.getFullYear() - dataInput.getFullYear() - (hoje < new Date(hoje.getFullYear(), dataInput.getMonth(), dataInput.getDate()) ? 1 : 0); 

  return (
    dataInput <= hoje && // não pode ser uma data futuro
    idade >= 0 && idade <= 130 // limite de idade
  );
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