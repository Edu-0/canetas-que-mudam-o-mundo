import { Navigate, Outlet, useLocation  } from "react-router-dom";
import { useUsuario } from "../context/UserContext";

export default function RotaPublica() {
  const { usuario, acabouDeAutenticar, setAcabouDeAutenticar } = useUsuario();
  const location = useLocation();
  const jaTemToast = location.state?.toast;

  const redirectInterno = location.state?.redirectInterno;

  if (acabouDeAutenticar) {
    return <Outlet />;
  }

  // se já está logado, bloqueia
  if (usuario) {
    if (redirectInterno) {
      return <Outlet />;
    }

    if (location.state?.veioDoCadastro) {
      return <Navigate to="/conta" replace state={location.state} />;
    } else {
      return (
        <Navigate 
          to="/conta" 
          replace 
          state={
            jaTemToast
              ? location.state // mantém o toast que já veio (ex: cadastro)
              : {
                  toast: {
                    mensagem: "Você não tem permissão de acessar essa página, pois já está logado!",
                    tipo: "erro"
                  }
                }
          }
        />
      );
    }
  }

  return <Outlet />;
}