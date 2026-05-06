export type Familiar = {
  id?: number; // undefined para novos familiares, definido para existentes
  nome: string;
  dataNascimento: string;
  cpf: string;
  parentesco: string;
  renda: number;
  documentos: File[];
  beneficiario: boolean;
};