import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthProvider";
import { ClubsProvider } from "./contexts/ClubsProvider";
import { App } from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ClubsProvider>
          <App />
        </ClubsProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
