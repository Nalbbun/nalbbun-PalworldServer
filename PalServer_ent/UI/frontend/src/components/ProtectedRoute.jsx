// frontend/src/components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LangContext";

export default function ProtectedRoute({ allowedRoles, children }) {
  const { user, loading } = useAuth(); 
  const { t } = useLang();

  // 1. 로딩 중일 때
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900 text-white text-2xl animate-pulse">
        {t("msgLoading")}...
      </div>
    );
  }

  // 2. 로그인하지 않은 경우
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. 권한 체크 (Admin이 Operator 페이지 접근 시 등)
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    alert(t("msgUnAthorized"));
    return <Navigate to="/login" replace />;
  }

  // 4. 통과
  return children ? children : <Outlet />;
}