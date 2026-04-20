import { useState, useEffect, useRef } from "react";
import Botao from "./Botao";
import { validarCampo } from "../utils/validacoesFormulario";
import { verificarRequisitosSenha } from "../utils/validacoes";
import olho_visivel from "../assets/icon_olho_visivel.png";
import olho_bloqueado from "../assets/icon_olho_bloqueado.png";

type Props = {
  aoEnviar: (senha: string) => Promise<void> | void;
  aoErro?: (erro: { campo?: string; mensagem: string }) => void;
  aoCancelar?: () => void;
  mostrarCancelar?: boolean;
  mudouDados?: (dados: { senha: string; confirmarSenha: string }) => void;
};

function FormTrocaSenha({
  aoEnviar,
  aoErro,
  aoCancelar,
  mostrarCancelar = false,
  mudouDados
}: Props) {
  
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);

  const [carregando, setCarregando] = useState(false);

  const requisitosSenha = verificarRequisitosSenha(senha);

  const primeiraRenderizacao = useRef(true);

  const [erros, setErros] = useState({
    senha: "",
    confirmarSenha: "",
  });

  const [tocados, setTocados] = useState({
    senha: false,
    confirmarSenha: false,
  });

  const dados = { senha, confirmarSenha };

  function validarUmCampo(campo: keyof typeof erros) {
    const mensagem = validarCampo(campo, dados);

    setErros((prev) => ({
      ...prev,
      [campo]: mensagem,
    }));
  }

  useEffect(() => {
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false;
      return;
    }

    mudouDados?.({ senha, confirmarSenha });
  }, [senha, confirmarSenha]);

  function marcarComoTocado(campo: keyof typeof tocados) {
    setTocados((prev) => ({ ...prev, [campo]: true }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (carregando) return;

    const novosErros = {
      senha: validarCampo("senha", dados),
      confirmarSenha: validarCampo("confirmarSenha", dados),
    };

    setErros(novosErros);

    if (Object.values(novosErros).some((erro) => erro !== "")) {
      setTocados({
        senha: true,
        confirmarSenha: true,
      });
      return;
    }

    setCarregando(true);

    try {
      await aoEnviar(senha);
    } catch (error: any) {
      const erroBackend = error.response?.data?.detail;

      if (erroBackend) {
        aoErro?.(erroBackend);

        if (erroBackend.campo) {
          setErros((prev) => ({
            ...prev,
            [erroBackend.campo]: erroBackend.mensagem,
          }));

          setTocados((prev) => ({
            ...prev,
            [erroBackend.campo]: true,
          }));
        }
      } else {
        aoErro?.({ mensagem: "Erro ao trocar senha. Tente novamente." });
      }
    } finally {
      setCarregando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">


      <div>
        <label className="body-semibold-pequeno" htmlFor="senha">Senha <span className="text-[var(--cor-resposta-obrigatoria)]">*</span></label>
        <div className="relative">
          <input id="senha" type={mostrarSenha ? "text" : "password"} maxLength={50} className={`input-padrao pr-10 ${tocados.senha && senha ? erros.senha ? "border-[var(--cor-resposta-errada)] focus:ring-[var(--cor-resposta-errada)]": "border-[var(--cor-resposta-correta)] focus:ring-[var(--cor-resposta-correta)]" : ""}`} 
          autoComplete="new-password" placeholder="Digite aqui a sua nova senha" value={senha} onChange={(e) => setSenha(e.target.value)} aria-invalid={!!erros.senha} aria-describedby={erros.senha ? "erro-senha" : undefined} onBlur={() => {marcarComoTocado("senha"), validarUmCampo("senha");}}/>

          <button type="button" onClick={() => setMostrarSenha(!mostrarSenha)} className="absolute right-3 top-1/2 -translate-y-1/2 focus-acessivel" aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}>
            <img src={mostrarSenha ? olho_visivel : olho_bloqueado} alt={mostrarSenha ? "Ocultar senha" : "Mostrar senha"} className="w-5 h-5"/>
          </button>
        </div>
      </div>
      {erros.senha && tocados.senha && <p id="erro-senha" aria-live="polite" className="text-[var(--cor-resposta-errada)] text-sm">{erros.senha}</p>}
      
      {senha && (
        <div className="text-sm mt-0 space-y-1">
          <p className={requisitosSenha.tamanho ? "text-[var(--cor-resposta-correta)]" : "text-[var(--cor-resposta-errada)]"}>
            {requisitosSenha.tamanho ? "✔" : "✖"} A senha deve ter no mínimo 8 caracteres
          </p>

          <p className={requisitosSenha.minuscula ? "text-[var(--cor-resposta-correta)]" : "text-[var(--cor-resposta-errada)]"}>
            {requisitosSenha.minuscula ? "✔" : "✖"} A senha deve conter pelo menos uma letra minúscula
          </p>

          <p className={requisitosSenha.maiuscula ? "text-[var(--cor-resposta-correta)]" : "text-[var(--cor-resposta-errada)]"}>
            {requisitosSenha.maiuscula ? "✔" : "✖"} A senha deve conter pelo menos uma letra maiúscula
          </p>

          <p className={requisitosSenha.numero ? "text-[var(--cor-resposta-correta)]" : "text-[var(--cor-resposta-errada)]"}>
            {requisitosSenha.numero ? "✔" : "✖"} A senha deve conter pelo menos um número
          </p>

          <p className={requisitosSenha.caractereEspecial ? "text-[var(--cor-resposta-correta)]" : "text-[var(--cor-resposta-errada)]"}>
            {requisitosSenha.caractereEspecial ? "✔" : "✖"} A senha deve conter pelo menos um caractere especial
          </p>
        </div>
      )}

      <div>
        <label className="body-semibold-pequeno" htmlFor="confirmarSenha">Confirmar senha <span className="text-[var(--cor-resposta-obrigatoria)]">*</span></label>
        <div className="relative">
          <input id="confirmarSenha" type={mostrarConfirmarSenha ? "text" : "password"} maxLength={50} className={`input-padrao pr-10 ${tocados.confirmarSenha && confirmarSenha ? erros.confirmarSenha ? "border-[var(--cor-resposta-errada)] focus:ring-[var(--cor-resposta-errada)]": "border-[var(--cor-resposta-correta)] focus:ring-[var(--cor-resposta-correta)]" : ""}`} 
          autoComplete="new-password" placeholder="Confirme aqui a sua nova senha" value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} aria-invalid={!!erros.confirmarSenha} aria-describedby={erros.confirmarSenha ? "erro-confirmar-senha" : undefined} onBlur={() => {marcarComoTocado("confirmarSenha"), validarUmCampo("confirmarSenha");}}/>
          
          <button type="button" onClick={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)} className="absolute right-3 top-1/2 -translate-y-1/2 focus-acessivel" aria-label={mostrarConfirmarSenha ? "Ocultar senha" : "Mostrar senha"}>
            <img src={mostrarConfirmarSenha ? olho_visivel : olho_bloqueado} alt={mostrarConfirmarSenha ? "Ocultar senha" : "Mostrar senha"} className="w-5 h-5"/>
          </button>
        </div>
      </div>
      {erros.confirmarSenha && tocados.confirmarSenha && <p id="erro-confirmar-senha" aria-live="polite" className="text-[var(--cor-resposta-errada)] text-sm">{erros.confirmarSenha}</p>}
      

      <div className="flex-1">
        <Botao tipo="submit" variante="confirmar" desabilitado={carregando}>
          {carregando ? "Salvando..." : "Salvar nova senha"}
        </Botao>
      </div>

    </form>
  );
}

export default FormTrocaSenha;