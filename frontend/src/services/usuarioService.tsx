import axios from "axios";
import api from "./api";

export type DadosUsuario = {
  nome_completo: string;
  data_nascimento: string;
  cpf: string;
  cep: string;
  telefone: string;
  email: string;
  senha: string;
  funcao?: string; // TipoUsuario.GENERICO
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

export async function criarUsuario(dados: DadosUsuario) {
  const response = await api.post("/usuario/generico", dados);
  return response.data;
}

export async function criarUsuarioBeneficiario(usuario_id: number, dados: DadosBeneficiario) {
  const response = await api.post(`/usuario/${usuario_id}/beneficiario`, dados);
  return response.data;
}

// Criar familiar para beneficiário
export async function criarFamiliar(usuario_id: number, dados: DadosFamilia) {
  const response = await api.post(`/usuario/${usuario_id}/beneficiario/familiar`, dados);
  return response.data;
}

// Obter perfil do usuário
export async function obterPerfil(usuarioId: number) {
  const response = await api.get(`/usuario/${usuarioId}/perfil`);
  return response.data;
}

// // Criar doador
// export const criarDoador = async (dados: any) => {
//   const response = await api.post("/usuario/doador", dados)
//   return response.data
// }

// // Criar voluntário
// export const criarVoluntario = async (dados: any) => {
//   const response = await api.post("/usuario/voluntario", dados)
//   return response.data
// }

// // Obter perfil do usuário
// export const obterPerfil = async (usuarioId: number) => {
//   const response = await api.get(`/usuario/${usuarioId}/perfil`)
//   return response.data
// }

// // Atualizar perfil do usuário
// export const atualizarPerfil = async (usuarioId: number, dados: any) => {
//   const response = await api.put(`/usuario/${usuarioId}/perfil`, dados)
//   return response.data
// }

// // Obter beneficiários do usuário   
// export const obterBeneficiarios = async (usuarioId: number) => {
//   const response = await api.get(`/usuario/${usuarioId}/beneficiarios`)
//   return response.data
// }
