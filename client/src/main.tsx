import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Prevent overscroll behavior for mobile
document.body.style.overscrollBehavior = "none";

createRoot(document.getElementById("root")!).render(<App />);
