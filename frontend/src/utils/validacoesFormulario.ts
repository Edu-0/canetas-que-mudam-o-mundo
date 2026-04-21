import {nomeCompletoValido, dataNaoFutura, idadeValida, validarCPF, emailValido, senhaValida, senhasIguais} from "./validacoes";

type DadosFormulario = Partial<{
  nome_completo: string;
  data_nascimento: string;
  cpf: string;
  cep: string;
  telefone: string;
  email: string;
  senha: string;
  confirmarSenha: string;
}>;

export function validarCampo(
  campo: keyof DadosFormulario,
  dados: DadosFormulario
) {

  const dadosLimpos = { // aqui eu limpo os dados para evitar erros de validação por causa de espaços extras no início ou no fim
    nome_completo: dados.nome_completo?.trim() || "",
    data_nascimento: dados.data_nascimento || "",
    cpf: dados.cpf?.trim() || "",
    cep: dados.cep?.trim() || "",
    telefone: dados.telefone?.trim() || "",
    email: dados.email?.trim() || "",
    senha: dados.senha || "",
    confirmarSenha: dados.confirmarSenha || "",
  };

  switch (campo) {
    case "nome_completo":
      if (!dadosLimpos.nome_completo) 
        return "Campo obrigatório, informe o seu nome completo";
      if (!nomeCompletoValido(dadosLimpos.nome_completo))
        return "Digite nome e sobrenome";
      if(dadosLimpos.nome_completo.length > 100)
        return "O nome é muito longo, deve conter no máximo 100 caracteres";
      break;

    case "data_nascimento":
      if (!dadosLimpos.data_nascimento) 
        return "Campo obrigatório, informe sua data de nascimento";
      if (!dataNaoFutura(dadosLimpos.data_nascimento)) 
        return "Data inválida, a data não pode ser futura"
      if (!idadeValida(dadosLimpos.data_nascimento)) 
        return "Data inválida, você deve ter pelo menos 18 anos";
      break;

    case "cpf":
      if (!dadosLimpos.cpf) 
        return "Campo obrigatório, informe seu CPF";
      if (dadosLimpos.cpf.length < 14)
        return "CPF inválido. Digite o CPF completo (000.000.000-00)";
      if (!validarCPF(dadosLimpos.cpf))
        return "CPF inválido";
      break;

    case "cep":
      if (!dadosLimpos.cep) return "Campo obrigatório, informe seu CEP";
      if (!/^\d{5}-\d{3}$/.test(dadosLimpos.cep))
        return "CEP Inválido. Digite o CEP no formato 00000-000";
      break;

    case "telefone":
      if (dadosLimpos.telefone && !/^\(\d{2}\) \d{5}-\d{4}$/.test(dadosLimpos.telefone))
        return "Telefone inválido. Digite o telefone no formato (00) 00000-0000";
      break;

    case "email":
      if (!dadosLimpos.email) 
        return "Campo obrigatório, informe seu email";
      if (!dadosLimpos.email.includes("@"))
        return "O email deve conter @";
      if (!dadosLimpos.email.includes("."))
        return "O email deve conter um domínio (ex: .com)";
      if (!emailValido(dadosLimpos.email))
        return "Email inválido (exemplo de email válido: nome@email.com)";
      if (dadosLimpos.email.length > 254)
        return "O email é muito longo, deve conter no máximo 254 caracteres";
      break;

    case "senha":
      if (!dadosLimpos.senha) 
        return "Campo obrigatório, informe sua senha";
      if (dadosLimpos.senha.length > 50)
        return "A senha é muito longa, deve conter no máximo 50 caracteres";
      if (!senhaValida(dadosLimpos.senha))
        return "A senha não atende aos requisitos abaixo";
      break;

    case "confirmarSenha":
      if (!dadosLimpos.confirmarSenha) 
        return "Campo obrigatório, confirme sua senha";
      if (!senhasIguais(dadosLimpos.senha, dadosLimpos.confirmarSenha))
        return "As senhas devem ser iguais";
      if (dadosLimpos.confirmarSenha.length > 50)
        return "A senha é muito longa, deve conter no máximo 50 caracteres";
      break;
  }

  return "";
}