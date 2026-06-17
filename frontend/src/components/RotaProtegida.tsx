import { Navigate, Outlet } from "react-router-dom";
import { useUsuario, TipoUsuario } from "../context/UserContext";

interface Props {
  permissoes: TipoUsuario[];
}

export default function RotaProtegida({ permissoes }: Props) {
  const { usuario } = useUsuario();

  if (!usuario) {
    return <Navigate to="/logar" replace />;
  }

  // verifica se o usuário tem pelo menos um dos tipos necessários para acessar a rota
  const temPermissao = usuario.tipos?.some((tipo) =>
    permissoes.includes(tipo)
  );

  if (!temPermissao) {
    // mensagem de erro para o usuário
    localStorage.setItem("toast", JSON.stringify({
      mensagem: "Você não tem permissão de acessar essa página!",
      tipo: "erro"
    }));
    
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}