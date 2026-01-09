import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="px-3 py-2 bg-purple-600 rounded hover:bg-purple-500"
    >
      {theme === "dark" ? "" : ""}
    </button>
  );
}