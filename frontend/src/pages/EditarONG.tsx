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

function EditarONG() {
  const { usuario, definirUsuario } = useUsuario();
  const {ong, definirONG} = useONG();
  const navigate = useNavigate();
  const [mensagem, setMensagem] = useState("");
  
  const {setAlterou, tentarSair, mostrarModal, setMostrarModal, } = useAvisoAlteracoesNaoSalvas({
    mensagem: "Você tem alterações não salvas. Deseja sair mesmo?",});

  const [tipoMensagem, setTipoMensagem] = useState<"sucesso" | "erro">("sucesso");

  const [erroModal, setErroModal] = useState<{
    campo?: string;
    mensagem: string;
  } | null>(null);

  function arraysIguais(a: number[], b: number[]) {
    if (a.length !== b.length) return false;

    const aOrdenado = [...a].sort();
    const bOrdenado = [...b].sort();

    return aOrdenado.every((v, i) => v === bOrdenado[i]);
  }

  useEffect(() => {
    async function carregarONG() {
      if (!usuario || ong) return; // se não tiver usuário ou se a ONG já estiver carregada, não precisa buscar

      try {
        const dados = await obterONG(usuario.id);
        definirONG(dados);

      } catch (error) {
        console.error("Erro ao carregar ONG", error);
      }
    }

    carregarONG();
  }, [usuario, ong]);

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
                  const mudou =
                    dados.nome.trim() !== (ong.nome || "") ||
                    dados.cnpj.replace(/\D/g, "") !== (ong.cnpj || "") ||
                    (dados.cep || "").replace(/\D/g, "") !== (ong.cep || "") ||
                    dados.rua.trim() !== (ong.rua || "") ||
                    dados.bairro.trim() !== (ong.bairro || "") ||
                    dados.cidade.trim() !== (ong.cidade || "") ||
                    dados.estado.trim() !== (ong.estado || "") ||
                    (dados.numero || "").trim() !== (ong.numero || "") ||
                    (dados.complemento || "").trim() !== (ong.complemento || "") ||
                    dados.telefone.replace(/\D/g, "") !== (ong.telefone || "") ||
                    dados.email.trim() !== (ong.email || "") ||
                    !arraysIguais(dados.diasFuncionamento, ong.diasFuncionamento || []) ||
                    dados.horarioInicio.trim() !== (ong.horarioInicio || "") ||
                    dados.horarioFim.trim() !== (ong.horarioFim || "") ||
                    dados.sobre.trim() !== (ong.sobre || "") ||
                    (dados.instagram || "").trim() !== (ong.instagram || "") ||
                    (dados.facebook || "").trim() !== (ong.facebook || "") ||
                    (dados.site || "").trim() !== (ong.site || "");

                  setAlterou(mudou);
                }}

                textoBotaoCancelar="Cancelar edição"
                textoBotaoEnviar="Salvar alterações"
                mostrarCancelar={true}

                aoErro={(erro) => {
                  setErroModal(erro);
                }}

                aoCancelar={() => tentarSair("/conta")}

                aoEnviar={async (usuarioAtualizado) => {
                  try {
                    await atualizarONG(usuario.id, usuarioAtualizado); // atualizar no backend

                    const ongAtualizada = await obterONG(usuario.id); // pegar dados atualizados do backend para garantir que esteja tudo certo
                    definirONG(ongAtualizada); // atualizar no contexto

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
                      setErroModal(erroBackend);
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

              <ModalConfirmacao
                aberto={!!erroModal}
                titulo="Erro na edição"
                descricao={erroModal?.mensagem || ""}
                botaoConfirmar="Fechar"
                onCancelar={() => setErroModal(null)}
                onConfirmar={() => setErroModal(null)}
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