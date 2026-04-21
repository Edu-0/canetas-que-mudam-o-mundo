import { useNavigate } from "react-router-dom";
import { useUsuario, TipoUsuario, Usuario, mapearTipo } from "../context/UserContext";
import { useEffect, useState } from "react";
import { obterPerfil, DadosUsuario, atualizarTiposUsuario } from "../services/usuarioService";
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
    if (!tipoSelecionado || !dadosNormalizados?.id) return;

    const tiposAtuais = dadosNormalizados.tipos || [];
    const jaTemTipo = tiposAtuais.includes(tipoSelecionado as TipoUsuario);

    let novosTipos: TipoUsuario[] = [];

    if (jaTemTipo) {
      // remove o tipo
      novosTipos = tiposAtuais.filter(t => t !== tipoSelecionado);

    } else {
      // adiciona o tipo
      novosTipos = [...tiposAtuais, tipoSelecionado as TipoUsuario];
    }

    // garante Genérico sempre
    if (!novosTipos.includes("Genérico")) {
      novosTipos.push("Genérico");
    }

    // evitar duplicados 
    novosTipos = [...new Set(novosTipos)];

    // tratamento especial antes de salvar
    const tiposComConfirmacao = ["Voluntário da triagem", "Responsável pelo beneficiário"];

    if (!jaTemTipo && tiposComConfirmacao.includes(tipoSelecionado)) {
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

    try {
      await atualizarTiposUsuario(dadosNormalizados.id, novosTipos);

      const atualizado = await obterPerfil();
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

  function formatarData(data?: string) {
    if (!data) return null;

    const d = new Date(data);

    return d.toLocaleDateString("pt-BR");
  }

  function formatarDataHora(data?: string) {
    if (!data) return null;

    const d = new Date(data);

    const dataFormatada = d.toLocaleDateString("pt-BR");
    const horaFormatada = d.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return `${dataFormatada} às ${horaFormatada} horas`;
  }

  useEffect(() => { // carrega o perfil do usuário logado para pegar as informações atualizadas do backend
    if (!usuario) return;

    const { id } = usuario; // id para pegar os dados atualizados do usuário

    async function carregarPerfil() {
      try {
        
      const atualizado = await obterPerfil(); // pega os dados atualizados do backend
      console.log("Perfil atualizado carregado:", atualizado);
      setPerfil(atualizado);

      } catch (error) {
        console.error("Erro ao carregar perfil:", error);
      }
    }

    carregarPerfil();

  }, [usuario]);

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden bg-[var(--base-5)]">

      <Header />

      <main className="flex-1 pt-24 pb-10 flex flex-col items-center gap-6">
        <div className="w-full px-6 md:px-20 flex flex-col gap-10">

          {/* título e logo da caneta */}
          <div className="flex items-center justify-center gap-4 flex-wrap text-center">
            <img src={logo} alt="Logo Canetas que Mudam o Mundo" className="h-16 md:h-20" />
        
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
              <dl className="flex flex-col gap-4 mb-6" aria-label="Informações da conta do usuário">
                {dadosNormalizados ? (
                  <>
                    <div className="flex flex-col sm:flex-row sm:items-start sm:gap-2">
                      <dt className="body-semibold-pequeno whitespace-nowrap">Nome:</dt>
                      <dd className="body-pequeno break-words">{dadosNormalizados?.nome_completo || "Nome não informado"}</dd>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-start sm:gap-2">
                      <dt className="body-semibold-pequeno whitespace-nowrap">Data de nascimento:</dt>
                      <dd className="body-pequeno">{formatarData(dadosNormalizados?.data_nascimento) || "Data de nascimento não informada"}</dd>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-start sm:gap-2">
                      <dt className="body-semibold-pequeno whitespace-nowrap flex-col sm:flex-row sm:items-center sm:gap-2">CPF:</dt>
                      <dd className="body-pequeno">{formatarCPF(dadosNormalizados?.cpf)}</dd>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-start sm:gap-2">
                      <dt className="body-semibold-pequeno whitespace-nowrap flex-col sm:flex-row sm:items-center sm:gap-2">CEP:</dt>
                      <dd className="body-pequeno">{formatarCEP(dadosNormalizados?.cep)}</dd>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-start sm:gap-2">
                      <dt className="body-semibold-pequeno whitespace-nowrap flex-col sm:flex-row sm:items-center sm:gap-2">Telefone:</dt>
                      <dd className="body-pequeno">{formatarTelefone(dadosNormalizados?.telefone)}</dd>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-start sm:gap-2">
                      <dt className="body-semibold-pequeno whitespace-nowrap flex-col sm:flex-row sm:items-center sm:gap-2">Email:</dt>
                      <dd className="body-pequeno">{dadosNormalizados?.email || "Email não informado"}</dd>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-start sm:gap-2">
                      <dt className="body-semibold-pequeno whitespace-nowrap flex-col sm:flex-row sm:items-center sm:gap-2">Senha:</dt>
                      <dd className="body-pequeno">••••••••</dd>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-start sm:gap-2">
                      <dt className="body-semibold-pequeno whitespace-nowrap flex-col sm:flex-row sm:items-center sm:gap-2">Data de cadastro:</dt>
                      <dd className="body-pequeno break-words">{formatarDataHora(dadosNormalizados?.data_cadastro) || "Data de cadastro não informada"}</dd>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-start sm:gap-2">
                      <dt className="body-semibold-pequeno whitespace-nowrap flex-col sm:flex-row sm:items-center sm:gap-2">Data de edição da conta:</dt>
                      <dd className="body-pequeno break-words">{formatarDataHora(dadosNormalizados?.data_edicao_conta) || "A conta nunca foi editada"}</dd>
                    </div>

                    {dadosNormalizados?.tipos && dadosNormalizados.tipos.length > 0 && (
                      <>
                        <div className="flex flex-col sm:flex-row sm:items-start sm:gap-2">
                          <dt className="body-semibold-pequeno whitespace-nowrap">Tipo de conta:</dt>
                          <dd className="body-pequeno break-words">{dadosNormalizados.tipos.join(", ")}</dd>
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <p className="body-semibold-pequeno">
                    Nenhum usuário logado
                  </p>
                )}
              </dl>

              {/* Editar, Excluir e Sair */}
              {usuario && (
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <Botao variante="editar" aria-label="Botão para editar conta" aoClicar={() => navigate("/conta/editar")}>Editar conta</Botao>
                  </div>

                  <div className="flex-1">
                    <Botao variante="cancelar" aria-label="Botão para excluir conta" aoClicar={() => setMostrarModal(true)}>Excluir conta</Botao>
                  </div>
  
                  <div className="flex-1">
                    <Botao variante="sair" aria-label="Botão para sair da conta" aoClicar={sair}>Sair</Botao>
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
                Adicione o seu tipo de usuário
              </h3>

              <p className="body-pequeno text-center mb-6">
                Com o/s tipo/s de usuário/s escolhidos, você poderá acessar as funcionalidades específicas de cada tipo de usuário!
              </p>

              {/* botões para os tipos de cadastros */}
              <div className="flex flex-col md:flex-row gap-4 w-full h-auto">
                <div className="flex-1">
                  <Botao aoClicar={() => selecionarTipo("Doador")} variante={estaComoDoador ? "tipo-selecionado" : "confirmar"} aria-label="Botão para selecionar tipo de usuário Doador" className="h-full">Doador</Botao>
                </div>

                <div className="flex-1">
                  <Botao aoClicar={() => selecionarTipo("Voluntário da triagem")} variante={estaComoVoluntario ? "tipo-selecionado" : "confirmar"} aria-label="Botão para selecionar tipo de usuário Voluntário da triagem" className="h-full">Voluntário da triagem</Botao>
                </div>

                <div className="flex-1">
                  <Botao aoClicar={() => selecionarTipo("Responsável pelo beneficiário")} variante={estaComoResponsavel ? "tipo-selecionado" : "confirmar"} aria-label="Botão para selecionar tipo de usuário Responsável pelo beneficiário" className="h-full">Responsável pelo beneficiário</Botao>

                  {estaComoResponsavel && (
                    <div className="mt-5 flex justify-end">
                      <div className="w-auto text-sm px-1 py-0"> 
                        <Botao
                          aria-label="Botão para editar renda e familiares"
                          aoClicar={() => navigate("/conta/editar-renda-e-familiares")}
                          variante="editar"
                        >
                          Editar renda e familiares
                        </Botao>
                      </div>
                    </div>
                  )}
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