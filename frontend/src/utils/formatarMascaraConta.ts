export function formatarCPF(cpf?: string) {
  if (!cpf) return "CPF não informado";
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

export function formatarCEP(cep?: string) {
  if (!cep) return "CEP não informado";
  return cep.replace(/(\d{5})(\d{3})/, "$1-$2");
}

export function formatarTelefone(telefone?: string) {
  if (!telefone) return "Telefone não informado";

  if (telefone.length === 11) {
    return telefone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }

  if (telefone.length === 10) {
    return telefone.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }

  return telefone;
}