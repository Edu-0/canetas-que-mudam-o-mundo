import { BrowserRouter, Routes, Route } from "react-router-dom";
import Inicio from "./pages/Inicio";
import Cadastro from "./pages/Cadastro";
//import Logar from "./pages/Logar"; // descomentar quando Logar estiver pronta
import Conta from "./pages/Conta";
// import CadastroDoador from "./pages/CadastroDoador"; // descomentar quando CadastroDoador estiver pronta

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Inicio />} />
        {/* <Route path="/logar" element={<Logar />} /> */} {/* descomentar quando Logar estiver pronta */}
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/conta" element={<Conta />} />
        {/* <Route path="/cadastro/doador" element={<CadastroDoador />} /> */} {/* descomentar quando CadastroDoador estiver pronta */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;