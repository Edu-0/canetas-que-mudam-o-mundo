import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { IMaskInput } from "react-imask";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Botao from "../components/Botao";
import Toast from "../components/Toast";
import logo from "../assets/logo.svg";
import { atualizarTiposUsuario, DadosUsuario, obterPerfil, criarFamiliar, obterFamiliares, atualizarFamiliar, deletarFamiliar } from "../services/usuarioService";
import { mapearTipo, TipoUsuario, useUsuario } from "../context/UserContext";
import { Familiar } from "../types/Familiar";

function CadastroBeneficiario() {
  const navigate = useNavigate();

  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);
  const location = useLocation();
  const dadosResponsavel = location.state?.dadosResponsavel;

  const [familiares, setFamiliares] = useState<Familiar[]>([
    {
      nome: "",
      dataNascimento: "",
      cpf: "",
      parentesco: "",
      renda: 0,
      documentos: [],
      beneficiario: false,
    },
  ]);

  const [familiaresOriginais, setFamiliaresOriginais] = useState<Familiar[]>([]);

  // Carregar familiares existentes ao montar o componente
  useEffect(() => {
    const carregarFamiliares = async () => {
      try {
        setCarregando(true);
        const familiaresExistentes = await obterFamiliares();
        
        if (familiaresExistentes.length > 0) {
          // Converter formato do backend para formato do frontend
          const familiaresFormatados: Familiar[] = familiaresExistentes.map(f => {
            // Converter data de YYYY-MM-DD para DD/MM/YYYY
            let dataNascimento = f.data_nascimento;
            if (dataNascimento && dataNascimento.includes('-')) {
              const [ano, mes, dia] = dataNascimento.split('-');
              dataNascimento = `${dia}/${mes}/${ano}`;
            }

            return {
              id: f.id,
              nome: f.nome,
              dataNascimento,
              cpf: f.cpf,
              parentesco: f.parentesco,
              renda: f.renda,
              documentos: [],
              beneficiario: f.beneficiario,
            };
          });
          setFamiliares(familiaresFormatados);
          setFamiliaresOriginais(familiaresFormatados);
        }
      } catch (error) {
        console.log("Nenhum familiar cadastrado ainda.");
      } finally {
        setCarregando(false);
      }
    };

    carregarFamiliares();
  }, []);

  type ChangeLikeEvent = {
    target: {
      name: string;
      value: string;
      type?: string;
      files?: FileList | null;
    };
  };

  function handleChange(
    index: number,
    e: React.ChangeEvent<HTMLInputElement> | ChangeLikeEvent
  ) {
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

    } else {
      if (name === "beneficiario") {
        novos[index].beneficiario = value === "true";
      } else if (name === "renda") {
        novos[index].renda = parseFloat(value) || 0;
      } else if (
        name === "nome" ||
        name === "dataNascimento" ||
        name === "cpf" ||
        name === "parentesco"
      ) {
        novos[index][name] = value;
      }
    }

    setFamiliares(novos);
  }

  function removerArquivo(iFam: number, iArq: number) {
    const novos = [...familiares];
    novos[iFam].documentos.splice(iArq, 1);
    setFamiliares(novos);
  }

  function removerFamiliar(index: number) {
    if (familiares.length <= 1) {
      setMensagem("Você precisa ter pelo menos um familiar cadastrado.");
      return;
    }
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
        renda: 0,
        documentos: [],
        beneficiario: false,
      },
    ]);
  }

  function handleCancelar() {
    navigate(-1);
  }

  // Converter data de DD/MM/YYYY para YYYY-MM-DD
  function converterDataParaISO(data: string): string {
    if (!data) return '';
    const partes = data.split('/');
    if (partes.length === 3) {
      return `${partes[2]}-${partes[1]}-${partes[0]}`;
    }
    return data;
  }

  function extrairMensagemErro(error: any): string {
    const detail = error?.response?.data?.detail;

    if (typeof detail === "string") {
      return detail;
    }

    if (Array.isArray(detail)) {
      const mensagens = detail
        .map((item) => {
          if (typeof item === "string") return item;
          if (item && typeof item === "object" && typeof item.msg === "string") {
            return item.msg;
          }
          return null;
        })
        .filter(Boolean);

      if (mensagens.length > 0) {
        return mensagens.join(" | ");
      }
    }

    if (detail && typeof detail === "object") {
      if (typeof detail.mensagem === "string") return detail.mensagem;
      if (typeof detail.msg === "string") return detail.msg;
    }

    return "Erro ao salvar familiares.";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (carregando) {
      return;
    }

    try {
      setCarregando(true);

      // Separar familiares novos (sem id) dos existentes (com id)
      const familiaresNovos = familiares.filter(f => !f.id);
      const familiaresExistentes = familiares.filter(f => f.id);

      // Identificar familiares deletados (que estavam em familiaresOriginais mas não estão mais)
      const idsExistentesAgora = new Set(familiaresExistentes.map(f => f.id));
      const familiaresdeletados = familiaresOriginais.filter(
        f => f.id && !idsExistentesAgora.has(f.id)
      );

      // Preparar dados dos novos familiares para envio
      const dadosParaEnviar = familiaresNovos.map(f => ({
        nome: f.nome,
        cpf: f.cpf.replace(/\D/g, ''), // Remove formatação do CPF
        parentesco: f.parentesco,
        data_nascimento: converterDataParaISO(f.dataNascimento),
        renda: f.renda,
        beneficiario: f.beneficiario,
      }));

      // Validação cliente: o backend valida renda <= 100000 para criação.
      const LIMITE_RENDA = 100000;
      const excedente = dadosParaEnviar.find(d => Number(d.renda) > LIMITE_RENDA);
      if (excedente) {
        setMensagem(`Valor de renda excede o limite permitido de ${LIMITE_RENDA}. Ajuste e tente novamente.`);
        setCarregando(false);
        return;
      }

      let perfilUsuario: any = null;
      let responsavelId: number | null = null;

      // Se há familiares novos, criar primeiro
      if (familiaresNovos.length > 0) {
        perfilUsuario = await obterPerfil();
        responsavelId = perfilUsuario.perfil_responsavel?.id;

        if (!responsavelId) {
          setMensagem("Erro: Não foi possível obter o ID do responsável.");
          return;
        }

        await criarFamiliar(responsavelId, dadosParaEnviar);
      }

      // Atualizar familiares existentes que foram modificados
      for (const familiar of familiaresExistentes) {
        if (familiar.id == null) {
          continue;
        }

        const originalIndex = familiaresOriginais.findIndex(f => f.id === familiar.id);
        if (originalIndex !== -1) {
          const original = familiaresOriginais[originalIndex];
          
          // Verificar se algo mudou
          const mudou = 
            original.nome !== familiar.nome ||
            original.dataNascimento !== familiar.dataNascimento ||
            original.parentesco !== familiar.parentesco ||
            original.renda !== familiar.renda ||
            original.beneficiario !== familiar.beneficiario;

          if (mudou) {
            await atualizarFamiliar(familiar.id, {
              nome: familiar.nome,
              parentesco: familiar.parentesco,
              data_nascimento: converterDataParaISO(familiar.dataNascimento),
              renda: familiar.renda,
              beneficiario: familiar.beneficiario,
              documentos: [],
              cpf: familiar.cpf.replace(/\D/g, ''),
            });
          }
        }
      }

      // Deletar familiares que foram removidos
      for (const familiar of familiaresdeletados) {
        await deletarFamiliar(familiar.id!);
      }

      setMensagem("Familiares atualizados com sucesso!");

      // Navegar para confirmar
      navigate("/confirmar-familiares", {
        state: { 
          familiares,
          dadosResponsavel
        },
      });

    } catch (error: any) {
      console.error("Erro ao salvar familiares:", error);
      setMensagem(extrairMensagemErro(error));
    } finally {
      setCarregando(false);
    }
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
              Cadastro de Familiar
            </h1>
            <p className="text-sm text-[var(--base-60)]">
              Preencha os dados dos familiares
            </p>
          </div>

          {/* Card */}
          <div className="flex justify-center">
            <div className="w-full max-w-5xl bg-[var(--primario-5)] border border-[var(--base-20)] rounded-2xl shadow-lg p-8">

              <form onSubmit={handleSubmit} className="flex flex-col gap-8">

                {familiares.map((familiar, index) => (
                  <div
                    key={index}
                    className="bg-[var(--base-0)] border border-[var(--base-20)] rounded-xl p-6 shadow-sm"
                  >

                    {/* Header */}
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-[var(--base-80)]">
                          Familiar {index + 1}
                        </h3>
                        {familiar.id ? (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            Existente
                          </span>
                        ) : (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                            Novo
                          </span>
                        )}
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
                    <Campo  label="Nome completo">
                      <input
                        name="nome"
                        value={familiar.nome}
                        onChange={(e) => handleChange(index, e)}
                        className="input-padrao"
                        required
                      />
                    </Campo>

                    {/* Linha */}
                    <div className="grid md:grid-cols-3 gap-6 mt-4">

                      <Campo  label="Data de nascimento">
                        <IMaskInput
                          mask="00/00/0000"
                          name="dataNascimento"
                          value={familiar.dataNascimento}
                          onAccept={(value) =>
                            handleChange(index, {
                              target: { name: "dataNascimento", value },
                            })
                          }
                          className="input-padrao"
                          required
                        />
                      </Campo>

                      <Campo label="CPF">
                        <IMaskInput
                          mask="000.000.000-00"
                          name="cpf"
                          value={familiar.cpf}
                          onAccept={(value) =>
                            handleChange(index, {
                              target: { name: "cpf", value },
                            })
                          }
                          className="input-padrao"
                          required
                        />
                      </Campo>

                      <Campo label="Parentesco">
                        <input
                          name="parentesco"
                          value={familiar.parentesco}
                          onChange={(e) => handleChange(index, e)}
                          className="input-padrao"
                          required
                        />
                      </Campo>

                    </div>

                    {/* Financeiro */}
                    <div className="grid md:grid-cols-2 gap-6 mt-4">

                      <Campo label="Renda">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          name="renda"
                          value={familiar.renda}
                          onChange={(e) => handleChange(index, e)}
                          className="input-padrao"
                          required
                        />
                      </Campo>
                    </div>

                    {/* Beneficiário */}
                    <div className="mt-4">
                      <label className="text-sm font-medium block mb-2">
                        É beneficiário?
                      </label>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={familiar.beneficiario}
                          onClick={() => {
                            const novos = [...familiares];
                            novos[index].beneficiario = !novos[index].beneficiario;
                            setFamiliares(novos);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              const novos = [...familiares];
                              novos[index].beneficiario = !novos[index].beneficiario;
                              setFamiliares(novos);
                            }
                          }}
                          className={`relative inline-flex items-center w-14 h-7 rounded-full transition-colors
                            ${familiar.beneficiario ? "bg-[var(--base-40)]" : "bg-gray-300"}
                            focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2
                          `}
                        >
                          <span
                            className={`inline-block w-5 h-5 transform bg-white rounded-full transition-transform
                              ${familiar.beneficiario ? "translate-x-7" : "translate-x-1"}
                            `}
                          />
                        </button>

                        <span
                          className={`text-sm font-medium leading-none
                            ${familiar.beneficiario ? "text-black" : "text-[var(--base-70)]"}
                          `}
                        >
                          {familiar.beneficiario ? "Sim" : "Não"}
                        </span>
                      </div>
                    </div>

                    {/* Upload */}
                    <div className="mt-6">
                      
                      <label className="block text-sm font-medium">
                        Arquivos *
                      </label>

                      <div className="flex justify-between items-center border rounded-lg px-4 py-3 mt-1">
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
                            required
                          />
                        </label>
                      </div>

                      {familiar.documentos.length > 0 && (
                        <div className="mt-3 flex flex-col gap-2">
                          {familiar.documentos.map((file, i) => (
                            <div
                              key={i}
                              className="flex justify-between text-sm bg-[var(--base-5)] px-3 py-2 rounded"
                            >
                              {file.name}
                              <button
                                type="button"
                                onClick={() => removerArquivo(index, i)}
                                className="text-red-500"
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

                {/* Add */}
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

/* 🔹 Campo reutilizável */
function Campo({ titulo, label, children }: any) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-[var(--base-60)]">
        {titulo}
      </span>
      <label className="text-sm font-medium">
        {label} *
      </label>
      {children}
    </div>
  );
}

export default CadastroBeneficiario;