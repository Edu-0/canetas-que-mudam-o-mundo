import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { IMaskInput } from "react-imask";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Botao from "../components/Botao";
import Toast from "../components/Toast";
import logo from "../assets/logo.svg";
import { atualizarTiposUsuario, DadosUsuario, obterUsuario } from "../services/usuarioService";
import { mapearTipo, TipoUsuario, useUsuario } from "../context/UserContext";

function CadastroBeneficiario() {
  const { usuario, definirUsuario } = useUsuario();
  
  const navigate = useNavigate();
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);

  const [formData, setFormData] = useState({
    nome: "",
    dataNascimento: "",
    cpf: "",
    cep: "",
    telefone: "",
    email: "",
    senha: "",
    rendaFamiliar: "",
    quantidadeMembros: "",
    bensFamiliares: "",
    documentos: null as File | null,
  });

  const [erros, setErros] = useState({
    nome: "",
    dataNascimento: "",
    cpf: "",
    cep: "",
    telefone: "",
    email: "",
    senha: "",
    rendaFamiliar: "",
    quantidadeMembros: "",
    bensFamiliares: "",
    documentos: "",
  });

  const [tocados, setTocados] = useState({
    nome: false,
    dataNascimento: false,
    cpf: false,
    cep: false,
    telefone: false,
    email: false,
    senha: false,
    rendaFamiliar: false,
    quantidadeMembros: false,
    bensFamiliares: false,
    documentos: false,
  });

  function validarCampo(nome: string, valor: string): string {
    switch (nome) {
      case "nome":
        return valor.trim().length < 3 ? "Nome deve ter pelo menos 3 caracteres" : "";
      case "dataNascimento":
        return !valor || valor.length < 10 ? "Data de nascimento é obrigatória" : "";
      case "cpf":
        return !valor || valor.replace(/\D/g, "").length !== 11 ? "CPF inválido" : "";
      case "cep":
        return !valor || valor.replace(/\D/g, "").length !== 8 ? "CEP inválido" : "";
      case "email":
        return !valor || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor) ? "Email inválido" : "";
      case "senha":
        return !valor || valor.length < 6 ? "Senha deve ter pelo menos 6 caracteres" : "";
      case "rendaFamiliar":
        return !valor || valor.trim() === "" ? "Renda familiar é obrigatória" : "";
      case "quantidadeMembros":
        return !valor || isNaN(Number(valor)) || Number(valor) <= 0 ? "Quantidade deve ser um número positivo" : "";
      case "bensFamiliares":
        return !valor || valor.trim() === "" ? "Descrição dos bens é obrigatória" : "";
      default:
        return "";
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, type, files } = e.target;
    
    if (type === "file") {
      setFormData((prev) => ({
        ...prev,
        [name]: files ? files[0] : null,
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

    // Validar documentos
    const erroDocumentos = !formData.documentos ? "Anexe os documentos para comprovação" : "";

    // Validar todos os campos
    const novosErros = {
      nome: validarCampo("nome", formData.nome),
      dataNascimento: validarCampo("dataNascimento", formData.dataNascimento),
      cpf: validarCampo("cpf", formData.cpf),
      cep: validarCampo("cep", formData.cep),
      telefone: validarCampo("telefone", formData.telefone),
      email: validarCampo("email", formData.email),
      senha: validarCampo("senha", formData.senha),
      rendaFamiliar: validarCampo("rendaFamiliar", formData.rendaFamiliar),
      quantidadeMembros: validarCampo("quantidadeMembros", formData.quantidadeMembros),
      bensFamiliares: validarCampo("bensFamiliares", formData.bensFamiliares),
      documentos: erroDocumentos,
    };

    setErros(novosErros);

    if (Object.values(novosErros).some((erro) => erro !== "")) {
      setTocados({
        nome: true,
        dataNascimento: true,
        cpf: true,
        cep: true,
        telefone: true,
        email: true,
        senha: true,
        rendaFamiliar: true,
        quantidadeMembros: true,
        bensFamiliares: true,
        documentos: true,
      });
      return;
    }

    setCarregando(true);

    try {
      // Aqui da de Implementar a chamada à API do backend
      // const response = await criarBeneficiario({
      //   nome: formData.nome,
      //   data_nascimento: formData.dataNascimento,
      //   cpf: formData.cpf.replace(/\D/g, ""),
      //   cep: formData.cep.replace(/\D/g, ""),
      //   telefone: formData.telefone.replace(/\D/g, ""),
      //   email: formData.email,
      //   senha: formData.senha,
      //   renda_familiar: formData.rendaFamiliar,
      //   quantidade_membros: formData.quantidadeMembros,
      //   bens_familiares: formData.bensFamiliares,
      //   documentos: formData.documentos,
      // });
      if(!usuario) return;
      
      try {
        const usuarioAtualizado: DadosUsuario = await obterUsuario(usuario.id);

        const tiposAtuais: TipoUsuario[] =
          usuarioAtualizado.funcao?.map((f: any) =>
            mapearTipo(f.tipo_usuario)
          ) ||
          (usuarioAtualizado as any).tipos ||
          [];

        let novosTipos: TipoUsuario[] = tiposAtuais.includes("Responsável pelo beneficiário")
          ? tiposAtuais
          : [...tiposAtuais, "Responsável pelo beneficiário"];

        if (!novosTipos.includes("Genérico")) {
          novosTipos.push("Genérico");
        }

        await atualizarTiposUsuario(usuario.id, novosTipos);

        // busca atualizado do backend
        const atualizado = await obterUsuario(usuario.id);

        // normaliza igual Conta
        const usuarioNormalizado = {
          id: atualizado.id,
          nome_completo: atualizado.nome_completo,
          data_nascimento: atualizado.data_nascimento,
          cpf: atualizado.cpf,
          cep: atualizado.cep,
          telefone: atualizado.telefone,
          email: atualizado.email,
          data_cadastro: atualizado.data_cadastro,
          data_edicao_conta: atualizado.data_edicao_conta,
          tipos: atualizado.funcao?.map((f: any) =>
            mapearTipo(f.tipo_usuario)
          ) || []
        };

        definirUsuario(usuarioNormalizado);

      } catch (error) {
        console.error("Erro ao atualizar tipo do usuário", error);
      }

      setMensagem("Beneficiário cadastrado com sucesso!");
      setTimeout(() => {
        navigate("/conta");
      }, 2000);
    } catch (error) {
      setMensagem("Erro ao cadastrar beneficiário. Tente novamente.");
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
            <img src={logo} alt="Logo" className="h-16 md:h-20" />
        
            <h1 className="header-medio text-center">
              Canetas que Mudam o Mundo
            </h1>
          </div>

          <div className="flex flex-col items-center px-4">

            {/* formulário */}
            <div className="w-full max-w-4xl bg-[var(--primario-5)] shadow-[2px_10px_40px_rgba(0,0,0,0.1)] rounded-lg p-6">

              <h2 className="header-pequeno text-center mb-6">
                CADASTRO DE FAMILIAR
              </h2>

              <form onSubmit={handleSubmit} className="flex flex-col gap-6">

                {/* Nome */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="nome" className="text-sm font-semibold">
                    Nome <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="nome"
                    name="nome"
                    placeholder="Digite aqui o seu nome"
                    value={formData.nome}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`
                      w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2
                      ${
                        tocados.nome && erros.nome
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:ring-[var(--sucesso)]"
                      }
                    `}
                  />
                  {tocados.nome && erros.nome && (
                    <span className="text-red-500 text-xs">{erros.nome}</span>
                  )}
                </div>

                {/* Linha com Data de Nascimento e CPF */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Data de Nascimento */}
                  <div className="flex flex-col gap-2">
                    <label htmlFor="dataNascimento" className="text-sm font-semibold">
                      Data de nascimento <span className="text-red-500">*</span>
                    </label>
                    <IMaskInput
                      mask="00/00/0000"
                      value={formData.dataNascimento}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      name="dataNascimento"
                      placeholder="DD/MM/AAAA"
                      className={`
                        w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2
                        ${
                          tocados.dataNascimento && erros.dataNascimento
                            ? "border-red-500 focus:ring-red-500"
                            : "border-gray-300 focus:ring-[var(--sucesso)]"
                        }
                      `}
                    />
                    {tocados.dataNascimento && erros.dataNascimento && (
                      <span className="text-red-500 text-xs">{erros.dataNascimento}</span>
                    )}
                  </div>

                  {/* CPF */}
                  <div className="flex flex-col gap-2">
                    <label htmlFor="cpf" className="text-sm font-semibold">
                      CPF <span className="text-red-500">*</span>
                    </label>
                    <IMaskInput
                      mask="000.000.000-00"
                      value={formData.cpf}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      name="cpf"
                      placeholder="Digite aqui o seu CPF"
                      className={`
                        w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2
                        ${
                          tocados.cpf && erros.cpf
                            ? "border-red-500 focus:ring-red-500"
                            : "border-gray-300 focus:ring-[var(--sucesso)]"
                        }
                      `}
                    />
                    {tocados.cpf && erros.cpf && (
                      <span className="text-red-500 text-xs">{erros.cpf}</span>
                    )}
                  </div>
                </div>

                {/* Linha com CEP e Telefone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* CEP */}
                  <div className="flex flex-col gap-2">
                    <label htmlFor="cep" className="text-sm font-semibold">
                      CEP <span className="text-red-500">*</span>
                    </label>
                    <IMaskInput
                      mask="00000-000"
                      value={formData.cep}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      name="cep"
                      placeholder="Digite aqui o seu CEP"
                      className={`
                        w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2
                        ${
                          tocados.cep && erros.cep
                            ? "border-red-500 focus:ring-red-500"
                            : "border-gray-300 focus:ring-[var(--sucesso)]"
                        }
                      `}
                    />
                    {tocados.cep && erros.cep && (
                      <span className="text-red-500 text-xs">{erros.cep}</span>
                    )}
                  </div>

                  {/* Telefone */}
                  <div className="flex flex-col gap-2">
                    <label htmlFor="telefone" className="text-sm font-semibold">
                      Telefone
                    </label>
                    <IMaskInput
                      mask="(00) 0000-0000"
                      value={formData.telefone}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      name="telefone"
                      placeholder="(XX) XXXX-XXXX"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--sucesso)]"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="email" className="text-sm font-semibold">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="Digite aqui o seu email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`
                      w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2
                      ${
                        tocados.email && erros.email
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:ring-[var(--sucesso)]"
                      }
                    `}
                  />
                  {tocados.email && erros.email && (
                    <span className="text-red-500 text-xs">{erros.email}</span>
                  )}
                </div>

                {/* Senha */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="senha" className="text-sm font-semibold">
                    Crie uma senha <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    id="senha"
                    name="senha"
                    placeholder="Digite aqui a sua senha"
                    value={formData.senha}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`
                      w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2
                      ${
                        tocados.senha && erros.senha
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:ring-[var(--sucesso)]"
                      }
                    `}
                  />
                  {tocados.senha && erros.senha && (
                    <span className="text-red-500 text-xs">{erros.senha}</span>
                  )}
                </div>

                {/* Renda Familiar */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="rendaFamiliar" className="text-sm font-semibold">
                    Qual é a sua renda bruta familiar <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="rendaFamiliar"
                    name="rendaFamiliar"
                    placeholder="Digite aqui a sua renda bruta"
                    value={formData.rendaFamiliar}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`
                      w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2
                      ${
                        tocados.rendaFamiliar && erros.rendaFamiliar
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:ring-[var(--sucesso)]"
                      }
                    `}
                  />
                  {tocados.rendaFamiliar && erros.rendaFamiliar && (
                    <span className="text-red-500 text-xs">{erros.rendaFamiliar}</span>
                  )}
                </div>

                {/* Quantidade de Membros */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="quantidadeMembros" className="text-sm font-semibold">
                    Quantidade de membros familiares <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="quantidadeMembros"
                    name="quantidadeMembros"
                    placeholder="Digite aqui a quantidade de membros familiares"
                    value={formData.quantidadeMembros}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    min="1"
                    className={`
                      w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2
                      ${
                        tocados.quantidadeMembros && erros.quantidadeMembros
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:ring-[var(--sucesso)]"
                      }
                    `}
                  />
                  {tocados.quantidadeMembros && erros.quantidadeMembros && (
                    <span className="text-red-500 text-xs">{erros.quantidadeMembros}</span>
                  )}
                </div>

                {/* Bens Familiares */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="bensFamiliares" className="text-sm font-semibold">
                    Seus bens familiares <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="bensFamiliares"
                    name="bensFamiliares"
                    placeholder="Digite aqui seus móveis e imóveis"
                    value={formData.bensFamiliares}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`
                      w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2
                      ${
                        tocados.bensFamiliares && erros.bensFamiliares
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:ring-[var(--sucesso)]"
                      }
                    `}
                  />
                  {tocados.bensFamiliares && erros.bensFamiliares && (
                    <span className="text-red-500 text-xs">{erros.bensFamiliares}</span>
                  )}
                </div>

                {/* Documentos */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="documentos" className="text-sm font-semibold">
                    Anexe os documentos para comprovar todas as informações registradas <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    id="documentos"
                    name="documentos"
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`
                      w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2
                      ${
                        tocados.documentos && erros.documentos
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:ring-[var(--sucesso)]"
                      }
                    `}
                  />
                  {tocados.documentos && erros.documentos && (
                    <span className="text-red-500 text-xs">{erros.documentos}</span>
                  )}
                  {formData.documentos && (
                    <p className="text-sm text-gray-600">Arquivo selecionado: {formData.documentos.name}</p>
                  )}
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
                    desabilitado={carregando}
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

export default CadastroBeneficiario;