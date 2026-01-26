import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <button
      onClick={toggleTheme}
      className="px-3 py-2 bg-purple-600 rounded hover:bg-purple-500 text-white font-bold transition flex items-center gap-2"
      title="Toggle Theme"
    >
      {theme === "dark" ? (
        <>
          <span>🌞</span> {/* 또는 "Light" */}
        </>
      ) : (
        <>
          <span>🌙</span> {/* 또는 "Dark" */}
        </>
      )}
    </button>
  );
}