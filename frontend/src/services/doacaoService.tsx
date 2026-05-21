import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";//VAI SER AJUSADO

function headersAutenticados() {
  const token = localStorage.getItem("access_token");
  const tipo = localStorage.getItem("token_type") || "bearer";
  return {
    Authorization: `${tipo} ${token}`,
  };
}

export type StatusDoacao =
  | "aguardando_triagem"
  | "pre_aprovado"
  | "inapto"
  | "incompleta"
  | "aguardando_nova_triagem";

export interface ImagemDoacao {
  id: number;
  caminho_arquivo: string;
  nome_original: string;
}

export interface Doacao {
  id: number;
  usuario_id: number;
  tipo_material: string;
  descricao: string;
  possiveis_defeitos?: string;
  quantidade: number;
  status: StatusDoacao;
  data_criacao: string;
  data_atualizacao: string;
  imagens: ImagemDoacao[];
}

export async function registrarDoacao(formData: FormData): Promise<Doacao> {
  const resposta = await axios.post(`${BASE_URL}/doacao/`, formData, {
    headers: {
      ...headersAutenticados(),
      "Content-Type": "multipart/form-data",
    },
  });
  return resposta.data;
}

export async function listarMinhasDoacoes(): Promise<Doacao[]> {
  const resposta = await axios.get(`${BASE_URL}/doacao/minhas`, {
    headers: headersAutenticados(),
  });
  return resposta.data;
}

export async function obterDoacao(id: number): Promise<Doacao> {
  const resposta = await axios.get(`${BASE_URL}/doacao/${id}`, {
    headers: headersAutenticados(),
  });
  return resposta.data;
}

export async function atualizarDoacao(
  id: number,
  formData: FormData
): Promise<Doacao> {
  const resposta = await axios.put(`${BASE_URL}/doacao/${id}`, formData, {
    headers: {
      ...headersAutenticados(),
      "Content-Type": "multipart/form-data",
    },
  });
  return resposta.data;
}