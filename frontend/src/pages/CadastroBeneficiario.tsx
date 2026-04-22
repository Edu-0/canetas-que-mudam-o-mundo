import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { IMaskInput } from "react-imask";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Botao from "../components/Botao";
import Toast from "../components/Toast";
import logo from "../assets/logo.svg";

type Familiar = {
  nome: string;
  dataNascimento: string;
  cpf: string;
  parentesco: string;
  cep: string;
  telefone: string;
  email: string;
  renda: string;
  bens: string;
  documentos: File[];
};

function CadastroBeneficiario() {
  const navigate = useNavigate();

  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);

  const [familiares, setFamiliares] = useState<Familiar[]>(([
    {
      nome: "",
      dataNascimento: "",
      cpf: "",
      parentesco: "",
      cep: "",
      telefone: "",
      email: "",
      renda: "",
      bens: "",
      documentos: [],
    },
  ]));

  function handleChange(index: number, e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, type, files } = e.target;
    const novos = [...familiares];

    if (type === "file" && name === "documentos") {
      if (!files) return;

      const LIMITE_MB = 10;
      const arquivosValidos: File[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const tamanhoMB = file.size / (1024 * 1024);

        if (tamanhoMB > LIMITE_MB) {
          setMensagem(`Arquivo "${file.name}" excede 10MB`);
          continue;
        }

        arquivosValidos.push(file);
      }

      novos[index].documentos = [
        ...novos[index].documentos,
        ...arquivosValidos,
      ];

      e.target.value = "";
    } else {
      const campo = name as keyof Omit<Familiar, "documentos">;
      novos[index][campo] = value as any;
    }

    setFamiliares(novos);
  }

  function removerArquivo(iFam: number, iArq: number) {
    const novos = [...familiares];
    novos[iFam].documentos.splice(iArq, 1);
    setFamiliares(novos);
  }

  function removerFamiliar(index: number) {
    const novos = familiares.filter((_, i) => i !== index);
    setFamiliares(novos);
  }

  function adicionarFamiliar() {
    setFamiliares([
      ...familiares,
      {
        nome: "",
        dataNascimento: "",
        cpf: "",
        parentesco: "",
        cep: "",
        telefone: "",
        email: "",
        renda: "",
        bens: "",
        documentos: [],
      },
    ]);
  }

  function handleCancelar() {
    navigate(-1);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    navigate("/confirmar-familiares", {
      state: { familiares },
    });
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--base-5)]">
      <Header />

      <main className="flex-1 pt-24 pb-12">
        <div className="w-full px-6 md:px-20 flex flex-col gap-12">

          <Toast mensagem={mensagem} tipo="sucesso" />

          {/* Topo */}
          <div className="flex flex-col items-center text-center gap-3">
            <img src={logo} alt="Logo" className="h-16" />
            <h1 className="header-medio text-[var(--base-80)]">
              Canetas que Mudam o Mundo
            </h1>
            <p className="text-sm text-[var(--base-60)]">
              Preencha os dados dos familiares
            </p>
          </div>

          {/* Card */}
          <div className="flex justify-center">
            <div className="w-full max-w-5xl bg-[var(--primario-5)] border border-[var(--base-20)] rounded-2xl shadow-lg p-8">

              <h2 className="text-center text-[var(--base-80)] font-semibold mb-8">
                Cadastro de Familiar
              </h2>

              <form onSubmit={handleSubmit} className="flex flex-col gap-8">

                {familiares.map((familiar, index) => (
                  <div
                    key={index}
                    className="bg-[var(--base-0)] border border-[var(--base-20)] rounded-xl p-6 shadow-sm hover:shadow-md transition"
                  >

                    {/* Header */}
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-[var(--base-80)]">
                          Familiar {index + 1}
                        </h3>

                        <span className="bg-[var(--base-20)] text-xs px-2 py-0.5 rounded-full">
                          {index + 1}
                        </span>
                      </div>

                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => removerFamiliar(index)}
                          className="text-red-500 text-sm hover:underline"
                        >
                          Remover
                        </button>
                      )}
                    </div>

                    {/* Nome */}
                    <input
                      name="nome"
                      value={familiar.nome}
                      onChange={(e) => handleChange(index, e)}
                      placeholder="Nome completo"
                      className="input-padrao"
                      required
                    />

                    {/* Linha */}
                    <div className="grid md:grid-cols-3 gap-6 mt-4">
                      <IMaskInput
                        mask="00/00/0000"
                        name="dataNascimento"
                        value={familiar.dataNascimento}
                        onAccept={(value) =>
                          handleChange(index, {
                            target: { name: "dataNascimento", value },
                          } as any)
                        }
                        placeholder="Nascimento"
                        className="input-padrao"
                        required
                      />

                      <IMaskInput
                        mask="000.000.000-00"
                        name="cpf"
                        value={familiar.cpf}
                        onAccept={(value) =>
                          handleChange(index, {
                            target: { name: "cpf", value },
                          } as any)
                        }
                        placeholder="CPF"
                        className="input-padrao"
                        required
                      />

                      <input
                        name="parentesco"
                        value={familiar.parentesco}
                        onChange={(e) => handleChange(index, e)}
                        placeholder="Parentesco"
                        className="input-padrao"
                        required
                      />
                    </div>

                    {/* Contato */}
                    <div className="grid md:grid-cols-2 gap-6 mt-4">
                      <IMaskInput
                        mask="00000-000"
                        name="cep"
                        value={familiar.cep}
                        onAccept={(value) =>
                          handleChange(index, {
                            target: { name: "cep", value },
                          } as any)
                        }
                        placeholder="CEP"
                        className="input-padrao"
                        required
                      />

                      <IMaskInput
                        mask="(00) 0000-0000"
                        name="telefone"
                        value={familiar.telefone}
                        onAccept={(value) =>
                          handleChange(index, {
                            target: { name: "telefone", value },
                          } as any)
                        }
                        placeholder="Telefone"
                        className="input-padrao"
                        required
                      />
                    </div>

                    <input
                      name="email"
                      value={familiar.email}
                      onChange={(e) => handleChange(index, e)}
                      placeholder="Email"
                      className="input-padrao mt-4"
                      required
                    />

                  

                    {/* Financeiro */}
                    <div className="grid md:grid-cols-2 gap-6 mt-4">
                      <input
                        name="renda"
                        value={familiar.renda}
                        onChange={(e) => handleChange(index, e)}
                        placeholder="Renda"
                        className="input-padrao"
                      />

                      <input
                        name="bens"
                        value={familiar.bens}
                        onChange={(e) => handleChange(index, e)}
                        placeholder="Bens"
                        className="input-padrao"
                      />
                    </div>

                    {/* Upload */}
                    <div className="mt-6">
                      <div className="flex justify-between items-center border border-[var(--base-20)] rounded-lg px-4 py-3">

                        <span className="text-sm text-[var(--base-60)]">
                          Selecione ou arraste arquivos
                        </span>

                        <label className="cursor-pointer text-sm border px-3 py-1 rounded-md">
                          Selecionar
                          <input
                            type="file"
                            multiple
                            name="documentos"
                            onChange={(e) => handleChange(index, e)}
                            className="hidden"
                          />
                        </label>
                      </div>

                      <p className="text-xs text-[var(--base-60)] mt-2">
                        Máx. 10MB por arquivo
                      </p>

                      {familiar.documentos.length > 0 && (
                        <div className="mt-3 flex flex-col gap-2">
                          {familiar.documentos.map((file, i) => (
                            <div
                              key={i}
                              className="flex justify-between items-center text-sm bg-[var(--base-5)] px-3 py-2 rounded"
                            >
                              <span className="truncate">{file.name}</span>

                              <button
                                type="button"
                                onClick={() => removerArquivo(index, i)}
                                className="text-red-500 text-xs"
                              >
                                remover
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                ))}

                {/* Add familiar */}
                <div
                  onClick={adicionarFamiliar}
                  className="border border-dashed border-[var(--base-30)] rounded-xl p-6 text-center cursor-pointer hover:bg-[var(--base-5)]"
                >
                  + Adicionar outro familiar
                </div>

                {/* Botões */}
                <div className="flex gap-3 justify-end pt-6 border-t">
                  <Botao tipo="button" variante="cancelar" aoClicar={handleCancelar}>
                    Cancelar
                  </Botao>

                  <Botao tipo="submit" variante="confirmar" desabilitado={carregando}>
                    Confirmar cadastro
                  </Botao>
                </div>

              </form>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default CadastroBeneficiario;