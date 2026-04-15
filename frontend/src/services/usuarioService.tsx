import api from "./api";

export type DadosUsuario = { // (GET retorno)
  id: number;
  nome_completo: string;
  data_nascimento: string;
  cpf: string;
  cep: string;
  telefone?: string; // telefone é opcional no backend, então aqui também
  email: string;
  // senha não é retornada pelo backend por segurança, então não coloco aqui
  funcao: { // a pessoa pode ter mais de uma função, então é um array.
    tipo_usuario: string;
  }[];
  data_cadastro?: string; // não é criado no backend, criamos aqui no frontend para facilitar a manipulação, mas é opcional porque pode não vir do backend
  data_edicao_conta?: string;
};

export type CriarUsuarioEnvio = { // (POST envio) 
  nome_completo: string;
  data_nascimento: string;
  cpf: string;
  cep: string;
  telefone?: string;
  email: string;
  senha: string; // senha é obrigatória para criar um usuário
  // id é gerado pelo backend, então não precisa ser enviado
  // ver se dá para o backend criar o data_cadastro automaticamente
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

export type DadosBeneficiario = {
  qtd_familiares: number;
  auxilio: string; // "NENHUM", "BOLSA_FAMILIA" etc
  concordou_termos: boolean;
};

export type DadosFamilia = {
  nome: string;
  parentesco: string;
  data_nascimento: string;
  renda: number;
};

// aqui defino que a função recebe os dados para criar o usuário (sem id e data_cadastro) e retorna os dados do usuário criado (com id e data_cadastro)
export async function criarUsuario(dados: CriarUsuarioEnvio): Promise<DadosUsuario> {
  const response = await api.post<DadosUsuario>("/usuario/generico", dados); 
  return response.data;
}
export async function criarUsuarioBeneficiario(usuario_id: number, dados: DadosBeneficiario) {
  const response = await api.post(`/usuario/${usuario_id}/beneficiario`, dados);
  return response.data;
}

// Criar familiar para beneficiário
export async function criarFamiliar(responsavel_id: number, dados: DadosFamilia[]) {
  const response = await api.post(`/usuario/${responsavel_id}/familia-beneficiario`, dados);
  return response.data;
}
// quando chamar depois usar criarFamiliar(id, [familiar1, familiar2])

// Obter perfil do usuário
export async function obterUsuario(id: number) {
  const response = await api.get(`/usuario/${id}`);
  return response.data;
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