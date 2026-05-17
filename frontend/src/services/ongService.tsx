import api from "./api";
import {ONG} from "../context/OngContext";

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

// Criar ONG para usuário
export async function criarONG(dados: CriarONGEnvio) {
  const response = await api.post(`/ong/cadastro-ong`, dados);
  return response.data;
}

// Atualizar dados da ONG do usuário
export async function atualizarONG(ong_id: number, dados: AtualizarONGEnvio) {
  try {
    const response = await api.put(`/ong/editar-ong/${ong_id}`, dados);
    return response.data;
  } catch (err: any) {
    console.error("usuarioService.atualizarONG erro:", err?.response?.status, err?.response?.data);
    throw err;
  }
}

// Excluir ONG do usuário
export async function excluirONG(ong_id: number) {
  const response = await api.delete(`/ong/deletar-ong/${ong_id}`);
  return response.data;
}
