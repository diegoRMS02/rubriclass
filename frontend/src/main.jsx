import React from "react";
import ReactDOM from "react-dom/client";
// 1. Importamos el enrutador
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "react-datepicker/dist/react-datepicker.css";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* 2. Envolvemos la App para que funcionen las rutas */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
