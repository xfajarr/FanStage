import { createRoot } from "react-dom/client";
import {PrivyProvider} from '@privy-io/react-auth';
import React from 'react';
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
     <React.StrictMode>
    <PrivyProvider
      appId={import.meta.env.VITE_PRIVY_APP_ID || "cmgv5dwz100pyjv0cf8x2n0xc"}
      config={{
        loginMethods: ["wallet", "email", "twitter", "google"],
        appearance: {
          theme: 'light',
          accentColor: '#676FFF'
        }
      }}
    >
      <App />
    </PrivyProvider>
  </React.StrictMode>
);
