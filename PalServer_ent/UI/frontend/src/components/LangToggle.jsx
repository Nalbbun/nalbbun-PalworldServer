import { useLang } from "../context/LangContext";

export default function LangToggle() {
  const { lang, toggleLang } = useLang();

  return (
    <button
      onClick={toggleLang}
      className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 text-sm"
    >
      {lang === "ko" ? "ENG" : "KOR"}
    </button>
  );
}
