import {nomeCompletoValido, dataValida, validarCPF, emailValido, senhaValida, senhasIguais} from "./validacoes";

type DadosFormulario = {
  nome_completo: string;
  data_nascimento: string;
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
    case "nome_completo":
      if (!dados.nome_completo) 
        return "Campo obrigatório, informe o seu nome completo";
      if (!nomeCompletoValido(dados.nome_completo))
        return "Digite nome e sobrenome";
      if(dados.nome_completo.length > 100)
        return "O nome é muito longo, deve conter no máximo 100 caracteres";
      break;

    case "data_nascimento":
      if (!dados.data_nascimento) 
        return "Campo obrigatório, informe sua data de nascimento";
      if (!dataValida(dados.data_nascimento)) 
        return "Data inválida, idade deve ser entre 0 e 130 anos e a data não pode ser futura";
      break;

    case "cpf":
      if (!dados.cpf) 
        return "Campo obrigatório, informe seu CPF";
      if (dados.cpf.length < 14)
        return "CPF inválido. Digite o CPF completo (000.000.000-00)";
      if (!validarCPF(dados.cpf))
        return "CPF inválido";
      break;

    case "cep":
      if (!dados.cep) return "Campo obrigatório, informe seu CEP";
      if (!/^\d{5}-\d{3}$/.test(dados.cep))
        return "CEP Inválido. Digite o CEP no formato 00000-000";
      break;

    case "telefone":
      if (dados.telefone && !/^\(\d{2}\) \d{5}-\d{4}$/.test(dados.telefone))
        return "Telefone inválido. Digite o telefone no formato (00) 00000-0000";
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
      if (dados.email.length > 254)
        return "O email é muito longo, deve conter no máximo 254 caracteres";
      break;

    case "senha":
      if (!dados.senha) 
        return "Campo obrigatório, informe sua senha";
      if (dados.senha.length > 50)
        return "A senha é muito longa, deve conter no máximo 50 caracteres";
      if (!senhaValida(dados.senha))
        return "A senha não atende aos requisitos abaixo";
      break;

    case "confirmarSenha":
      if (!dados.confirmarSenha) 
        return "Campo obrigatório, confirme sua senha";
      if (!senhasIguais(dados.senha, dados.confirmarSenha))
        return "As senhas devem ser iguais";
      if (dados.confirmarSenha.length > 50)
        return "A senha é muito longa, deve conter no máximo 50 caracteres";
      break;
  }

  return "";
}