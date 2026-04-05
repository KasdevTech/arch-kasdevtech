import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { ArchitectureStoreProvider } from "./context/ArchitectureStore";
import { ThemeProvider } from "./context/ThemeContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <ArchitectureStoreProvider>
          <App />
        </ArchitectureStoreProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
