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
  | "AGUARDANDO_TRIAGEM"
  | "PRE_APROVADO"
  | "INAPTO"
  | "DISPONIVEL"
  | "MATERIAL_COLETADO"
  | "CANCELADO"
  | "INCOMPLETO"
  | "AGUARDANDO_NOVA_TRIAGEM";

export interface FotoItemDoacao {
  id: number;
  url: string;
  nome_original?: string;
  content_type?: string;
  tamanho_bytes?: number;
  created_at?: string;
}

export interface ItemDoacao {
  id: number;
  doacao_id: number;
  tipo_material: string;
  descricao: string;
  possiveis_defeitos?: string;
  quantidade: number;
  status: StatusDoacao;
  motivo_inaptidao?: string;
  created_at: string;
  updated_at: string;
  fotos: FotoItemDoacao[];
}

export interface Doacao {
  id: number;
  doador_id: number;
  ong_id: number;
  status: StatusDoacao;
  codigo_coleta: string;
  observacao_doador?: string;
  email_status_enviado_em?: string;
  created_at: string;
  updated_at: string;
  itens: ItemDoacao[];
}

export async function registrarDoacao(formData: FormData): Promise<Doacao> {
  const resposta = await axios.post(`${BASE_URL}/doacoes/formulario`, formData, {
    headers: {
      ...headersAutenticados(),
      "Content-Type": "multipart/form-data",
    },
  });
  return resposta.data;
}

export async function listarMinhasDoacoes(): Promise<Doacao[]> {
  const resposta = await axios.get(`${BASE_URL}/doacoes`, {
    headers: headersAutenticados(),
  });
  return resposta.data;
}

export async function obterDoacao(id: number): Promise<Doacao> {
  const resposta = await axios.get(`${BASE_URL}/doacoes/${id}`, {
    headers: headersAutenticados(),
  });
  return resposta.data;
}

export async function atualizarDoacao(
  id: number,
  formData: FormData
): Promise<Doacao> {
  throw new Error("Atualizacao de doacao nao suportada no backend.");
}