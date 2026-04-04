import { useState } from "react";
import Botao from "./Botao";

type Props = {
  aoEnviar: (dados: { email: string; senha: string }) => void;
};

function FormCadastroBase({ aoEnviar }: Props) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (carregando) return; // evita múltiplos envios

    setErro("");

    if (!email || !senha || !confirmarSenha) {
      setErro("Preencha todos os campos.");
      return;
    }

    if (!email.includes("@")) {
      setErro("Email inválido.");
      return;
    }

    if (senha.length < 6) {
      setErro("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (senha !== confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }

    setCarregando(true);

    setTimeout(() => {aoEnviar({ email, senha });setCarregando(false);}, 1000);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">

      <div>
        <label className="body-semibold-pequeno" htmlFor="email">Email <span className="text-[var(--cor-resposta-obrigatoria)]">*</span></label>
        <input id="email" type="email" className="input-padrao" placeholder="Digite aqui o seu email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!erro} aria-describedby={erro ? "cadastro-erro" : undefined}/>
      </div>

      <div>
        <label className="body-semibold-pequeno" htmlFor="senha">Senha <span className="text-[var(--cor-resposta-obrigatoria)]">*</span></label>
        <input id="senha" type="password" className="input-padrao" placeholder="Digite aqui a sua senha" value={senha} onChange={(e) => setSenha(e.target.value)} aria-invalid={!!erro} aria-describedby={erro ? "cadastro-erro" : undefined}/>
      </div>

      <div>
        <label className="body-semibold-pequeno" htmlFor="confirmar-senha">Confirmar senha <span className="text-[var(--cor-resposta-obrigatoria)]">*</span></label>
        <input id="confirmar-senha" type="password" className="input-padrao" placeholder="Confirme aqui a sua senha" value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} aria-invalid={!!erro} aria-describedby={erro ? "cadastro-erro" : undefined}/>
      </div>

      {erro && <p id="cadastro-erro" className="text-[var(--cor-resposta-obrigatoria)] text-sm">{erro}</p>}

      <Botao tipo="submit" variante="confirmar" desabilitado={carregando}>
        {carregando ? "Enviando..." : "Cadastrar"}
      </Botao>

    </form>
  );
}

export default FormCadastroBase;