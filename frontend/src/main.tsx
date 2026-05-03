import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { ProvedorUsuario } from "./context/UserContext";
import { ProvedorONG } from "./context/OngContext";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ProvedorUsuario>
      <ProvedorONG>
        <App />
      </ProvedorONG>
    </ProvedorUsuario>
  </React.StrictMode>
);