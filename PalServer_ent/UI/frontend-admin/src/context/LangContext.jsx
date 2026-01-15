import { createContext, useContext, useState } from "react";
import { languages } from "../lang";
import { tips } from "../lang/tips";

const LangContext = createContext();

export function LangProvider({ children }) {
  const [lang, setLang] = useState("ko");

  const t = (key) => languages[lang][key] || key;
  const tip = (key) => tips[lang]?.[key] || "";

  const toggleLang = () => {
    setLang((prev) => (prev === "ko" ? "en" : "ko"));
  };

  return (
    <LangContext.Provider value={{ lang, t, tip,toggleLang }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}