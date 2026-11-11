import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import * as Tooltip from "@radix-ui/react-tooltip";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-sans/600.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "./index.css";
import App from "./App";
import { DataProvider } from "./context/DataContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HashRouter>
      <Tooltip.Provider delayDuration={150}>
        <DataProvider>
          <App />
        </DataProvider>
      </Tooltip.Provider>
    </HashRouter>
  </React.StrictMode>,
);
