import { validarCPF, nomeCompletoValido, dataNaoFutura, idadeValida } from "./validacoes";

type DadosFamiliar = Partial<{
  nome: string;
  cpf: string;
  dataNascimento: string;
  parentesco: string;
  renda: number | string;
  beneficiario: boolean;
}>;

export function validarCampoFamiliar(
  campo: keyof DadosFamiliar,
  dados: DadosFamiliar
) {
  const dadosLimpos = {
    nome: dados.nome?.trim() || "",
    cpf: dados.cpf?.trim() || "",
    dataNascimento: dados.dataNascimento?.trim() || "",
    parentesco: dados.parentesco?.trim() || "",
    renda: dados.renda ? Number(dados.renda) : 0,
    beneficiario: dados.beneficiario || false,
  };

  switch (campo) {
    case "nome":
      if (!dadosLimpos.nome)
        return "Campo obrigatório, informe o nome completo";
      if (!nomeCompletoValido(dadosLimpos.nome))
        return "Nome inválido, deve conter pelo menos 2 nomes";
      if (dadosLimpos.nome.length > 100)
        return "Nome é muito longo, máximo 100 caracteres";
      break;

    case "cpf":
      if (!dadosLimpos.cpf)
        return "Campo obrigatório, informe o CPF";
      if (!validarCPF(dadosLimpos.cpf))
        return "CPF inválido, verifique os dígitos (formato: 000.000.000-00)";
      break;

    case "dataNascimento":
      if (!dadosLimpos.dataNascimento)
        return "Campo obrigatório, informe a data de nascimento";
      
      // Converter DD/MM/YYYY para YYYY-MM-DD para validação
      const partes = dadosLimpos.dataNascimento.split("/");
      if (partes.length !== 3 || partes[0].length !== 2 || partes[1].length !== 2 || partes[2].length !== 4) {
        return "Data inválida, formato correto: DD/MM/YYYY";
      }
      
      const dataISO = `${partes[2]}-${partes[1]}-${partes[0]}`;
      
      if (!dataNaoFutura(dataISO))
        return "Data inválida, não pode ser uma data futura";
      break;

    case "parentesco":
      if (!dadosLimpos.parentesco)
        return "Campo obrigatório, informe o parentesco";
      if (dadosLimpos.parentesco.length < 2)
        return "Parentesco inválido, mínimo 2 caracteres";
      if (dadosLimpos.parentesco.length > 50)
        return "Parentesco é muito longo, máximo 50 caracteres";
      if (!/^[A-Za-zÀ-ÿ\s\-']+$/.test(dadosLimpos.parentesco))
        return "Parentesco inválido, contém caracteres não permitidos";
      break;

    case "renda":
      if (dadosLimpos.renda < 0)
        return "Renda não pode ser negativa";
      if (dadosLimpos.renda > 999999999.99)
        return "Renda inválida, valor muito alto";
      break;

    case "beneficiario":
      // beneficiário é apenas true ou false, sem validação adicional necessária
      break;

    default:
      return "";
  }

  return "";
}

export function validarFamiliarCompleto(familiar: DadosFamiliar): Record<string, string> {
  const erros: Record<string, string> = {};

  const campos: (keyof DadosFamiliar)[] = ["nome", "cpf", "dataNascimento", "parentesco", "renda"];

  campos.forEach((campo) => {
    const erro = validarCampoFamiliar(campo, familiar);
    if (erro) {
      erros[campo] = erro;
    }
  });

  return erros;
}

export function todosOsCamposSaoValidos(familiar: DadosFamiliar): boolean {
  const erros = validarFamiliarCompleto(familiar);
  return Object.keys(erros).length === 0;
}
