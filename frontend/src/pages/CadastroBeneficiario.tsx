import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { IMaskInput } from "react-imask";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Botao from "../components/Botao";
import Toast from "../components/Toast";
import ModalConfirmacao from "../components/ModalConfirmacao";
import logo from "../assets/logo.svg";
import { atualizarTiposUsuario, DadosUsuario, obterPerfil, criarFamiliar, obterFamiliares, atualizarFamiliar, deletarFamiliar } from "../services/usuarioService";
import { mapearTipo, TipoUsuario, useUsuario } from "../context/UserContext";
import { Familiar } from "../types/Familiar";
import { validarCampoFamiliar } from "../utils/validacoesResponsavel";

function CadastroBeneficiario() {
  const navigate = useNavigate();

  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);
  const location = useLocation();
  const dadosResponsavel = location.state?.dadosResponsavel;
  const [modalAberto, setModalAberto] = useState(false);
  const [tentarSair, setTentarSair] = useState(false);

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

  const [erros, setErros] = useState<Record<number, Record<string, string>>>({});
  const [tocados, setTocados] = useState<Record<number, Record<string, boolean>>>({});

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
      const campo = name as Exclude<keyof Familiar, "documentos" | "id">;

      // Limites de caracteres
      const limites: Record<string, number> = {
        nome: 100,
        parentesco: 50,
      };

      let valorLimitado = value;
      if (limites[campo] && value.length > limites[campo]) {
        valorLimitado = value.slice(0, limites[campo]);
      }

      if (campo === "beneficiario") {
        novos[index].beneficiario = value === "true";
      } else if (campo === "renda") {
        novos[index].renda = parseFloat(value) || 0;
      } else {
        // corrigir erro de tipo: atribuição para propriedade indexada pode inferir 'never'
        (novos[index] as any)[campo] = valorLimitado;
      }

      // Validar e atualizar erros
      if (tocados[index]?.[campo]) {
        const erro = validarCampoFamiliar(campo, novos[index]);
        setErros((prev) => ({
          ...prev,
          [index]: {
            ...prev[index] || {},
            [campo]: erro,
          },
        }));
      }
    }

    setFamiliares(novos);
  }

  function removerArquivo(iFam: number, iArq: number) {
    const novos = [...familiares];
    novos[iFam].documentos.splice(iArq, 1);
    setFamiliares(novos);
  }

  function handleBlur(index: number, campo: string) {
    setTocados((prev) => ({
      ...prev,
      [index]: {
        ...prev[index] || {},
        [campo]: true,
      },
    }));

    const erro = validarCampoFamiliar(campo as any, familiares[index]);
    setErros((prev) => ({
      ...prev,
      [index]: {
        ...prev[index] || {},
        [campo]: erro,
      },
    }));
  }

  function validarFamiliarCompleto(familiar: Familiar): boolean {
    const novasErros: Record<string, string> = {};
    const campos = ["nome", "dataNascimento", "cpf", "parentesco", "renda"];

    campos.forEach((campo) => {
      const erro = validarCampoFamiliar(campo as any, familiar);
      if (erro) {
        novasErros[campo] = erro;
      }
    });

    if (familiar.documentos.length === 0) {
      novasErros["documentos"] = "Selecione pelo menos um arquivo";
    }

    return Object.keys(novasErros).length === 0;
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
    const temMudancas = JSON.stringify(familiares) !== JSON.stringify(familiaresOriginais);
    if (temMudancas) {
      setTentarSair(true);
      setModalAberto(true);
    } else {
      navigate(-1);
    }
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      // Validar todos os familiares
      for (let i = 0; i < familiares.length; i++) {
        if (!validarFamiliarCompleto(familiares[i])) {
          setMensagem("Por favor, preencha todos os campos corretamente");
          // Marcar todos como tocados para mostrar erros
          const todosTocados: Record<number, Record<string, boolean>> = {};
          familiares.forEach((_, idx) => {
            todosTocados[idx] = {
              nome: true,
              dataNascimento: true,
              cpf: true,
              parentesco: true,
              renda: true,
              documentos: true,
            };
          });
          setTocados(todosTocados);
          return;
        }
      }

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
        documentos: [],
      }));

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
        setMensagem(`${familiaresNovos.length} familiar(es) criado(s) com sucesso!`);
      }

      // Atualizar familiares existentes que foram modificados
      for (const familiar of familiaresExistentes) {
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

          if (mudou && familiar.id !== undefined) {
            await atualizarFamiliar(familiar.id, {
              nome: familiar.nome,
              parentesco: familiar.parentesco,
              data_nascimento: converterDataParaISO(familiar.dataNascimento),
              renda: familiar.renda,
              beneficiario: familiar.beneficiario,
              documentos: [],
              cpf: familiar.cpf,
            });
          }
        }
      }

      // Deletar familiares que foram removidos
      for (const familiar of familiaresdeletados) {
        await deletarFamiliar(familiar.id!);
        setMensagem(`Familiar removido com sucesso!`);
      }

      setMensagem("Familiares atualizados com sucesso!");

      // Navegar para confirmar
      setTimeout(() => {
        navigate("/confirmar-familiares", {
          state: { 
            familiares,
            dadosResponsavel
          },
        });
      }, 1500);

    } catch (error: any) {
      console.error("Erro ao salvar familiares:", error);
      setMensagem(error?.response?.data?.detail || "Erro ao salvar familiares.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--base-5)]">
      <Header />

      <main className="flex-1 pt-20 pb-12 px-3 sm:px-6 md:px-20">
        <div className="w-full flex flex-col gap-12">

          <Toast mensagem={mensagem} tipo={mensagem.includes("Erro") ? "erro" : "sucesso"} />

          <ModalConfirmacao
            aberto={modalAberto}
            titulo="Descartar alterações?"
            descricao="Você tem alterações não salvas. Tem certeza que deseja sair?"
            botaoConfirmar="Sair sem salvar"
            botaoCancelar="Continuar editando"
            onConfirmar={() => {
              setModalAberto(false);
              navigate(-1);
            }}
            onCancelar={() => {
              setModalAberto(false);
              setTentarSair(false);
            }}
            varianteConfirmar="cancelar"
            varianteCancelar="confirmar"
          />

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
            <div className="w-full max-w-5xl bg-[var(--primario-5)] border border-[var(--base-20)] rounded-2xl shadow-lg p-6 sm:p-8">

              <form onSubmit={handleSubmit} className="flex flex-col gap-8" noValidate>

                {familiares.map((familiar, index) => (
                  <div
                    key={index}
                    className="bg-[var(--base-0)] border border-[var(--base-20)] rounded-xl p-6 shadow-sm"
                  >

                    {/* Header */}
                    <div className="flex justify-between items-center mb-4 gap-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-semibold text-[var(--base-80)]">
                          Familiar {index + 1}
                        </h3>
                        {familiar.id ? (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded whitespace-nowrap">
                            Existente
                          </span>
                        ) : (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded whitespace-nowrap">
                            Novo
                          </span>
                        )}
                      </div>

                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => removerFamiliar(index)}
                          className="text-[var(--cor-resposta-errada)] text-sm hover:underline px-2 py-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--cor-resposta-errada)] rounded"
                          aria-label={`Remover familiar ${index + 1}`}
                        >
                          Remover
                        </button>
                      )}
                    </div>

                    {/* Nome */}
                    <Campo label="Nome completo" erro={erros[index]?.nome}>
                      <input
                        name="nome"
                        value={familiar.nome}
                        onChange={(e) => handleChange(index, e)}
                        onBlur={() => handleBlur(index, "nome")}
                        placeholder="Digite o nome completo"
                        maxLength={100}
                        className={`input-padrao ${erros[index]?.nome && tocados[index]?.nome ? "border-[var(--cor-resposta-errada)] focus:ring-[var(--cor-resposta-errada)]" : ""}`}
                        aria-label="Nome completo do familiar"
                        aria-describedby={erros[index]?.nome && tocados[index]?.nome ? `erro-nome-${index}` : undefined}
                        required
                      />
                      {erros[index]?.nome && tocados[index]?.nome && (
                        <span id={`erro-nome-${index}`} className="text-xs text-[var(--cor-resposta-errada)] mt-1">
                          {erros[index].nome}
                        </span>
                      )}
                      {familiar.nome && !erros[index]?.nome && tocados[index]?.nome && (
                        <span className="text-xs text-[var(--cor-resposta-correta)] mt-1">✓ Ok</span>
                      )}
                    </Campo>

                    {/* Linha: Data, CPF, Parentesco */}
                    <div className="grid md:grid-cols-3 gap-6 mt-4">

                      <Campo label="Data de nascimento" erro={erros[index]?.dataNascimento}>
                        <IMaskInput
                          mask="00/00/0000"
                          name="dataNascimento"
                          value={familiar.dataNascimento}
                          onAccept={(value) => {
                            handleChange(index, {
                              target: { name: "dataNascimento", value },
                            });
                          }}
                          onBlur={() => handleBlur(index, "dataNascimento")}
                          placeholder="DD/MM/YYYY"
                          className={`input-padrao ${erros[index]?.dataNascimento && tocados[index]?.dataNascimento ? "border-[var(--cor-resposta-errada)] focus:ring-[var(--cor-resposta-errada)]" : ""}`}
                          aria-label="Data de nascimento"
                          aria-describedby={erros[index]?.dataNascimento && tocados[index]?.dataNascimento ? `erro-data-${index}` : undefined}
                          required
                        />
                        {erros[index]?.dataNascimento && tocados[index]?.dataNascimento && (
                          <span id={`erro-data-${index}`} className="text-xs text-[var(--cor-resposta-errada)] mt-1">
                            {erros[index].dataNascimento}
                          </span>
                        )}
                        {familiar.dataNascimento && !erros[index]?.dataNascimento && tocados[index]?.dataNascimento && (
                          <span className="text-xs text-[var(--cor-resposta-correta)] mt-1">✓ Ok</span>
                        )}
                      </Campo>

                      <Campo label="CPF" erro={erros[index]?.cpf}>
                        <IMaskInput
                          mask="000.000.000-00"
                          name="cpf"
                          value={familiar.cpf}
                          onAccept={(value) => {
                            handleChange(index, {
                              target: { name: "cpf", value },
                            });
                          }}
                          onBlur={() => handleBlur(index, "cpf")}
                          placeholder="000.000.000-00"
                          className={`input-padrao ${erros[index]?.cpf && tocados[index]?.cpf ? "border-[var(--cor-resposta-errada)] focus:ring-[var(--cor-resposta-errada)]" : ""}`}
                          aria-label="CPF"
                          aria-describedby={erros[index]?.cpf && tocados[index]?.cpf ? `erro-cpf-${index}` : undefined}
                          required
                        />
                        {erros[index]?.cpf && tocados[index]?.cpf && (
                          <span id={`erro-cpf-${index}`} className="text-xs text-[var(--cor-resposta-errada)] mt-1">
                            {erros[index].cpf}
                          </span>
                        )}
                        {familiar.cpf && !erros[index]?.cpf && tocados[index]?.cpf && (
                          <span className="text-xs text-[var(--cor-resposta-correta)] mt-1">✓ Ok</span>
                        )}
                      </Campo>

                      <Campo label="Parentesco" erro={erros[index]?.parentesco}>
                        <input
                          name="parentesco"
                          value={familiar.parentesco}
                          onChange={(e) => handleChange(index, e)}
                          onBlur={() => handleBlur(index, "parentesco")}
                          placeholder="Ex: Filho, Cônjuge"
                          maxLength={50}
                          className={`input-padrao ${erros[index]?.parentesco && tocados[index]?.parentesco ? "border-[var(--cor-resposta-errada)] focus:ring-[var(--cor-resposta-errada)]" : ""}`}
                          aria-label="Parentesco"
                          aria-describedby={erros[index]?.parentesco && tocados[index]?.parentesco ? `erro-parentesco-${index}` : undefined}
                          required
                        />
                        {erros[index]?.parentesco && tocados[index]?.parentesco && (
                          <span id={`erro-parentesco-${index}`} className="text-xs text-[var(--cor-resposta-errada)] mt-1">
                            {erros[index].parentesco}
                          </span>
                        )}
                        {familiar.parentesco && !erros[index]?.parentesco && tocados[index]?.parentesco && (
                          <span className="text-xs text-[var(--cor-resposta-correta)] mt-1">✓ Ok</span>
                        )}
                      </Campo>

                    </div>

                    {/* Linha: Renda e Beneficiário */}
                    <div className="grid md:grid-cols-2 gap-6 mt-4">

                      <Campo label="Renda" erro={erros[index]?.renda}>
                        <input
                          type="text"
                          inputMode="decimal"
                          name="renda"
                          value={familiar.renda ? familiar.renda.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00'}
                          onChange={(e) => {
                            const valor = e.target.value.replace(/\D/g, '');
                            const numerico = (parseInt(valor || '0') / 100).toFixed(2);
                            handleChange(index, { ...e, target: { ...e.target, name: 'renda', value: numerico } });
                          }}
                          onBlur={() => handleBlur(index, "renda")}
                          placeholder="R$ 0,00"
                          className={`input-padrao ${erros[index]?.renda && tocados[index]?.renda ? "border-[var(--cor-resposta-errada)] focus:ring-[var(--cor-resposta-errada)]" : ""}`}
                          aria-label="Renda mensal"
                          aria-describedby={erros[index]?.renda && tocados[index]?.renda ? `erro-renda-${index}` : undefined}
                          required
                        />
                        {erros[index]?.renda && tocados[index]?.renda && (
                          <span id={`erro-renda-${index}`} className="text-xs text-[var(--cor-resposta-errada)] mt-1">
                            {erros[index].renda}
                          </span>
                        )}
                        {familiar.renda !== undefined && !erros[index]?.renda && tocados[index]?.renda && (
                          <span className="text-xs text-[var(--cor-resposta-correta)] mt-1">✓ Ok</span>
                        )}
                      </Campo>

                      {/* Beneficiário */}
                      <div className="mt-4">
                        <label className="text-sm font-medium block mb-2" id={`beneficiario-label-${index}`}>
                          É beneficiário?
                        </label>

                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={familiar.beneficiario}
                            aria-labelledby={`beneficiario-label-${index}`}
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
                              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--base-80)]
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

                    </div>

                    {/* Upload */}
                    <div className="mt-6">
                      <label className="block text-sm font-medium mb-2" id={`upload-label-${index}`}>
                        Arquivos <span className="text-[var(--cor-resposta-obrigatoria)]">*</span>
                      </label>

                      <div className={`flex justify-between items-center border rounded-lg px-4 py-3 ${
                        erros[index]?.documentos && tocados[index]?.documentos 
                          ? "border-[var(--cor-resposta-errada)] bg-red-50" 
                          : "border-[var(--base-20)] bg-[var(--primario-5)]"
                      }`}>
                        <span className="text-sm text-[var(--base-60)]">
                          Selecione ou arraste arquivos
                        </span>

                        <label className="cursor-pointer text-sm border px-3 py-1 rounded-md bg-[var(--base-0)] hover:bg-[var(--base-10)]">
                          Selecionar
                          <input
                            type="file"
                            multiple
                            name="documentos"
                            onChange={(e) => {
                              handleChange(index, e);
                              setTocados((prev) => ({
                                ...prev,
                                [index]: {
                                  ...prev[index] || {},
                                  documentos: true,
                                },
                              }));
                            }}
                            className="hidden"
                            aria-labelledby={`upload-label-${index}`}
                            required
                          />
                        </label>
                      </div>

                      {erros[index]?.documentos && tocados[index]?.documentos && (
                        <span className="text-xs text-[var(--cor-resposta-errada)] mt-1 block">
                          {erros[index].documentos}
                        </span>
                      )}

                      {familiar.documentos.length > 0 && (
                        <div className="mt-3 flex flex-col gap-2">
                          {familiar.documentos.map((file, i) => (
                            <div
                              key={i}
                              className="flex justify-between text-sm bg-[var(--base-5)] px-3 py-2 rounded border border-[var(--base-20)] items-center"
                            >
                              <span className="truncate flex-1">{file.name}</span>
                              <button
                                type="button"
                                onClick={() => removerArquivo(index, i)}
                                className="text-[var(--cor-resposta-errada)] hover:font-semibold ml-2 flex-shrink-0"
                                aria-label={`Remover arquivo ${file.name}`}
                              >
                                ✕
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

                  <Botao tipo="submit" variante="confirmar">
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
function Campo({ label, children, erro }: any) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium">
        {label} {label.includes("*") ? "" : <span className="text-[var(--cor-resposta-obrigatoria)]">*</span>}
      </label>
      {children}
    </div>
  );
}

export default CadastroBeneficiario;