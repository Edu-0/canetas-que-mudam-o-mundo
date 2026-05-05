import api from "./api";
import { BeneficiosUsuario, type TipoBeneficio } from "../context/UserContext";
import {ONG} from "../context/OngContext";

export type DadosUsuario = { // (GET retorno)
  id: number;
  nome_completo: string;
  data_nascimento: string;
  cpf: string;
  cep: string;
  telefone?: string; // telefone é opcional no backend, então aqui também
  email: string;
  funcao: { // a pessoa pode ter mais de uma função, então é um array.
    tipo_usuario: string;
  }[];
  data_cadastro?: string; // não é criado no backend, criamos aqui no frontend para facilitar a manipulação, mas é opcional porque pode não vir do backend
  data_edicao_conta?: string;
  ativo?: boolean; 
};

export type CriarUsuarioEnvio = { // (POST envio) 
  nome_completo: string;
  data_nascimento: string;
  cpf: string;
  cep: string;
  telefone?: string;
  email: string;
  senha: string; // senha é obrigatória para criar um usuário
  token_convite?: string; // token de convite para o voluntário
};

export type AtualizarUsuarioEnvio = { // (PUT envio)
  nome_completo?: string;
  data_nascimento?: string;
  cpf?: string;
  cep?: string;
  telefone?: string;
  email?: string;
  senha?: string;
};

export type DadosResponsavel = {
  qtd_familiares: number;
  auxilio: TipoBeneficio; // chave do benefício no frontend
  concordou_termos: boolean;
  renda: number;
};

export type DadosFamilia = {
  nome: string;
  parentesco: string;
  data_nascimento: string;
  renda: number;
  beneficiario: boolean; // sim ou não
  documentos: File[]; // array de arquivos para upload
};

export type CriarONGEnvio = {
  nome: string;
  cnpj: string;
  cep?: string;
  rua: string;
  bairro: string;
  cidade: string;
  estado: string;
  numero?: string;
  complemento?: string;
  telefone: string;
  email: string;
  diasFuncionamento: number[];
  horarioInicio: string;
  horarioFim: string;
  sobre: string;
  instagram?: string;
  facebook?: string;
  site?: string;
};

export type AtualizarONGEnvio =  { // PUT editar ONG, o usuário pode enviar apenas os campos que deseja atualizar, então todos são opcionais
  nome?: string;
  cnpj?: string;
  cep?: string;
  rua?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  numero?: string;
  complemento?: string;
  telefone?: string;
  email?: string;
  diasFuncionamento?: number[];
  horarioInicio?: string;
  horarioFim?: string;
  sobre?: string;
  instagram?: string;
  facebook?: string;
  site?: string;
}; 

// tipo de resposta do backend para o link de cadastro de voluntário
type RespostaLinkVoluntario = {
  link: string;
};

// aqui defino que a função recebe os dados para criar o usuário (sem id e data_cadastro) e retorna os dados do usuário criado (com id e data_cadastro)
export async function criarUsuario(dados: CriarUsuarioEnvio): Promise<DadosUsuario> {
  const response = await api.post<DadosUsuario>("/usuario/generico", dados); 
  return response.data;
}

export async function criarUsuarioResponsavel(usuarioId: number, formData: FormData) {
    const response = await api.post(`/usuario/${usuarioId}/responsavel`, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    return response.data;
}

// Criar familiar para beneficiário
export async function criarFamiliar(responsavel_id: number, dados: DadosFamilia[]) {
  const response = await api.post(`/usuario/${responsavel_id}/familia-responsavel`, dados);
  return response.data;
}

// Obter perfil do usuário
export async function obterPerfil() {
  const response = await api.get("/usuario/perfil/me");
  return response.data;
}

// Obter todos os usuários (para a página de listagem de voluntários da triagem) TESTE
export async function obterTodosUsuarios(): Promise<DadosUsuario[]> {
  const response = await api.get("/usuario");
  return response.data; // se for algo como [{ "id": 1, "nome_completo": "João Silva", ... }, { "id": 2, "nome_completo": "Maria Souza", ... }]
}

// Atualizar perfil do usuário
export async function atualizarUsuario(id: number, dados: AtualizarUsuarioEnvio) {
  const response = await api.put(`/usuario/${id}`, dados); 
  return response.data;
}

// Atualizar tipos do usuário 
export async function atualizarTiposUsuario(id: number, tipos: string[]) {
  const response = await api.put(`/usuario/${id}/funcao`, { 
    tipo_usuario: tipos 
  });
  return response.data;
}

// Excluir conta (anonimização)
export async function excluirConta(usuario_id: number) {
  const response = await api.delete(`/usuario/${usuario_id}`);
  return response.data;
}

// Pedir redefinição da senha
export async function solicitarRedefinicaoSenha(email: string) {
  return api.post("/password/recuperar-senha", { email });
}

// Redefinir senha
export async function redefinirSenha(token: string, senha: string) {
  return api.post("/password/redefinir-senha", {
    token,
    nova_senha: senha,
  });
}

// Criar ONG para usuário
export async function criarONG(dados: CriarONGEnvio) {
  const response = await api.post(`/ong/cadastro-ong`, dados);
  return response.data;
}

// Atualizar dados da ONG do usuário
export async function atualizarONG(dados: AtualizarONGEnvio) {
  console.log("usuarioService.atualizarONG dados:", dados);
  // const response = await api.put(`/ong/editar-ong`, dados);
  // console.log("usuarioService.atualizarONG resposta:", response.data);
  // return response.data;
  try {
    const response = await api.put(`/ong/editar-ong`, dados);
    console.log("usuarioService.atualizarONG resposta:", response.data);
    return response.data;
  } catch (err: any) {
    console.error("usuarioService.atualizarONG erro:", err?.response?.status, err?.response?.data);
    throw err;
  }
}

// Obter dados da ONG do usuário
export async function obterONG(): Promise<ONG> {
  const response = await api.get(`/ong/minha-ong`);
  return response.data; // se for algo como { "nome": "ONG Exemplo", "cnpj": "00.000.000/0000-00", ... }
}

// Obter todas as ONGs (para a página de listagem)
export async function obterTodasONGs() {
  const response = await api.get("/ong");
  return response.data; 
}

// Obter link para cadastro de voluntário
export async function obterLinkCadastroVoluntario(): Promise<string> {
  const response = await api.get<RespostaLinkVoluntario>(
    "/usuario/ong/link-voluntario"
  );

  return response.data.link; //  se for algo como { "ong_id": 1, "tipo": "Voluntário da triagem", "expira_em": "2026-05-10"}
}