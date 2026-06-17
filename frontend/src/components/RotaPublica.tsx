import { Navigate, Outlet } from "react-router-dom";
import { useUsuario } from "../context/UserContext";

export default function RotaPublica() {
  const { usuario } = useUsuario();

  // se já está logado, bloqueia
  if (usuario) {
    return <Navigate to="/conta" replace />;
  }

  return <Outlet />;
}