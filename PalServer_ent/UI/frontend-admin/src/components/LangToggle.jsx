import { useLang } from "../context/LangContext";

export default function LangToggle() {
  const { lang, toggleLang } = useLang();

  return (
    <button
      onClick={toggleLang}
      className="px-3 py-1 rounded text-sm font-bold shadow-sm transition-colors duration-200 bg-white hover:bg-gray-100 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white">
      {lang === "ko" ? "ENG" : "KOR"}
    </button>
  );
}
