import { useLocation, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Botao from "../components/Botao";
import Toast from "../components/Toast";
import { useState } from "react";
import { Familiar } from "../types/Familiar";
import { atualizarTiposUsuario } from "../services/usuarioService";
import { useUsuario, type TipoUsuario } from "../context/UserContext";

function ConfirmarFamiliares() {
  const navigate = useNavigate();
  const location = useLocation();

  const familiares = (location.state?.familiares || []) as Familiar[];

  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);

  const dadosResponsavel = location.state?.dadosResponsavel;

  const { usuario, definirUsuario } = useUsuario();

  function voltar() {
    //retorna para a página anterior.
    navigate("/cadastro-beneficiario", {
      state: {
        dadosResponsavel
      }
    });
  }

  async function confirmarCadastro() {
    setCarregando(true);

    try {
      const tipo: TipoUsuario = "Responsável pelo beneficiário";

      if (!usuario?.id) return;

      const tiposAtuais = usuario.tipos || [];

      const novosTipos: TipoUsuario[] = tiposAtuais.includes(tipo)
        ? tiposAtuais
        : [...tiposAtuais, tipo];

      await atualizarTiposUsuario(usuario.id, novosTipos);

      definirUsuario({
        ...usuario,
        tipos: novosTipos,
      });

      setMensagem("Cadastro confirmado com sucesso!");
      setTimeout(() => navigate("/conta"), 1200);

    } catch (error) {
      console.error("Erro ao atualizar tipo:", error);
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
function Info({ label, valor }: { label: string; valor: string | number }) {
  return (
    <div className="flex flex-col">
      <span className="body-semibold-pequeno text-[var(--base-70)]">
        {label}
      </span>
      <span className="body-pequeno text-[var(--base-80)]">
        {valor !== undefined && valor !== null && valor !== "" ? String(valor) : "-"}
      </span>
    </div>
  );
}

export default ConfirmarFamiliares;