import { Outlet, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LangContext";
import ThemeToggle from "../components/ThemeToggle";
import LangToggle from "../components/LangToggle";

export default function OperatorLayout() {
  const { logout, user } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-200 flex flex-col">
      {/* === Operator Header (Green/Teal Accent) === */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-teal-500/30 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-4">
            <Link to="/operator" className="text-2xl font-bold text-teal-600 dark:text-teal-400 hover:opacity-80 transition">
              {t("tlOperatorDashboard")}
            </Link>
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200 border border-teal-200 dark:border-teal-700">
              {t("labOperator")}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {user && (
              <span className="hidden md:block text-sm font-medium text-gray-500 dark:text-gray-400 mr-2">
                {t("msgWellcome")}, {user.username}
              </span>
            )}
            
            <LangToggle />
            <ThemeToggle />
            
            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1" />

            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-bold text-white bg-gray-600 hover:bg-gray-500 rounded shadow-sm transition-transform active:scale-95"
            >
              {t("btnlogout") || "Logout"}
            </button>
          </div>
        </div>
      </header>

      {/* === Main Content === */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
            {/* === Footer (Optional) === */}
      <footer className="border-t border-gray-200 dark:border-gray-800 py-6 mt-auto">
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          &copy; 2026 PalWorldServer Manager. All rights reserved.
        </div>
      </footer>
    </div>
  );
}