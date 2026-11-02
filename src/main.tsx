import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import SettingsFlyout from "./SettingsFlyout";
import "./App.css";

const isSettings = window.location.search.includes("window=settings");

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    {isSettings ? <SettingsFlyout /> : <App />}
  </React.StrictMode>,
);
