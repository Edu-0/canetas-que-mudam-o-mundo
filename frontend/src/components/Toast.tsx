type ToastProps = {
  mensagem: string;
  tipo?: "sucesso" | "erro";
};

function Toast({ mensagem, tipo = "sucesso" }: ToastProps) {
  if (!mensagem) return null;

  return (
    <div role={tipo === "erro" ? "alert" : "status"} aria-live={tipo === "erro" ? "assertive" : "polite"} aria-atomic="true" aria-relevant="additions text" className={`fixed top-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg text-white text-sm z-50 animate-fade-in
    ${tipo === "sucesso" ? "bg-[var(--cor-resposta-correta)]" : "bg-[var(--cor-resposta-errada)]"}`}>
      {mensagem}
    </div>
  );
}

export default Toast;