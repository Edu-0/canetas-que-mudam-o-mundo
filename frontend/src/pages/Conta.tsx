import { useNavigate } from "react-router-dom";
import { useUsuario } from "../context/UserContext";
import { useEffect, useState } from "react";
import { obterPerfil } from "../services/usuarioService";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Botao from "../components/Botao";
import logo from "../assets/logo.svg";
import ModalConfirmacao from "../components/ModalConfirmacao";

function Conta() {
  const { usuario, definirUsuario } = useUsuario();
  const [mostrarModal, setMostrarModal] = useState(false);
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState<any>(null);
  const [carregandoPerfil, setCarregandoPerfil] = useState(true);

  const dados = perfil || usuario;

  function sair() {
    definirUsuario(null);
    navigate("/");
  }

  const dataNascimentoRaw = dados?.dataNascimento || dados?.data_nascimento;

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

  const dataCadastroRaw = dados?.dataCadastro || dados?.data_cadastro;

  const dataCadastroFormatada = dataCadastroRaw
    ? new Date(dataCadastroRaw).toLocaleDateString("pt-BR")
    : "Data de cadastro não informada";

  useEffect(() => {
    if (!usuario || !usuario.id) {
      setCarregandoPerfil(false);
      return;
    }

    async function carregarPerfil() {
      try {
        const dados = await obterPerfil(usuario!.id); // o ! é para dizer que tenho certeza que usuario existe nesse ponto, porque já verifiquei no if acima. Assim evito erro de tipo do TS.
        setPerfil(dados);

      } catch (error) {
        console.error("Erro ao carregar perfil:", error);

      } finally {
        setCarregandoPerfil(false);
      }
    }

    carregarPerfil();
  }, [usuario?.id]);

  if (carregandoPerfil) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-lg">
          Carregando perfil...
        </div>
      </div>
    );
  }

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
                {dados ? (
                  <>
                    <p>
                      <span className="body-semibold-pequeno">Nome:</span>{" "}
                      <span className="body-pequeno">{dados?.nome || dados?.nome_completo || "Nome não informado"}</span>
                    </p>

                    <p>
                      <span className="body-semibold-pequeno">Data de nascimento:</span>{" "}
                      <span className="body-pequeno">{dataNascimentoFormatada}</span>
                    </p>

                    <p>
                      <span className="body-semibold-pequeno">CPF:</span>{" "}
                      <span className="body-pequeno">{dados?.cpf || "CPF não informado"}</span>
                    </p>

                    <p>
                      <span className="body-semibold-pequeno">CEP:</span>{" "}
                      <span className="body-pequeno">{dados?.cep || "CEP não informado"}</span>
                    </p>

                    <p>
                      <span className="body-semibold-pequeno">Telefone:</span>{" "}
                      <span className="body-pequeno">{dados?.telefone || "Telefone não informado"}</span>
                    </p>

                    <p>
                      <span className="body-semibold-pequeno">Email:</span>{" "}
                      <span className="body-pequeno">{dados?.email || "Email não informado"}</span>
                    </p>

                    <p>
                      <span className="body-semibold-pequeno">Senha:</span>{" "}
                      <span className="body-pequeno">••••••••</span>
                    </p>

                    <p>
                      <span className="body-semibold-pequeno">Data de cadastro:</span>{" "}
                      <span className="body-pequeno">{dataCadastroFormatada}</span>
                    </p>

                    {(dados?.tipo || dados?.funcao) && (
                      <p>
                        <span className="body-semibold-pequeno">Tipo de conta:</span>{" "}
                        <span className="body-pequeno">{dados.tipo || dados.funcao}</span>
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
                Escolha seu tipo de conta
              </h3>

              {/* botões para os tipos de cadastros */}
              <div className="flex flex-col md:flex-row gap-4 w-full">
                <div className="flex-1">
                  <Botao aoClicar={() => navigate("/cadastro/doador")} variante="confirmar">Doador</Botao>
                </div>

                <div className="flex-1">
                  <Botao aoClicar={() => navigate("/cadastro/voluntario")} variante="confirmar">Voluntário</Botao>
                </div>

                <div className="flex-1">
                  <Botao aoClicar={() => navigate("/cadastro/responsavel")} variante="confirmar">Responsável</Botao>
                </div>
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