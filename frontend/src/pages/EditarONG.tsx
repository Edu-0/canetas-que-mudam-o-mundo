import { useNavigate } from "react-router-dom";
import { useUsuario } from "../context/UserContext";
import { useState, useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import logo from "../assets/logo.svg";
import Toast from "../components/Toast";
import FormCadastroONG from "../components/FormCadastroONG";
import { useAvisoAlteracoesNaoSalvas } from "../hooks/useAvisoAlteracoesNaoSalvas";
import ModalConfirmacao from "../components/ModalConfirmacao";
import { atualizarONG, obterONG } from "../services/usuarioService";
import { useONG } from "../context/OngContext";
import Botao from "../components/Botao";
import { excluirONG } from "../services/usuarioService";

function EditarONG() {
  const { usuario, definirUsuario } = useUsuario();
  const {ong, definirONG} = useONG();
  console.log("EditarONG.render", { usuarioId: usuario?.id, ongId: ong?.id });
  const navigate = useNavigate();
  const [mensagem, setMensagem] = useState("");
  
  const {alterou, setAlterou, tentarSair, mostrarModal, setMostrarModal, } = useAvisoAlteracoesNaoSalvas({
    mensagem: "Você tem alterações não salvas. Deseja sair mesmo?",});

  const [tipoMensagem, setTipoMensagem] = useState<"sucesso" | "erro">("sucesso");

  const [erroModal, setErroModal] = useState<{
    campo?: string;
    mensagem: string;
  } | null>(null);

  const [mostrarModalExcluir, setMostrarModalExcluir] = useState(false);
  const [carregandoExclusao, setCarregandoExclusao] = useState(false);

  function arraysIguais(a: number[], b: number[]) {
    if (a.length !== b.length) return false;

    const aOrdenado = [...a].sort();
    const bOrdenado = [...b].sort();

    return aOrdenado.every((v, i) => v === bOrdenado[i]);
  }

  async function handleExcluirONG() {
    if (!ong?.id) return;

    try {
      setCarregandoExclusao(true);

      await excluirONG(ong.id);

      definirONG(null); // limpa ONG do contexto

      setMensagem("ONG excluída com sucesso!");
      setTipoMensagem("sucesso");

      setAlterou(false); // reseta aviso de alterações não salvas, já que a ONG foi excluída

      definirONG(null);

      // limpa os tokens e dados do usuário, deslogando-o
      localStorage.removeItem("access_token");
      localStorage.removeItem("token_type");
      localStorage.removeItem("usuario");

      definirUsuario(null); // desloga o coordenador, já que a ONG foi excluída
      navigate("/logar");

    } catch (error: any) {
      console.error("Erro ao excluir ONG", error);

      const erroBackend = error.response?.data?.detail;

      setErroModal({
        mensagem: erroBackend || "Erro ao excluir ONG.",
      });

    } finally {
      setCarregandoExclusao(false);
      setMostrarModalExcluir(false);
    }
  }

  useEffect(() => {
    async function carregarONG() {
      if (!usuario || ong) return; // se não tiver usuário ou se a ONG já estiver carregada, não precisa buscar

      try {
        const dados = await obterONG();
        definirONG(dados);

      } catch (error) {
        console.error("Erro ao carregar ONG", error);
      }
    }

    carregarONG();
  }, [usuario, ong]);

  function normalizarONG(u: any) {
    return {
      id: u.id,
      nome: (u.nome || "").trim(),
      cnpj: (u.cnpj || "").replace(/\D/g, ""),
      cep: (u.cep || "").replace(/\D/g, ""),
      rua: (u.rua || "").trim(),
      bairro: (u.bairro || "").trim(),
      cidade: (u.cidade || "").trim(),
      estado: (u.estado || "").trim(),
      numero: (u.numero || "").trim(),
      complemento: (u.complemento || "").trim(),
      telefone: (u.telefone || "").replace(/\D/g, ""),
      email: (u.email || "").trim(),
      diasFuncionamento: u.diasFuncionamento || [],
      horarioInicio: (u.horarioInicio || "").trim(),
      horarioFim: (u.horarioFim || "").trim(),
      sobre: (u.sobre || "").trim(),
      instagram: (u.instagram || "").trim(),
      facebook: (u.facebook || "").trim(),
      site: (u.site || "").trim(),
    };
  }


  if (!usuario) {
    return <p>Nenhum usuário</p>;
  }

  if (!ong) {
    return (
      <div className="min-h-screen flex flex-col overflow-x-hidden bg-[var(--base-5)]">
      
        {/* header */}
        <Header />

        {/* body */}
        <main className="flex-1 pt-24 pb-10">
          <div className="w-full px-6 md:px-20 flex flex-col gap-10">

            {/* título e logo da caneta */}
            <div className="flex items-center justify-center gap-4 flex-wrap text-center">
              <img src={logo} alt="Logo Canetas que Mudam o Mundo" className="h-16 md:h-20" />
          
              <h1 className="header-medio text-center">
                Canetas que Mudam o Mundo
              </h1>
            </div>

            <div className="flex flex-col items-center px-4">

              {/* título do formulário */}
              <div className="w-full max-w-4xl bg-[var(--primario-5)] shadow-[2px_10px_40px_rgba(0,0,0,0.1)] rounded-lg p-6">

                <h2 className="header-pequeno text-center mb-6">
                  EDITAR ONG
                </h2>

                <div>
                  <h2 className="body-pequeno text-center mb-6">Não tem nenhuma ONG cadastrada</h2>
                  <Botao variante="cancelar" aria-label="Voltar para a tela da conta" aoClicar={() => navigate("/conta")}>
                    Voltar para a tela da conta
                  </Botao>
                </div>
              </div>
            </div>
          </div>
        </main>
        {/* footer */}
        <Footer />
      </div>  
    );
  }

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden bg-[var(--base-5)]">
      
      {/* header */}
      <Header />

      {/* body */}
      <main className="flex-1 pt-24 pb-10">
        <div className="w-full px-6 md:px-20 flex flex-col gap-10">
          <Toast mensagem={mensagem} tipo={tipoMensagem} />

          {/* título e logo da caneta */}
          <div className="flex items-center justify-center gap-4 flex-wrap text-center">
            <img src={logo} alt="Logo Canetas que Mudam o Mundo" className="h-16 md:h-20" />
        
            <h1 className="header-medio text-center">
              Canetas que Mudam o Mundo
            </h1>
          </div>

          <div className="flex flex-col items-center px-4">

            {/* título do formulário */}
            <div className="w-full max-w-4xl bg-[var(--primario-5)] shadow-[2px_10px_40px_rgba(0,0,0,0.1)] rounded-lg p-6">

              <h2 className="header-pequeno text-center mb-6">
                EDITAR ONG
              </h2>

              <FormCadastroONG
                modo="edicao"

                valoresIniciais={{
                  id: ong.id,
                  nome: ong.nome || "",
                  cnpj: ong.cnpj || "",
                  cep: ong.cep || "",
                  rua: ong.rua || "",
                  bairro: ong.bairro || "",
                  cidade: ong.cidade || "",
                  estado: ong.estado || "",
                  numero: ong.numero || "",
                  complemento: ong.complemento || "",
                  telefone: ong.telefone || "",
                  email: ong.email || "",
                  diasFuncionamento: ong.diasFuncionamento || [],
                  horarioInicio: ong.horarioInicio || "",
                  horarioFim: ong.horarioFim || "",
                  sobre: ong.sobre || "",
                  instagram: ong.instagram || "",
                  facebook: ong.facebook || "",
                  site: ong.site || "",
                }}

                mudouDados={(dados) => {
                  const atual = normalizarONG(ong);
                  const novo = normalizarONG(dados);

                  const mudou =
                    atual.nome !== novo.nome ||
                    atual.cnpj !== novo.cnpj ||
                    atual.cep !== novo.cep ||
                    atual.rua !== novo.rua ||
                    atual.bairro !== novo.bairro ||
                    atual.cidade !== novo.cidade ||
                    atual.estado !== novo.estado ||
                    atual.numero !== novo.numero ||
                    atual.complemento !== novo.complemento ||
                    atual.telefone !== novo.telefone ||
                    atual.email !== novo.email ||
                    !arraysIguais(atual.diasFuncionamento, novo.diasFuncionamento) ||
                    atual.horarioInicio !== novo.horarioInicio ||
                    atual.horarioFim !== novo.horarioFim ||
                    atual.sobre !== novo.sobre ||
                    atual.instagram !== novo.instagram ||
                    atual.facebook !== novo.facebook ||
                    atual.site !== novo.site;

                  setAlterou(mudou);
                }}

                textoBotaoCancelar="Cancelar edição"
                textoBotaoEnviar="Salvar alterações"
                mostrarCancelar={true}

                aoErro={(erro) => {
                  setErroModal(erro);
                }}

                aoCancelar={() => {
                  const podeSair = tentarSair("/conta");
                  if (podeSair) {
                    navigate("/conta");
                  }
                }}

                aoEnviar={async (dadosAtualizados) => {
                  try {
                    console.log("EditarONG.aoEnviar recebido", dadosAtualizados);

                    const ongAtualizada = await atualizarONG(dadosAtualizados);

                    console.log("EditarONG.aoEnviar atualizada", ongAtualizada);
                    
                    definirONG(ongAtualizada);

                    setAlterou(false);
                    setMensagem("Alterações salvas com sucesso!");
                    setTipoMensagem("sucesso");

                    setTimeout(() => {
                      setMensagem("");
                      navigate("/conta");
                    }, 2000);

                  } catch (error: any) {
                    const erroBackend = error.response?.data?.detail;

                    if (erroBackend) {
                      setErroModal({ mensagem: erroBackend });
                    } else {
                      setErroModal({ mensagem: "Erro ao atualizar ONG." });
                    }
                  }
                }}

              />

              <ModalConfirmacao
                aberto={mostrarModal}
                titulo="Alterações não salvas"
                descricao="Você tem alterações não salvas. Deseja sair mesmo?"
                botaoCancelar="Continuar editando"
                botaoConfirmar="Sair sem salvar"    
                varianteCancelar="confirmar"
                varianteConfirmar="cancelar"
                onCancelar={() => setMostrarModal(false)}
                onConfirmar={() => {
                  setMostrarModal(false);

                  const rota = sessionStorage.getItem("rotaDestino");
                  sessionStorage.removeItem("rotaDestino");

                  navigate(rota || "/conta");
                }}
              />

              {/* linha separadora */}
              <div className="mt-12 border-t border-[var(--base-40)] my-2" />

              <div>
                <p className="mt-8 body-semibold-pequeno text-center">Gostaria de excluir a ONG?</p>
              </div>
              <div className="flex align-center mt-4 w-48 mx-auto">
                <Botao variante="cancelar"  aria-label="Botão para excluir ONG"  aoClicar={() => setMostrarModalExcluir(true)}>
                  Excluir ONG
                </Botao>
              </div>

              <ModalConfirmacao
                aberto={!!erroModal}
                titulo="Erro na edição"
                descricao={erroModal?.mensagem || ""}
                botaoConfirmar="Fechar"
                onCancelar={() => setErroModal(null)}
                onConfirmar={() => setErroModal(null)}
              />
              <ModalConfirmacao
                aberto={mostrarModalExcluir}
                titulo="Excluir ONG"
                descricao={`Tem certeza que deseja excluir a ONG "${ong.nome}"? Essa ação não pode ser desfeita e os usuários associados a ONG serão excluídos também. Isso inclui a sua conta de coordenador, já que uma conta só pode estar associada a uma ONG. Se você deseja apenas sair da ONG, exclua a conta de coordenador.`}
                botaoCancelar="Cancelar"
                botaoConfirmar={carregandoExclusao ? "Excluindo..." : "Excluir"}
                varianteCancelar="confirmar"
                varianteConfirmar="cancelar"
                onCancelar={() => setMostrarModalExcluir(false)}
                onConfirmar={handleExcluirONG}
              />

            </div>
          </div>
        </div>
      </main>

      {/* footer */}
      <Footer />
    </div>
  );
}
export default EditarONG;