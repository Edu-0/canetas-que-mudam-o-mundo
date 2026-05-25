import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import logo from "../assets/logo.svg";
import Botao from "../components/Botao";
import Toast from "../components/Toast";
import ModalConfirmacao from "../components/ModalConfirmacao";
import {
  registrarDoacao,
  atualizarDoacao,
  obterDoacao,
  type Doacao,
  type ImagemDoacao,
} from "../services/doacaoService";
import { useAvisoAlteracoesNaoSalvas } from "../hooks/useAvisoAlteracoesNaoSalvas";

function Doar() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const idEdicao = params.get("id") ? Number(params.get("id")) : null;
  const modoEdicao = idEdicao !== null;

  // estado do formulário 
  const [tipoMaterial, setTipoMaterial] = useState("");
  const [descricao, setDescricao] = useState("");
  const [possiveisDefeitos, setPossiveisDefeitos] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [arquivos, setArquivos] = useState<File[]>([]);
  const inputArquivoRef = useRef<HTMLInputElement>(null);

  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroModal, setErroModal] = useState<string | null>(null);

  const [mensagem, setMensagem] = useState("");
  const [tipoMensagem, setTipoMensagem] = useState<"sucesso" | "erro">("sucesso");
  const [enviando, setEnviando] = useState(false);
  const [carregando, setCarregando] = useState(modoEdicao);

  const { setAlterou, tentarSair, mostrarModal, setMostrarModal } =
    useAvisoAlteracoesNaoSalvas({
      mensagem: "Você começou a preencher a doação. Deseja sair mesmo?",
    });

  //pré-carrega dados no modo edição 
  useEffect(() => {
    if (!modoEdicao) return;

    async function carregar() {
      try {
        const dados: Doacao = await obterDoacao(idEdicao!);
        setTipoMaterial(dados.tipo_material);
        setDescricao(dados.descricao);
        setPossiveisDefeitos(dados.possiveis_defeitos || "");
        setQuantidade(String(dados.quantidade));
      } catch (erro: any) {
        const status = erro?.response?.status;
        if (status === 403) {
          setErroModal("Você não tem permissão para editar esta doação.");
        } else if (status === 404) {
          setErroModal("Doação não encontrada.");
        } else {
          setErroModal("Erro ao carregar dados da doação.");
        }
      } finally {
        setCarregando(false);
      }
    }

    carregar();
  }, [idEdicao]);

  //  validação 
  function validar() {
    const novosErros: Record<string, string> = {};

    if (!tipoMaterial.trim()) {
      novosErros.tipoMaterial = "Campo obrigatório.";
    } else if (tipoMaterial.trim().length > 255) {
      novosErros.tipoMaterial = "Máximo de 255 caracteres.";
    }

    if (!descricao.trim()) {
      novosErros.descricao = "Campo obrigatório.";
    } else if (descricao.trim().length > 1000) {
      novosErros.descricao = "Máximo de 1000 caracteres.";
    }

    if (possiveisDefeitos.trim().length > 1000) {
      novosErros.possiveisDefeitos = "Máximo de 1000 caracteres.";
    }

    const qtd = Number(quantidade);
    if (!quantidade.trim()) {
      novosErros.quantidade = "Campo obrigatório.";
    } else if (isNaN(qtd) || qtd <= 0 || !Number.isInteger(qtd)) {
      novosErros.quantidade = "Informe um número inteiro positivo.";
    }

    // imagens só obrigatórias no cadastro novo
    if (!modoEdicao && arquivos.length === 0) {
      novosErros.arquivos = "Anexe pelo menos uma imagem do material.";
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  }

  //  submit 
  async function handleSubmit() {
    if (!validar()) return;

    setEnviando(true);

    const formData = new FormData();
    formData.append("tipo_material", tipoMaterial.trim());
    formData.append("descricao", descricao.trim());
    if (possiveisDefeitos.trim()) {
      formData.append("possiveis_defeitos", possiveisDefeitos.trim());
    }
    formData.append("quantidade", quantidade.trim());

    if (!modoEdicao) {
      // cadastro novo: campo "imagens"
      for (const arquivo of arquivos) {
        formData.append("imagens", arquivo);
      }
    } else if (arquivos.length > 0) {
      // edição: campo "novas_imagens" (substitui as antigas)
      for (const arquivo of arquivos) {
        formData.append("novas_imagens", arquivo);
      }
    }

    try {
      if (modoEdicao) {
        await atualizarDoacao(idEdicao!, formData);
      } else {
        await registrarDoacao(formData);
      }

      setAlterou(false);
      setMensagem(
        modoEdicao
          ? "Doação atualizada com sucesso!"
          : "Doação registrada com sucesso!"
      );
      setTipoMensagem("sucesso");

      setTimeout(() => {
        navigate("/doacoes");
      }, 2000);
    } catch (erro: any) {
      console.error("Erro ao registrar doação:", erro);
      const detalhe = erro?.response?.data?.detail;
      const mensagemErro =
        typeof detalhe === "string"
          ? detalhe
          : "Erro ao registrar doação. Tente novamente.";
      setErroModal(mensagemErro);
    } finally {
      setEnviando(false);
    }
  }

  //  upload de arquivos 
  function handleArquivos(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    const novosArquivos = Array.from(e.target.files);
    setArquivos((prev) => [...prev, ...novosArquivos]);
    setAlterou(true);
    setErros((prev) => ({ ...prev, arquivos: "" }));
    // limpa o input para permitir selecionar o mesmo arquivo novamente
    e.target.value = "";
  }

  function removerArquivo(index: number) {
    setArquivos((prev) => prev.filter((_, i) => i !== index));
  }

  //  render 
  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden bg-[var(--base-5)]">
      {/* header */}
      <Header />

      {/* body */}
      <main className="flex-1 pt-24 pb-10">
        <div className="w-full px-6 md:px-20 flex flex-col gap-10">
          <Toast mensagem={mensagem} tipo={tipoMensagem} />

          {/* título e logo */}
          <div className="flex items-center justify-center gap-4 flex-wrap text-center">
            <img
              src={logo}
              alt="Logo Canetas que Mudam o Mundo"
              className="h-16 md:h-20"
            />
            <h1 className="header-medio text-center">
              Canetas que Mudam o Mundo
            </h1>
          </div>

          <div className="flex flex-col items-center px-4">
            <div className="w-full max-w-4xl bg-[var(--primario-5)] shadow-[2px_10px_40px_rgba(0,0,0,0.1)] rounded-lg p-6">

              {/* título do formulário */}
              <h2 className="header-pequeno text-center mb-6">
                {modoEdicao ? "EDITAR DOAÇÃO" : "REGISTRAR DOAÇÃO"}
              </h2>

              {carregando ? (
                <p className="text-center body-semibold-pequeno py-6">
                  Carregando dados da doação...
                </p>
              ) : (
                <div className="flex flex-col gap-5">

                  {/* Tipo de material */}
                  <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                    <label
                      htmlFor="tipo-material"
                      className="body-semibold-pequeno sm:w-52 sm:text-right sm:pt-2 flex-shrink-0"
                    >
                      Tipo de material:{" "}
                      <span className="text-[var(--cor-resposta-errada)]">*</span>
                    </label>
                    <div className="flex-1">
                      <input
                        id="tipo-material"
                        type="text"
                        maxLength={255}
                        placeholder="Digite aqui o tipo"
                        value={tipoMaterial}
                        onChange={(e) => {
                          setTipoMaterial(e.target.value);
                          setAlterou(true);
                          setErros((prev) => ({ ...prev, tipoMaterial: "" }));
                        }}
                        className={`input-padrao w-full ${
                          erros.tipoMaterial
                            ? "border-[var(--cor-resposta-errada)] focus:ring-[var(--cor-resposta-errada)]"
                            : "hover:border-2 border-[var(--base-70)] focus-acessivel"
                        }`}
                        aria-invalid={!!erros.tipoMaterial}
                      />
                      {erros.tipoMaterial && (
                        <span className="text-[var(--cor-resposta-errada)] text-sm mt-1 block">
                          {erros.tipoMaterial}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Descrição */}
                  <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                    <label
                      htmlFor="descricao"
                      className="body-semibold-pequeno sm:w-52 sm:text-right sm:pt-2 flex-shrink-0"
                    >
                      Descrição:{" "}
                      <span className="text-[var(--cor-resposta-errada)]">*</span>
                    </label>
                    <div className="flex-1">
                      <input
                        id="descricao"
                        type="text"
                        maxLength={1000}
                        placeholder="Digite aqui a descrição do estado do material"
                        value={descricao}
                        onChange={(e) => {
                          setDescricao(e.target.value);
                          setAlterou(true);
                          setErros((prev) => ({ ...prev, descricao: "" }));
                        }}
                        className={`input-padrao w-full ${
                          erros.descricao
                            ? "border-[var(--cor-resposta-errada)] focus:ring-[var(--cor-resposta-errada)]"
                            : "hover:border-2 border-[var(--base-70)] focus-acessivel"
                        }`}
                        aria-invalid={!!erros.descricao}
                      />
                      {erros.descricao && (
                        <span className="text-[var(--cor-resposta-errada)] text-sm mt-1 block">
                          {erros.descricao}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Possíveis defeitos (opcional) */}
                  <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                    <label
                      htmlFor="possiveis-defeitos"
                      className="body-semibold-pequeno sm:w-52 sm:text-right sm:pt-2 flex-shrink-0"
                    >
                      Possíveis defeitos:
                    </label>
                    <div className="flex-1">
                      <input
                        id="possiveis-defeitos"
                        type="text"
                        maxLength={1000}
                        placeholder="Digite aqui os possíveis defeitos"
                        value={possiveisDefeitos}
                        onChange={(e) => {
                          setPossiveisDefeitos(e.target.value);
                          setAlterou(true);
                          setErros((prev) => ({
                            ...prev,
                            possiveisDefeitos: "",
                          }));
                        }}
                        className={`input-padrao w-full ${
                          erros.possiveisDefeitos
                            ? "border-[var(--cor-resposta-errada)] focus:ring-[var(--cor-resposta-errada)]"
                            : "hover:border-2 border-[var(--base-70)] focus-acessivel"
                        }`}
                      />
                      {erros.possiveisDefeitos && (
                        <span className="text-[var(--cor-resposta-errada)] text-sm mt-1 block">
                          {erros.possiveisDefeitos}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quantidade */}
                  <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                    <label
                      htmlFor="quantidade"
                      className="body-semibold-pequeno sm:w-52 sm:text-right sm:pt-2 flex-shrink-0"
                    >
                      Quantidade:{" "}
                      <span className="text-[var(--cor-resposta-errada)]">*</span>
                    </label>
                    <div className="flex-1">
                      <input
                        id="quantidade"
                        type="number"
                        min={1}
                        placeholder="Digite aqui a quantidade"
                        value={quantidade}
                        onChange={(e) => {
                          setQuantidade(e.target.value);
                          setAlterou(true);
                          setErros((prev) => ({ ...prev, quantidade: "" }));
                        }}
                        className={`input-padrao w-48 ${
                          erros.quantidade
                            ? "border-[var(--cor-resposta-errada)] focus:ring-[var(--cor-resposta-errada)]"
                            : "hover:border-2 border-[var(--base-70)] focus-acessivel"
                        }`}
                        aria-invalid={!!erros.quantidade}
                      />
                      {erros.quantidade && (
                        <span className="text-[var(--cor-resposta-errada)] text-sm mt-1 block">
                          {erros.quantidade}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Upload de imagens */}
                  <div className="flex flex-col gap-2 mt-2">
                    <span className="body-semibold-pequeno">
                      Anexe as imagens para comprovar o material e seu estado:
                      {!modoEdicao && (
                        <span className="text-[var(--cor-resposta-errada)]"> *</span>
                      )}
                    </span>

                    <div className="flex flex-wrap gap-2 items-center">
                      <button
                        type="button"
                        onClick={() => inputArquivoRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2 border border-[var(--base-70)] rounded-lg bg-white hover:bg-[var(--base-10)] body-semibold-pequeno transition-colors cursor-pointer"
                        aria-label="Anexar arquivos"
                      >
                        Anexar arquivos
                      </button>

                      {/* chips com os arquivos selecionados */}
                      {arquivos.map((arquivo, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-1 bg-[var(--base-10)] border border-[var(--base-70)] rounded-lg px-3 py-2 text-sm"
                        >
                          <span className="truncate max-w-[130px]">
                            {arquivo.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => removerArquivo(index)}
                            className="text-[var(--cor-resposta-errada)] font-bold hover:opacity-70 ml-1 leading-none"
                            aria-label={`Remover ${arquivo.name}`}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* input real oculto */}
                    <input
                      ref={inputArquivoRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleArquivos}
                    />

                    {erros.arquivos && (
                      <span className="text-[var(--cor-resposta-errada)] text-sm">
                        {erros.arquivos}
                      </span>
                    )}

                    {modoEdicao && (
                      <p className="text-sm text-gray-500">
                        Deixe sem selecionar para manter as imagens anteriores.
                        Ao adicionar novas, as antigas serão substituídas.
                      </p>
                    )}
                  </div>

                  {/* botões de ação */}
                  <div className="flex flex-col sm:flex-row justify-between gap-4 mt-4">
                    <Botao
                      variante="cancelar"
                      aoClicar={() => {
                        const podeSair = tentarSair("/doacoes");
                        if (podeSair) navigate("/doacoes");
                      }}
                    >
                      Cancelar registro
                    </Botao>

                    <Botao
                      variante="confirmar"
                      desabilitado={enviando}
                      aoClicar={handleSubmit}
                    >
                      {enviando
                        ? modoEdicao
                          ? "Salvando..."
                          : "Registrando..."
                        : modoEdicao
                        ? "Salvar alterações"
                        : "Confirmar registro"}
                    </Botao>
                  </div>
                </div>
              )}

              {/* modal: alterações não salvas */}
              <ModalConfirmacao
                aberto={mostrarModal && !erroModal}
                titulo="Alterações não salvas"
                descricao="Você começou a preencher a doação. Deseja sair mesmo?"
                botaoCancelar="Continuar"
                botaoConfirmar="Sair sem salvar"
                varianteCancelar="confirmar"
                varianteConfirmar="cancelar"
                onCancelar={() => setMostrarModal(false)}
                onConfirmar={() => {
                  setMostrarModal(false);
                  const rota = sessionStorage.getItem("rotaDestino");
                  sessionStorage.removeItem("rotaDestino");
                  navigate(rota || "/doacoes");
                }}
              />

              {/* modal: erro */}
              <ModalConfirmacao
                aberto={!!erroModal}
                titulo="Erro"
                descricao={erroModal || ""}
                varianteCancelar="cancelar"
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

export default Doar;