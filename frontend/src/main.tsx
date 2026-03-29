import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { ArchitectureStoreProvider } from "./context/ArchitectureStore";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ArchitectureStoreProvider>
        <App />
      </ArchitectureStoreProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
