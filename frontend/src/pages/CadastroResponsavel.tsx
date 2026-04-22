import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Botao from "../components/Botao";
import Toast from "../components/Toast";
import logo from "../assets/logo.svg";
import { criarUsuarioResponsavel, obterPerfil } from "../services/usuarioService";
import { BeneficiosUsuario, TipoBeneficio, useUsuario } from "../context/UserContext";
import icon_check from "../assets/icon_check.png";
import api from "../services/api";

function CadastroResponsavel() {
  
  const navigate = useNavigate();
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);  
  const { usuario } = useUsuario();

  const [aceitouTermos, setAceitouTermos] = useState(false);

  const [formData, setFormData] = useState({
    renda: "",
    quantidadeMembros: "",
    bensFamiliares: "",
    auxilio: "NENHUM" as TipoBeneficio,
    documentos: null as File | null,
  });

  const [erros, setErros] = useState({
    renda: "",
    auxilio: "",
    quantidadeMembros: "",
    documentos: "",
  });

  const [tocados, setTocados] = useState({
    renda: false,
    auxilio: false,
    quantidadeMembros: false,
    documentos: false,
  });

  function validarCampo(nome: string, valor: string): string {
    switch (nome) {
      case "renda":
        return !valor || valor.trim() === "" ? "Renda bruta é obrigatória" : "";
      case "auxilio":
        return !valor ? "Selecione um benefício" : "";
      case "quantidadeMembros":
        return !valor || isNaN(Number(valor)) || Number(valor) <= 0 ? "Quantidade deve ser um número positivo" : "";
      default:
        return "";
    }
  }

  const opcoesBeneficio = Object.entries(BeneficiosUsuario).map(
    ([value, label]) => ({ value, label })
  );

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;

    if (e.target instanceof HTMLInputElement && e.target.type === "file") {
      const file = e.target.files?.[0] || null;

      setFormData((prev) => ({
        ...prev,
        [name]: file,
      }));

      setTocados((prev) => ({
        ...prev,
        documentos: true,
      }));

    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));

      if (tocados[name as keyof typeof tocados]) {
        setErros((prev) => ({
          ...prev,
          [name]: validarCampo(name, value),
        }));
      }
    }
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    const { name, value, type } = e.target;
    setTocados((prev) => ({
      ...prev,
      [name]: true,
    }));
    
    if (type !== "file") {
      setErros((prev) => ({
        ...prev,
        [name]: validarCampo(name, value),
      }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const erroDocumentos = !formData.documentos
        ? "Anexe os documentos"
        : "";

    const novosErros = {
        renda: validarCampo("renda", formData.renda),
        auxilio: validarCampo("auxilio", formData.auxilio),
        quantidadeMembros: validarCampo("quantidadeMembros", formData.quantidadeMembros),
        documentos: erroDocumentos,
    };

    setErros((prev) => ({ ...prev, ...novosErros }));

    if (Object.values(novosErros).some((erro) => erro !== "")) {
      setTocados({
        renda: true,
        auxilio: true,
        quantidadeMembros: true,
        documentos: true,
      });
      return;
    }

    if (!usuario) return;

    if (!aceitouTermos) {
      setMensagem("Você precisa aceitar os termos para continuar.");
      return;
    }

    setCarregando(true);

    try {
        await criarUsuarioResponsavel(usuario.id, {
            qtd_familiares: Number(formData.quantidadeMembros),
            renda: Number(formData.renda),
            auxilio: formData.auxilio,
            concordou_termos: aceitouTermos,
        });

        const perfilAtualizado = await obterPerfil();
        const responsavelId = perfilAtualizado.perfil_responsavel?.id;

        if (formData.documentos) {
          const form = new FormData();
          form.append("tipo_documento", "COMPROVANTE");
          form.append("file", formData.documentos);

          await api.post(`/usuario/${responsavelId}/documentacao`, form);
        }

        setMensagem("Cadastro do responsável realizado!");

        setTimeout(() => {
        navigate("/cadastro-beneficiario", { // próxima etapa
          state: {
            dadosResponsavel: formData
          }
        });
        }, 1500);

    } catch (error) {
        console.error(error);
        setMensagem("Erro ao cadastrar responsável.");
    } finally {
        setCarregando(false);
    }
    }

  function handleCancelar() {
    navigate(-1);
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--base-5)]">
      
      {/* header */}
      <Header />

      {/* body */}
      <main className="flex-1 pt-24 pb-10">
        <div className="w-full px-6 md:px-20 flex flex-col gap-10">
          <Toast mensagem={mensagem} tipo="sucesso" />

          {/* título e logo da caneta */}
          <div className="flex items-center justify-center gap-4 flex-wrap text-center">
            <img src={logo} alt="Logo Canetas que Mudam o Mundo" className="h-16 md:h-20" />
        
            <h1 className="header-medio text-center">
              Canetas que Mudam o Mundo
            </h1>
          </div>

          <div className="flex flex-col items-center px-4">

            {/* formulário */}
            <div className="w-full max-w-4xl bg-[var(--primario-5)] shadow-[2px_10px_40px_rgba(0,0,0,0.1)] rounded-lg p-6">

              <h2 className="header-pequeno text-center mb-6">
                CADASTRO DO RESPONSÁVEL PELO BENEFICIÁRIO
              </h2>

              <form onSubmit={handleSubmit} className="flex flex-col gap-6">

                {/* Renda Familiar */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="renda" 
                  className="text-sm font-semibold">
                    Qual é a sua renda bruta <span className="text-[var(--cor-resposta-obrigatoria)]">*</span>
                  </label>
                  <input
                    type="number"
                    id="renda"
                    name="renda"
                    placeholder="Digite aqui a sua renda bruta"
                    aria-invalid={!!erros.renda}
                    aria-describedby={erros.renda ? "erro-renda" : undefined}
                    value={formData.renda}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`
                      w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2
                      ${
                        tocados.renda && formData.renda
                          ? erros.renda
                            ? "border-[var(--cor-resposta-errada)] focus:ring-[var(--cor-resposta-errada)]"
                            : "border-[var(--cor-resposta-correta)] focus:ring-[var(--cor-resposta-correta)]"
                          : "border-gray-300 focus:ring-[var(--sucesso)]"
                      }
                    `}
                  />
                  {erros.renda && tocados.renda && (
                    <span id="erro-renda" className="text-[var(--cor-resposta-errada)] text-sm">
                      {erros.renda}
                    </span>
                  )}
                </div>

                {/* Benefício */}
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold">
                        Você recebe algum benefício?
                        <span className="text-[var(--cor-resposta-obrigatoria)]">*</span>
                    </label>

                    <select
                        name="auxilio"
                        value={formData.auxilio}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 border-gray-300 focus:ring-[var(--sucesso)]"
                    >
                        {Object.entries(BeneficiosUsuario).map(([key, label]) => (
                        <option key={key} value={key}>
                            {label}
                        </option>
                        ))}
                    </select>
                </div>

                {/* Quantidade de Membros */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="quantidadeMembros" className="text-sm font-semibold">
                    Quantidade de membros familiares <span className="text-[var(--cor-resposta-obrigatoria)]">*</span>
                  </label>
                  <input
                    type="number"
                    id="quantidadeMembros"
                    name="quantidadeMembros"
                    placeholder="Digite aqui a quantidade de membros familiares"
                    aria-invalid={!!erros.quantidadeMembros}
                    aria-describedby={erros.quantidadeMembros ? "erro-quantidade" : undefined}
                    value={formData.quantidadeMembros}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    min="1"
                    className={`
                      w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2
                      ${
                        tocados.quantidadeMembros && formData.quantidadeMembros
                          ? erros.quantidadeMembros
                            ? "border-[var(--cor-resposta-errada)] focus:ring-[var(--cor-resposta-errada)]"
                            : "border-[var(--cor-resposta-correta)] focus:ring-[var(--cor-resposta-correta)]"
                          : "border-gray-300 focus:ring-[var(--sucesso)]"
                      }
                    `}
                  />
                  {erros.quantidadeMembros && tocados.quantidadeMembros && (
                    <span id="erro-quantidade" className="text-[var(--cor-resposta-errada)] text-sm">
                      {erros.quantidadeMembros}
                    </span>
                  )}
                </div>

                {/* Documentos */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="documentos" className="text-sm font-semibold">
                    Anexe os documentos para comprovar todas as informações registradas <span className="text-[var(--cor-resposta-obrigatoria)]">*</span>
                  </label>
                  <input
                    type="file"
                    id="documentos"
                    name="documentos"
                    onChange={handleChange}
                    onBlur={handleBlur}
                    aria-invalid={!!erros.documentos}
                    aria-describedby={erros.documentos ? "erro-documentos" : undefined}
                    className={`
                      w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2
                      ${
                        tocados.documentos && formData.documentos
                          ? erros.documentos
                            ? "border-[var(--cor-resposta-errada)] focus:ring-[var(--cor-resposta-errada)]"
                            : "border-[var(--cor-resposta-correta)] focus:ring-[var(--cor-resposta-correta)]"
                          : "border-gray-300 focus:ring-[var(--sucesso)]"
                      }
                    `}
                  />
                  {tocados.documentos && erros.documentos && (
                    <span id="erro-documentos" className="text-[var(--cor-resposta-errada)] text-sm">
                      {erros.documentos}
                    </span>
                  )}
                  {formData.documentos && (
                    <p className="text-sm text-black">
                      Arquivo selecionado: {formData.documentos.name}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  <p className="body-semibold-pequeno">Termo:</p>
                  <p className="body-pequeno text-black">
                    Ao continuar, você declara que todas as informações fornecidas são verdadeiras
                    e autoriza a análise dos dados e documentos enviados para fins de avaliação
                    socioeconômica.
                  </p>

                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    
                    <input
                      type="checkbox"
                      checked={aceitouTermos}
                      onChange={() => setAceitouTermos(!aceitouTermos)}
                      className="hidden"
                    />

                    <div
                      className={`w-5 h-5 flex items-center justify-center rounded border-2 transition hover:scale-110
                        ${aceitouTermos 
                          ? "bg-[var(--base-40)] border-black" 
                          : "bg-white border-gray-400"}
                      `}
                    >
                      {aceitouTermos && (
                        <img src={icon_check} alt="Termo aceito" className="w-4 h-4" />
                      )}
                    </div>

                    <span className="body-pequeno">
                      Li e aceito os termos acima.
                    </span>
                  </label>

                </div>

                {/* Botões */}
                <div className="flex gap-4 pt-4">
                  <Botao
                    tipo="button"
                    variante="cancelar"
                    aoClicar={handleCancelar}
                    desabilitado={carregando}
                  >
                    Cancelar cadastro
                  </Botao>
                  <Botao
                    tipo="submit"
                    variante="confirmar"
                    desabilitado={carregando || !aceitouTermos}
                  >
                    {carregando ? "Carregando..." : "Confirmar cadastro"}
                  </Botao>
                </div>

              </form>

            </div>
          </div>
        </div>
      </main>

      {/* footer */}
      <Footer />
    </div>
  );
}

export default CadastroResponsavel;