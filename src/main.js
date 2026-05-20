import { createRoot } from "https://esm.sh/react-dom@18.3.1/client";
import { React } from "./lib.js";
import { App } from "./app.js";

const rootElement = document.getElementById("root");
createRoot(rootElement).render(React.createElement(App));
