import { BrowserRouter, Routes, Route } from "react-router-dom";
import Inicio from "./pages/Inicio";
import Cadastro from "./pages/Cadastro";
import Logar from "./pages/Logar";
import Conta from "./pages/Conta";
import EditarConta from "./pages/EditarConta";
import CadastroBeneficiario from "./pages/CadastroBeneficiario";
import Doar from "./pages/Doar";
import QuizVoluntario from "./pages/QuizVoluntario";
import Triagem from "./pages/Triagem";
import Pedido from "./pages/PedidoMaterial";
import Relatorio from "./pages/Relatorio";
import Auditoria from "./pages/AuditoriaVoluntario";
import Pontos from "./pages/Pontos";
import EditarRendaFamiliares from "./pages/EditarRendaFamiliares";
import TrocarSenha from "./pages/TrocarSenha";
import ConfirmarFamiliares from "./pages/ConfirmarCadastroFamilia";
import CadastroResponsavel from "./pages/CadastroResponsavel";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/logar" element={<Logar />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/conta" element={<Conta />} />
        <Route path="/conta/editar" element={<EditarConta />} />
        <Route path="/conta/cadastro-responsavel" element={<CadastroResponsavel />} />
        <Route path="/conta/cadastro-beneficiario" element={<CadastroBeneficiario />} />
        <Route path="/doar" element={<Doar />} />
        <Route path="/conta/quiz-voluntario" element={<QuizVoluntario />} />
        <Route path="/triagem" element={<Triagem />} />
        <Route path="/pedido" element={<Pedido />} />
        <Route path="/relatorio" element={<Relatorio />} />
        <Route path="/auditoria" element={<Auditoria />} />
        <Route path="/pontos" element={<Pontos />} />
        <Route path="/conta/editar-renda-e-familiares" element={<EditarRendaFamiliares />} />
        <Route path="/trocar-senha" element={<TrocarSenha/>} />
        <Route path="/confirmar-familiares" element={<ConfirmarFamiliares />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;