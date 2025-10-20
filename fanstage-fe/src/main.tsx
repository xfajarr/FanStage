import { createRoot } from "react-dom/client";
import {PrivyProvider} from '@privy-io/react-auth';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
     <React.StrictMode>
    <PrivyProvider
      appId="cmgv5dwz100pyjv0cf8x2n0xc"
      config={{
        loginMethods: ["wallet", "email", "twitter", "google"]
      }}
    >
      <App />
    </PrivyProvider>
  </React.StrictMode>
);
