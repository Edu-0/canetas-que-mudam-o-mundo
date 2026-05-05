import {nomeONGValido, cnpjValido, emailValido, horaValida, horarioCoerente, diasFuncionamentoValido, textoSobreLongoValido, textoSobreCurtoValido, urlValida, normalizarUrl} from "./validacoes";

type DadosONG = Partial<{
  nome: string;
  cnpj: string;
  cep: string;
  rua: string;
  bairro: string;
  cidade: string;
  estado: string;
  numero: string;
  complemento: string;
  telefone: string;
  email: string;
  diasFuncionamento: number[];
  horarioInicio: string;
  horarioFim: string;
  sobre: string;
  instagram: string;
  facebook: string;
  site: string;
}>;

export function validarCampo(
  campo: keyof DadosONG,
  dados: DadosONG
) {

  const dadosLimpos = { // aqui eu limpo os dados para evitar erros de validação por causa de espaços extras no início ou no fim
    nome: dados.nome?.trim() || "",
    cnpj: dados.cnpj?.trim() || "",
    cep: dados.cep?.trim() || "",
    rua: dados.rua?.trim() || "",
    bairro: dados.bairro?.trim() || "",
    cidade: dados.cidade?.trim() || "",
    estado: dados.estado?.trim() || "",
    numero: dados.numero?.trim() || "",
    complemento: dados.complemento?.trim() || "",
    telefone: dados.telefone?.trim() || "",
    email: dados.email?.trim() || "",
    diasFuncionamento: dados.diasFuncionamento || [],
    horarioInicio: dados.horarioInicio?.trim() || "",
    horarioFim: dados.horarioFim?.trim() || "",
    sobre: dados.sobre?.trim() || "",
    instagram: dados.instagram?.trim() || "",
    facebook: dados.facebook?.trim() || "",
    site: dados.site?.trim() || "",
  };

  switch (campo) {
    case "nome":
      if (!dadosLimpos.nome) 
        return "Campo obrigatório, informe o nome da ONG";
      if (!nomeONGValido(dadosLimpos.nome))
        return "Nome da ONG inválido, deve conter pelo menos 3 caracteres";
      if (dadosLimpos.nome.length > 100)
        return "Nome da ONG é muito longo, deve conter no máximo 100 caracteres";
      break;

    case "cnpj":
      if (!dadosLimpos.cnpj) 
        return "Campo obrigatório, informe o CNPJ";
      if (!cnpjValido(dadosLimpos.cnpj))
        return "CNPJ inválido, deve conter 14 dígitos (exemplo: 12.345.678/0001-90)";
      break;

    case "cep":
      if (dadosLimpos.cep && !/^\d{5}-\d{3}$/.test(dadosLimpos.cep))
        return "CEP Inválido, deve conter 8 dígitos (ex: 00000-000)";
      break;
    
    case "rua": 
      if (!dadosLimpos.rua) 
        return "Campo obrigatório, informe a rua";
      if (dadosLimpos.rua.length < 3)
        return "Rua inválida, deve conter pelo menos 3 caracteres";
      if (dadosLimpos.rua.length > 100)
        return "O nome da rua é muito longa, deve conter no máximo 100 caracteres";
      break;
    
    case "bairro":
      if (!dadosLimpos.bairro) 
        return "Campo obrigatório, informe o bairro";
      if (dadosLimpos.bairro.length < 3)
        return "Bairro inválido, deve conter pelo menos 3 caracteres";
      if (dadosLimpos.bairro.length > 100)
        return "O nome do bairro é muito longo, deve conter no máximo 100 caracteres";
      if (!/^[A-Za-zÀ-ÿ0-9\s\-']+$/.test(dadosLimpos.bairro))
        return "Bairro inválido, contém caracteres não permitidos";
      break;
    
    case "cidade":
      if (!dadosLimpos.cidade) 
        return "Campo obrigatório, informe a cidade";
      if (dadosLimpos.cidade.length < 2)
        return "Cidade inválida, o nome da cidade é muito curto, deve conter no mínimo 2 caracteres";
      if (!/^[A-Za-zÀ-ÿ\s\-']+$/.test(dadosLimpos.cidade))
        return "Cidade inválida, contém caracteres não permitidos";
      break;
    
    case "estado":
      if (!dadosLimpos.estado)
        return "Campo obrigatório, informe o estado";
      break;
    
    case "numero":
      if (dadosLimpos.numero) {
        if (!/^\d+[A-Za-z]?$/.test(dadosLimpos.numero))
          return "Número inválido, o único caractere especial permitido é uma letra no final do número (ex: 123 ou 123A)";
        if (dadosLimpos.numero.length > 10)
          return "Número inválido, deve conter no máximo 10 caracteres";
      }
      break;
    
    case "complemento":
      if (dadosLimpos.numero) {
        if (dadosLimpos.complemento.length > 100)
          return "O complemento é muito longo, deve conter no máximo 100 caracteres";
        if (dadosLimpos.complemento.length < 2)
          return "Complemento inválido, deve conter pelo menos 2 caracteres";
      }
      break;

    case "telefone":
      if (!dadosLimpos.telefone) 
        return "Campo obrigatório, informe o telefone";
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

    case "diasFuncionamento":
      if (!dadosLimpos.diasFuncionamento || dadosLimpos.diasFuncionamento.length === 0)
        return "Campo obrigatório, selecione ao menos um dia";
      if (!diasFuncionamentoValido(dadosLimpos.diasFuncionamento))
        return "Dias de funcionamento inválidos, escolha pelo menos um dia da semana";
      break;

    case "horarioInicio":
      if (!dadosLimpos.horarioInicio) 
        return "Campo obrigatório, informe o horário de início";
      if (!horaValida(dadosLimpos.horarioInicio))
        return "Horário de abertura inválido";
      if (horaValida(dadosLimpos.horarioInicio) && horaValida(dadosLimpos.horarioFim)) { 
        if (!horarioCoerente(dadosLimpos.horarioInicio, dadosLimpos.horarioFim))
          return "O horário de abertura deve ser antes do fechamento";
      }
      break;

    case "horarioFim":
      if (!dadosLimpos.horarioFim) 
        return "Campo obrigatório, informe o horário de fim";
      if (!horaValida(dadosLimpos.horarioFim))
        return "Horário de fechamento inválido";
      if (horaValida(dadosLimpos.horarioInicio) && horaValida(dadosLimpos.horarioFim)) { // se os dois horários forem válidos
        if (!horarioCoerente(dadosLimpos.horarioInicio, dadosLimpos.horarioFim))
          return "O horário de fechamento deve ser depois da abertura";
      }
      break;

    case "sobre":
      if (!dadosLimpos.sobre) 
        return "Campo obrigatório, informe sobre a ONG";
      if (!textoSobreLongoValido(dadosLimpos.sobre))
        return "Texto sobre a ONG inválido, deve conter no máximo 500 caracteres";
      if (!textoSobreCurtoValido(dadosLimpos.sobre))
        return "Texto sobre a ONG inválido, deve conter pelo menos 50 caracteres";
      break;

    case "instagram":
      if (dadosLimpos.instagram) {
        const url = normalizarUrl(dadosLimpos.instagram);
        
        if (!urlValida(url))
          return "URL do Instagram inválida, contém caracteres inválidos, espaços ou formato incorreto";
        if (!/^https?:\/\/(www\.)?instagram\.com\/.+/.test(url))
          return "Informe uma URL válida do Instagram (ex: https://instagram.com/usuario)";
        if (url.length > 100) 
          return "O URL do Instagram está muito longo, deve conter no máximo 100 caracteres";
      }
      break;

    case "facebook":
      if (dadosLimpos.facebook) {
        const url = normalizarUrl(dadosLimpos.facebook);

         if (!urlValida(url))
          return "URL do Facebook inválida, contém caracteres inválidos, espaços ou formato incorreto";
        if (!/^https?:\/\/(www\.)?facebook\.com\/.+/.test(url))
          return "Informe uma URL válida do Facebook (ex: https://facebook.com/pagina)";
        if (url.length > 100) 
          return "O URL do Facebook está muito longo, deve conter no máximo 100 caracteres";
      }
      break;

    case "site":
      if (dadosLimpos.site) {
        const urlNormalizada = normalizarUrl(dadosLimpos.site);
        
        if (!urlValida(urlNormalizada)) 
          return "URL do site inválida (exemplo: https://www.site.com)";
        if (!urlNormalizada.includes(".")) 
          return "O site deve conter um domínio (ex: .com, .org)";
        if (!urlNormalizada.startsWith("http://") && !urlNormalizada.startsWith("https://")) 
          return "O site deve começar com http:// ou https://";
        if (urlNormalizada.length > 100) 
          return "O URL do site está muito longo, deve conter no máximo 100 caracteres";
      }
  }

  return "";
}