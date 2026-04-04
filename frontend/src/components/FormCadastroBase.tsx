import { IMaskInput } from "react-imask";
import { useState } from "react";
import Botao from "./Botao";

type Props = {
  aoEnviar: (dados: { 
    nome: string;
    dataNascimento: string;
    cpf: string;
    cep: string;
    telefone: string;
    email: string; 
    senha: string 
  }) => void;
};

function FormCadastroBase({ aoEnviar }: Props) {
  const [nome, setNome] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [cpf, setCpf] = useState("");
  const [cep, setCep] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  const [erros, setErros] = useState({
    nome: "",
    dataNascimento: "",
    cpf: "",
    cep: "",
    telefone: "",
    email: "",
    senha: "",
    confirmarSenha: "",
  });

  const [tocados, setTocados] = useState({
    nome: false,
    dataNascimento: false,
    cpf: false,
    cep: false,
    telefone: false,
    email: false,
    senha: false,
    confirmarSenha: false,
  });

  const [carregando, setCarregando] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (carregando) return; // evita múltiplos envios

    const novosErros = {
      nome: "",
      dataNascimento: "",
      cpf: "",
      cep: "",
      telefone: "",
      email: "",
      senha: "",
      confirmarSenha: "",
    };

    let temErro = false;

    // campos vazios
    if (!nome) {
      novosErros.nome = "Campo obrigatório";
      temErro = true;
    }

    if (!dataNascimento) {
      novosErros.dataNascimento = "Campo obrigatório";
      temErro = true;
    }

    if (!cpf) {
      novosErros.cpf = "Campo obrigatório";
      temErro = true;
    }

    if (!cep) {
      novosErros.cep = "Campo obrigatório";
      temErro = true;
    }

    if (!email) {
      novosErros.email = "Campo obrigatório";
      temErro = true;
    }

    if (!senha) {
      novosErros.senha = "Campo obrigatório";
      temErro = true;
    }

    if (!confirmarSenha) {
      novosErros.confirmarSenha = "Campo obrigatório";
      temErro = true;
    }

    // validações dos campos
    if (nome && !nomeCompletoValido(nome)) {
      novosErros.nome = "Digite nome completo";
      temErro = true;
    }

    if (cpf && !validarCPF(cpf)) {
      novosErros.cpf = "CPF inválido";
      temErro = true;
    }

    if (email && !email.includes("@")) {
      novosErros.email = "Email inválido";
      temErro = true;
    }

    if (senha && senha.length < 6) {
      novosErros.senha = "Mínimo 6 caracteres";
      temErro = true;
    }

    if (senha && confirmarSenha && senha !== confirmarSenha) {
      novosErros.confirmarSenha = "Senhas não coincidem";
      temErro = true;
    }

    if (temErro) {
      setErros(novosErros);
      return;
    }

    setErros(novosErros);

    setCarregando(true);

    setTimeout(() => {
      aoEnviar({ nome, dataNascimento, cpf, cep, telefone, email, senha });
      setCarregando(false);
    }, 1000);

  }

  function nomeCompletoValido(nome: string) {
    const partes = nome.trim().split(" ");
    return partes.length >= 2;
  }

  function validarCPF(cpf: string) {
    cpf = cpf.replace(/\D/g, "");

    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

    let soma = 0;
    let resto;

    for (let i = 1; i <= 9; i++)
      soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);

    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.substring(9, 10))) return false;

    soma = 0;

    for (let i = 1; i <= 10; i++)
      soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);

    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;

    return resto === parseInt(cpf.substring(10, 11));
  }

  function marcarComoTocado(campo: keyof typeof tocados) {
    setTocados((prev) => ({ ...prev, [campo]: true }));
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">

      <div>
        <label className="body-semibold-pequeno" htmlFor="nome">Nome completo <span className="text-[var(--cor-resposta-obrigatoria)]">*</span></label>
        <input id="nome" type="text" required className="input-padrao" autoComplete="name" placeholder="Digite aqui o seu nome completo" value={nome} onChange={(e) => setNome(e.target.value)} aria-invalid={!!erros.nome} aria-describedby={erros.nome ? "cadastro-erro" : undefined} onBlur={() => marcarComoTocado("nome")}/>
      </div>
      {erros.nome && tocados.nome && <p className="text-[var(--cor-resposta-obrigatoria)] text-sm">{erros.nome}</p>}

      <div>
        <label className="body-semibold-pequeno" htmlFor="data-nascimento">Data de nascimento <span className="text-[var(--cor-resposta-obrigatoria)]">*</span></label>
        <input id="data-nascimento" type="date" required className="input-padrao" autoComplete="off" value={dataNascimento} onChange={(e) => setDataNascimento(e.target.value)} aria-invalid={!!erros.dataNascimento} aria-describedby={erros.dataNascimento ? "cadastro-erro" : undefined} onBlur={() => marcarComoTocado("dataNascimento")}/>
      </div>
      {erros.dataNascimento && tocados.dataNascimento && <p className="text-[var(--cor-resposta-obrigatoria)] text-sm">{erros.dataNascimento}</p>}

      <div>
        <label className="body-semibold-pequeno" htmlFor="cpf">CPF <span className="text-[var(--cor-resposta-obrigatoria)]">*</span></label>
        <IMaskInput mask="000.000.000-00" id="cpf" type="text" required className="input-padrao" autoComplete="cpf" placeholder="Digite aqui o seu CPF 000.000.000-00" value={cpf} onAccept={(value) => setCpf(value)} onBlur={() => marcarComoTocado("cpf")} aria-invalid={!!erros.cpf} aria-describedby={erros.cpf ? "cadastro-erro" : undefined}/>
      </div>
      {erros.cpf && tocados.cpf && <p className="text-[var(--cor-resposta-obrigatoria)] text-sm">{erros.cpf}</p>}

      <div>
        <label className="body-semibold-pequeno" htmlFor="cep">CEP <span className="text-[var(--cor-resposta-obrigatoria)]">*</span></label>
        <IMaskInput mask="00000-000" id="cep" type="text" required className="input-padrao" autoComplete="postal-code" placeholder="Digite aqui o seu CEP 00000-000" value={cep} onAccept={(value) => setCep(value)} onBlur={() => marcarComoTocado("cep")} aria-invalid={!!erros.cep} aria-describedby={erros.cep ? "cadastro-erro" : undefined}/>
      </div>
      {erros.cep && tocados.cep && <p className="text-[var(--cor-resposta-obrigatoria)] text-sm">{erros.cep}</p>}

      <div>
        <label className="body-semibold-pequeno" htmlFor="telefone">Telefone</label>
        <IMaskInput mask="(00) 00000-0000" id="telefone" type="tel" className="input-padrao" autoComplete="tel" placeholder="Digite aqui o seu telefone (00) 00000-0000" value={telefone} onAccept={(value) => setTelefone(value)} onBlur={() => marcarComoTocado("telefone")} aria-invalid={!!erros.telefone} aria-describedby={erros.telefone ? "cadastro-erro" : undefined} />
      </div>
      {erros.telefone && tocados.telefone && <p className="text-[var(--cor-resposta-obrigatoria)] text-sm">{erros.telefone}</p>}

      <div>
        <label className="body-semibold-pequeno" htmlFor="email">Email <span className="text-[var(--cor-resposta-obrigatoria)]">*</span></label>
        <input id="email" type="email" required className="input-padrao" placeholder="Digite aqui o seu email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!erros.email} aria-describedby={erros.email ? "cadastro-erro" : undefined} onBlur={() => marcarComoTocado("email")}/>
      </div>
      {erros.email && tocados.email && <p className="text-[var(--cor-resposta-obrigatoria)] text-sm">{erros.email}</p>}

      <div>
        <label className="body-semibold-pequeno" htmlFor="senha">Senha <span className="text-[var(--cor-resposta-obrigatoria)]">*</span></label>
        <input id="senha" type="password" className="input-padrao" placeholder="Digite aqui a sua senha" autoComplete="new-password" value={senha} onChange={(e) => setSenha(e.target.value)} aria-invalid={!!erros.senha} aria-describedby={erros.senha ? "cadastro-erro" : undefined} onBlur={() => marcarComoTocado("senha")}/>
      </div>
      {erros.senha && tocados.senha && <p className="text-[var(--cor-resposta-obrigatoria)] text-sm">{erros.senha}</p>}

      <div>
        <label className="body-semibold-pequeno" htmlFor="confirmar-senha">Confirmar senha <span className="text-[var(--cor-resposta-obrigatoria)]">*</span></label>
        <input id="confirmar-senha" type="password" className="input-padrao" placeholder="Confirme aqui a sua senha" autoComplete="new-password" value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} aria-invalid={!!erros.confirmarSenha} aria-describedby={erros.confirmarSenha ? "cadastro-erro" : undefined} onBlur={() => marcarComoTocado("confirmarSenha")}/>
      </div>
      {erros.confirmarSenha && tocados.confirmarSenha && <p id="cadastro-erro" className="text-[var(--cor-resposta-obrigatoria)] text-sm">{erros.confirmarSenha}</p>}

      <Botao tipo="submit" variante="confirmar" desabilitado={carregando}>
        {carregando ? "Enviando..." : "Cadastrar"}
      </Botao>

    </form>
  );
}

export default FormCadastroBase;