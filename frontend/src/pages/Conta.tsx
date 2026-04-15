import { useNavigate } from "react-router-dom";
import { useUsuario, TipoUsuario, Usuario, mapearTipo } from "../context/UserContext";
import { useEffect, useState } from "react";
import { obterUsuario, DadosUsuario, atualizarTiposUsuario } from "../services/usuarioService";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Botao from "../components/Botao";
import logo from "../assets/logo.svg";
import ModalConfirmacao from "../components/ModalConfirmacao";
import {formatarCPF, formatarCEP, formatarTelefone} from "../utils/formatarMascaraConta";

function Conta() {
  const { usuario, definirUsuario } = useUsuario();
  const [mostrarModal, setMostrarModal] = useState(false);
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState<DadosUsuario | null>(null);

  const tiposValidos: TipoUsuario[] = ["Genérico", "Coordenador de Processos", "Responsável pelo beneficiário", "Doador", "Voluntário da triagem"];
  
  const [tipoSelecionado, setTipoSelecionado] = useState<string | null>(null);
  const [modalTipo, setModalTipo] = useState(false);

  function selecionarTipo(tipo: string) {
    setTipoSelecionado(tipo);
    setModalTipo(true);
  }

  async function confirmarTipo() {
    if (!tipoSelecionado || !dadosNormalizados) return;

    const tiposAtuais = dadosNormalizados.tipos || [];
    const jaTemTipo = tiposAtuais.includes(tipoSelecionado as TipoUsuario);

    if (jaTemTipo) {
      const novosTipos = tiposAtuais.filter(t => t !== tipoSelecionado);

      if (!novosTipos.includes("Genérico")) {
        novosTipos.push("Genérico");
      }

      try {
        await atualizarTiposUsuario(dadosNormalizados.id, novosTipos);

        const atualizado = await obterUsuario(dadosNormalizados.id);
        setPerfil(atualizado);
        definirUsuario(normalizarUsuario(atualizado));
      } catch (error) {
        console.error("Erro ao remover tipo:", error);
      }

      setModalTipo(false);
      setTipoSelecionado(null);
      return;
    }

    const tiposComConfirmacao = ["Voluntário da triagem", "Responsável pelo beneficiário"];

    if (tiposComConfirmacao.includes(tipoSelecionado)) {
      setModalTipo(false);

      if (tipoSelecionado === "Voluntário da triagem") {
        navigate("/conta/quiz-voluntario");
        return;
      }

      if (tipoSelecionado === "Responsável pelo beneficiário") {
        navigate("/conta/cadastro-beneficiario");
        return;
      }
    }

    let novosTipos = [...tiposAtuais, tipoSelecionado as TipoUsuario];

    if (!novosTipos.includes("Genérico")) {
      novosTipos.push("Genérico");
    }

    try {
      await atualizarTiposUsuario(dadosNormalizados.id, novosTipos);

      const atualizado = await obterUsuario(dadosNormalizados.id);
      setPerfil(atualizado);
      definirUsuario(normalizarUsuario(atualizado));

    } catch (error) {
      console.error("Erro ao atualizar tipos:", error);
    }

    setModalTipo(false);
    setTipoSelecionado(null);
  }

  function normalizarUsuario(dados: DadosUsuario | Usuario): Usuario {
    return {
      id: dados.id,
      nome_completo: dados.nome_completo,
      data_nascimento: dados.data_nascimento,
      cpf: dados.cpf,
      cep: dados.cep,
      telefone: dados.telefone,
      email: dados.email,
      data_cadastro: dados.data_cadastro || new Date().toISOString(),
      tipos: "funcao" in dados
        ? dados.funcao?.map(f => mapearTipo(f.tipo_usuario)) || [] // se tiver a propriedade "funcao", mapeio para os tipos, se não tiver, deixo como array vazio
        : ("tipos" in dados ? dados.tipos : []),
      data_edicao_conta: "data_edicao_conta" in dados ? dados.data_edicao_conta : undefined
    };
  }

  const dadosNormalizados = perfil
    ? normalizarUsuario(perfil)
    : usuario;

  
  const tiposAtuais = dadosNormalizados?.tipos || [];
  const jaTemTipo = tipoSelecionado
    ? tiposAtuais.includes(tipoSelecionado as TipoUsuario)
    : false;
  const estaComoDoador = dadosNormalizados?.tipos?.includes("Doador");
  const estaComoVoluntario = dadosNormalizados?.tipos?.includes("Voluntário da triagem");
  const estaComoResponsavel = dadosNormalizados?.tipos?.includes("Responsável pelo beneficiário");

  function sair() {
    definirUsuario(null);
    navigate("/");
  }

  const dataNascimentoRaw = dadosNormalizados?.data_nascimento;

  let dataNascimentoFormatada = "Data de nascimento não informada";

  if (dataNascimentoRaw) {
    try {
      const [ano, mes, dia] = dataNascimentoRaw.split("-");
      const data = new Date(Number(ano), Number(mes) - 1, Number(dia));
      dataNascimentoFormatada = data.toLocaleDateString("pt-BR");
    } catch {
      dataNascimentoFormatada = "Data de nascimento não informada";
    }
  }

  const dataCadastroRaw = dadosNormalizados?.data_cadastro;

  function formatarDataHora(valor?: string, fallback = "Data não informada") {
    if (!valor) return fallback;

    let data = new Date(valor);

    if (Number.isNaN(data.getTime())) {
      const possuiTimezone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(valor);

      if (!possuiTimezone) {
        data = new Date(valor + "Z");
      }
    }

    if (Number.isNaN(data.getTime())) return fallback;

    return new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(data).replace(",", " às") + " horas";
  }

  const dataCadastroFormatada = formatarDataHora(
    dataCadastroRaw,
    "Data de cadastro não informada"
  );

  const dataEdicaoContaRaw = dadosNormalizados?.data_edicao_conta;

  const dataEdicaoContaFormatada = formatarDataHora(
    dataEdicaoContaRaw,
    "A conta nunca foi editada"
  );

  useEffect(() => { // carrega o perfil do usuário logado para pegar as informações atualizadas do backend
    if (!usuario) return;

    const { id } = usuario; // id para pegar os dados atualizados do usuário

    async function carregarPerfil() {
      try {
        
      const atualizado = await obterUsuario(id); // pega os dados atualizados do backend
      setPerfil(atualizado);

      } catch (error) {
        console.error("Erro ao carregar perfil:", error);
      }
    }

    carregarPerfil();

  }, [usuario]);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--base-5)]">

      <Header />

      <main className="flex-1 pt-24 pb-10 flex flex-col items-center gap-6">
        <div className="w-full px-6 md:px-20 flex flex-col gap-10">

          {/* título e logo da caneta */}
          <div className="flex items-center justify-center gap-4 flex-wrap text-center">
            <img src={logo} alt="Logo" className="h-16 md:h-20" />
        
            <h1 className="header-medio text-center">
              Canetas que Mudam o Mundo
            </h1>
          </div>

          <div className="flex flex-col items-center px-4">

            <div className="w-full max-w-4xl bg-[var(--primario-5)] shadow-[2px_10px_40px_rgba(0,0,0,0.1)] rounded-lg p-6">
              <h2 className="header-pequeno text-center mb-6">
                CONTA
              </h2>

              {/* Informações da conta */}
              <div className="flex flex-col gap-2 mb-6">
                {dadosNormalizados ? (
                  <>
                    <p>
                      <span className="body-semibold-pequeno">Nome:</span>{" "}
                      <span className="body-pequeno">{dadosNormalizados?.nome_completo || "Nome não informado"}</span>
                    </p>

                    <p>
                      <span className="body-semibold-pequeno">Data de nascimento:</span>{" "}
                      <span className="body-pequeno">{dataNascimentoFormatada}</span>
                    </p>

                    <p>
                      <span className="body-semibold-pequeno">CPF:</span>{" "}
                      <span className="body-pequeno">{formatarCPF(dadosNormalizados?.cpf)}</span>
                    </p>

                    <p>
                      <span className="body-semibold-pequeno">CEP:</span>{" "}
                      <span className="body-pequeno">{formatarCEP(dadosNormalizados?.cep)}</span>
                    </p>

                    <p>
                      <span className="body-semibold-pequeno">Telefone:</span>{" "}
                      <span className="body-pequeno">{formatarTelefone(dadosNormalizados?.telefone)}</span>
                    </p>

                    <p>
                      <span className="body-semibold-pequeno">Email:</span>{" "}
                      <span className="body-pequeno">{dadosNormalizados?.email || "Email não informado"}</span>
                    </p>

                    <p>
                      <span className="body-semibold-pequeno">Senha:</span>{" "}
                      <span className="body-pequeno">••••••••</span>
                    </p>

                    <p>
                      <span className="body-semibold-pequeno">Data de cadastro:</span>{" "}
                      <span className="body-pequeno">{dataCadastroFormatada}</span>
                    </p>

                    <p>
                      <span className="body-semibold-pequeno">Data de edição da conta:</span>{" "}
                      <span className="body-pequeno">{dataEdicaoContaFormatada}</span>
                    </p>

                    {dadosNormalizados?.tipos && dadosNormalizados.tipos.length > 0 && (
                      <p>
                        <span className="body-semibold-pequeno">Tipo de conta:</span>{" "}
                        <span className="body-pequeno">{dadosNormalizados.tipos.join(", ")}</span> {/* a pessoa pode ter mais de uma função e quero pegar todas elas*/}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="body-semibold-pequeno">
                    Nenhum usuário logado
                  </p>
                )}
              </div>

              {/* Editar, Excluir e Sair */}
              {usuario && (
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <Botao variante="editar" aoClicar={() => navigate("/conta/editar")}>Editar conta</Botao>
                  </div>

                  <div className="flex-1">
                    <Botao variante="cancelar" aoClicar={() => setMostrarModal(true)}>Excluir conta</Botao>
                  </div>
  
                  <div className="flex-1">
                    <Botao variante="sair" aoClicar={sair}>Sair</Botao>
                  </div>

                  <ModalConfirmacao
                    aberto={mostrarModal}
                    titulo="Excluir conta"
                    descricao="Tem certeza que deseja excluir sua conta? Essa ação não pode ser desfeita."
                    botaoCancelar="Cancelar exclusão da conta"
                    botaoConfirmar="Excluir conta"
                    varianteCancelar="confirmar"
                    varianteConfirmar="cancelar"
                    onCancelar={() => setMostrarModal(false)}
                    onConfirmar={() => {
                      setMostrarModal(false);
                      // FUTURO: chamar API aqui para excluir conta do backend antes de deslogar
                      definirUsuario(null);
                      navigate("/");
                    }}
                  />
                </div>
              )}

              {/* linha separadora */}
              <div className="border-t border-[var(--primario-40)] my-6" />

              <h3 className="header-pequeno text-center mb-6">
                Adicione/altere o seu tipo de usuário
              </h3>

              <p className="body-pequeno text-center mb-6">
                Com o/s tipo/s de usuário/s escolhidos, você poderá acessar as funcionalidades específicas de cada tipo de usuário!
              </p>

              {/* botões para os tipos de cadastros */}
              <div className="flex flex-col md:flex-row gap-4 w-full">
                <div className="flex-1">
                  <Botao aoClicar={() => selecionarTipo("Doador")} variante={estaComoDoador ? "tipo-selecionado" : "confirmar"}>Doador</Botao>
                </div>

                <div className="flex-1">
                  <Botao aoClicar={() => selecionarTipo("Voluntário da triagem")} variante={estaComoVoluntario ? "tipo-selecionado" : "confirmar"}>Voluntário da triagem</Botao>
                </div>

                <div className="flex-1">
                  <Botao aoClicar={() => selecionarTipo("Responsável pelo beneficiário")} variante={estaComoResponsavel ? "tipo-selecionado" : "confirmar"}>Responsável pelo beneficiário</Botao>
                </div>

                <ModalConfirmacao
                  aberto={modalTipo}
                  titulo={jaTemTipo ? "Remover tipo de usuário" : "Adicionar tipo de usuário"}
                  descricao={
                    jaTemTipo
                      ? `Você tem certeza que deseja deixar de ser um usuário ${tipoSelecionado}?
                      
                        Você poderá adicionar este tipo novamente depois.`
                      : `Você tem certeza que deseja se tornar um usuário ${tipoSelecionado}?

                        Você poderá sair deste tipo depois.`
                  }
                  botaoCancelar="Cancelar"
                  botaoConfirmar={jaTemTipo ? "Remover" : "Confirmar"} 
                  
                  varianteCancelar={jaTemTipo ? "confirmar" : "cancelar"}  
                  varianteConfirmar={jaTemTipo ? "cancelar" : "confirmar"}

                  onCancelar={() => setModalTipo(false)}
                  onConfirmar={confirmarTipo}
                />
              </div>

            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}

export default Conta;