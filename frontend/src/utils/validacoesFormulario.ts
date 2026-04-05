import {nomeCompletoValido, dataValida, validarCPF, telefoneValido, emailValido, senhaForte, senhasIguais,} from "./validacoes";

type DadosFormulario = {
  nome: string;
  dataNascimento: string;
  cpf: string;
  cep: string;
  telefone: string;
  email: string;
  senha: string;
  confirmarSenha: string;
};

export function validarCampo(
  campo: keyof DadosFormulario,
  dados: DadosFormulario
) {
  switch (campo) {
    case "nome":
      if (!dados.nome) 
        return "Campo obrigatório, informe o seu nome completo";
      if (!nomeCompletoValido(dados.nome))
        return "Digite nome e sobrenome";
      break;

    case "dataNascimento":
      if (!dados.dataNascimento) 
        return "Campo obrigatório, informe sua data de nascimento";
      if (!dataValida(dados.dataNascimento)) 
        return "Data inválida, não pode ser no futuro";
      break;

    case "cpf":
      if (!dados.cpf) 
        return "Campo obrigatório, informe seu CPF";
      if (dados.cpf.length < 14)
        return "Digite o CPF completo (000.000.000-00)";
      if (!validarCPF(dados.cpf))
        return "CPF inválido";
      break;

    case "cep":
      if (!dados.cep) return "Campo obrigatório, informe seu CEP";
      if (dados.cep.length < 9)
        return "Digite o CEP completo (00000-000)";
      break;

    case "telefone":
      if (dados.telefone && dados.telefone.length < 14)
        return "Digite o telefone completo (00) 00000-0000";
      if (dados.telefone && !telefoneValido(dados.telefone))
        return "Telefone inválido";
      break;

    case "email":
      if (!dados.email) 
        return "Campo obrigatório, informe seu email";
      if (!dados.email.includes("@"))
        return "O email deve conter @";
      if (!dados.email.includes("."))
        return "O email deve conter um domínio (ex: .com)";
      if (!emailValido(dados.email))
        return "Email inválido (exemplo de email válido: nome@email.com)";
      break;

    case "senha":
      if (!dados.senha) 
        return "Campo obrigatório, informe sua senha";
      break;

    case "confirmarSenha":
      if (!dados.confirmarSenha) 
        return "Campo obrigatório, confirme sua senha";
      if (!senhasIguais(dados.senha, dados.confirmarSenha))
        return "As senhas devem ser iguais";
      break;
  }

  return "";
}