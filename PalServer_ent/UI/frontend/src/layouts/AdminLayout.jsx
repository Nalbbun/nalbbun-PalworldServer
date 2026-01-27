import { Outlet, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LangContext";
import ThemeToggle from "../components/ThemeToggle";
import LangToggle from "../components/LangToggle";

export default function AdminLayout() {
  const { logout, user } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-200 flex flex-col">
      {/* === Admin Header === */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo / Title */}
          <div className="flex items-center gap-4">
            <Link to="/admin" className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 hover:opacity-80 transition">
              {t("tlAdminDashboard")}
            </Link>
            <span className="hidden md:inline-block px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border border-blue-200 dark:border-blue-700">
              {t("labAdmin")}
            </span>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
             {/* 유저 이름 표시 */}
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
              className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-500 rounded shadow-sm transition-transform active:scale-95"
            >
              {t("btnlogout") || "Logout"}
            </button>
          </div>
        </div>
      </header>

      {/* === Main Content Area === */}
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