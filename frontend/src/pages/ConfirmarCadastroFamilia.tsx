import { useLocation, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Botao from "../components/Botao";
import Toast from "../components/Toast";
import { useEffect, useState } from "react";
import { criarFamiliar, obterPerfil } from "../services/usuarioService";
import { useUsuario } from "../context/UserContext";
import api from "../services/api";
import { Familiar } from "../types/Familiar";

function ConfirmarFamiliares() {
  const navigate = useNavigate();
  const location = useLocation();

  const familiares = (location.state?.familiares || []) as Familiar[];

  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);

  const { usuario } = useUsuario();
  const dadosResponsavel = location.state?.dadosResponsavel;
  const [responsavelId, setResponsavelId] = useState<string | null>(null);

  function voltar() {
    //retorna para a página anterior.
    navigate("/cadastro-beneficiario", {
      state: {
        dadosResponsavel
      }
    });
  }

  useEffect(() => {
    async function carregarPerfil() {
      try {
        const perfil = await obterPerfil();
        setResponsavelId(perfil.perfil_responsavel?.id);
      } catch (e) {
        console.error(e);
        setMensagem("Erro ao carregar perfil.");
      }
    }

    carregarPerfil();
  }, []);

  function formatarData(data: string) {
    const [dia, mes, ano] = data.split("/");
    return `${ano}-${mes}-${dia}`;
  }

  async function confirmarCadastro() {
    setCarregando(true);

    try {
      if (!usuario) {
        throw new Error("Usuário não logado");
      }

      const perfil = await obterPerfil();
      const responsavelId = perfil.perfil_responsavel?.id;

      if (!responsavelId) {
        throw new Error("Usuário não é responsável");
      }

      const familiaresFormatados = familiares.map((f: Familiar) => ({
        nome: f.nome,
        cpf: f.cpf.replace(/\D/g, ""),
        parentesco: f.parentesco,
        data_nascimento: formatarData(f.dataNascimento),
        renda: Number(f.renda),
        documentos: f.documentos,
        beneficiario: f.beneficiario
      }));

      const response = await criarFamiliar(responsavelId, familiaresFormatados);

      // upload documentos
      for (let i = 0; i < response.length; i++) {
        const familiarCriado = response[i];
        const arquivos = familiares[i].documentos;

        for (const file of arquivos) {
          const formData = new FormData();
          formData.append("tipo_documento", "OUTRO");
          formData.append("file", file);

          await api.post(
            `/usuario/familia/${familiarCriado.id}/documentacao`,
            formData
          );
        }
      }

      setMensagem("Cadastro confirmado com sucesso!");
      setTimeout(() => navigate("/conta"), 2000);

    } catch (error) {
      console.error(error);
      setMensagem("Erro ao confirmar cadastro.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--base-5)]">
      <Header />

      <main className="flex-1 pt-24 pb-10">
        <div className="w-full px-6 md:px-20 flex flex-col gap-10">

          <Toast mensagem={mensagem} tipo="sucesso" />

          {/* título */}
          <div className="text-center">
            <h1 className="header-medio text-[var(--base-80)]">
              Confirmar Cadastro
            </h1>
            <p className="body-pequeno text-[var(--base-70)] mt-2">
              Revise as informações antes de confirmar
            </p>
          </div>

          {/* lista de familiares */}
          <div className="flex flex-col gap-6 items-center">

            {familiares.map((familiar: Familiar, index: number) => (
              <div
                key={index}
                className="w-full max-w-4xl bg-[var(--primario-5)] border border-[var(--base-20)] rounded-lg p-6"
              >

                <h2 className="body-semibold-medio text-[var(--base-80)] mb-4">
                  Familiar {index + 1}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <Info label="Nome" valor={familiar.nome} />
                  <Info label="Data de nascimento" valor={familiar.dataNascimento} />
                  <Info label="CPF" valor={familiar.cpf} />
                  <Info label="Parentesco" valor={familiar.parentesco} />
                  <Info label="Renda" valor={familiar.renda} />
                  <Info label="Beneficiário" valor={familiar.beneficiario ? "Sim" : "Não"} />

                  <div className="col-span-1 md:col-span-2">
                    <p className="body-semibold-pequeno text-[var(--base-70)]">
                      Documento
                    </p>
                    <p className="body-pequeno text-[var(--base-80)]">
                      {familiar.documentos?.length > 0
                        ? familiar.documentos.map((doc: File) => doc.name).join(", ")
                        : "Nenhum arquivo enviado"}
                    </p>
                  </div>

                </div>
              </div>
            ))}

          </div>

          {/* pergunta */}
          <div className="flex justify-center mt-6">
            <div className="w-full max-w-4xl bg-[var(--base-0)] border border-[var(--base-20)] rounded-xl p-6 shadow-sm flex flex-col gap-6">

                {/* Pergunta */}
                <div className="text-center">
                <p className="body-medio text-[var(--base-80)]">
                    Deseja confirmar o cadastro desses familiares?
                </p>
                </div>  

                {/* Botões */}
                <div className="flex gap-3 justify-center items-center">

                <Botao
                    tipo="button"
                    variante="cancelar"
                    aoClicar={voltar}
                    desabilitado={carregando}
                    className="w-fit px-5 py-2"
                >
                    Cancelar
                </Botao>

                <Botao
                    tipo="button"
                    variante="confirmar"
                    aoClicar={confirmarCadastro}
                    desabilitado={carregando}
                    className="w-fit px-5 py-2"
                >
                    {carregando ? "Confirmando..." : "Confirmar cadastro"}
                </Botao>

                </div>

            </div>
            </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}

/* 🔹 componente auxiliar */
function Info({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="flex flex-col">
      <span className="body-semibold-pequeno text-[var(--base-70)]">
        {label}
      </span>
      <span className="body-pequeno text-[var(--base-80)]">
        {valor || "-"}
      </span>
    </div>
  );
}

export default ConfirmarFamiliares;