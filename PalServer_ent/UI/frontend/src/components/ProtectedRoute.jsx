// frontend/src/components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LangContext";

export default function ProtectedRoute({ children }) {
  const { loading } = useAuth(); 
  const { t } = useLang();
 const token = localStorage.getItem("accessToken");
//console.log("[PROTECTED]", { loading, token }); 
  if (loading) {
    return (
      <div className="text-white text-center p-10 text-2xl animate-pulse">
        {t("msgLoading")}...
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}