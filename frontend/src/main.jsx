import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import App from "@/App.jsx";
import "@/index.css";
const isDev = process.env.NODE_ENV !== "production";
const REACTWRAP = isDev ? React.Fragment : React.StrictMode;
const basename = import.meta.env.VITE_BASE || "/";


console.log("🚀 React démarré avec base : ", import.meta.env.VITE_API_BASE);


ReactDOM.createRoot(document.getElementById("root")).render(
  <REACTWRAP>
    <Router basename={basename}>
      <App />
    </Router>
  </REACTWRAP>
);
