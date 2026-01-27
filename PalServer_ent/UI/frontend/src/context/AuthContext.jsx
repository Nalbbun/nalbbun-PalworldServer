// frontend/src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import api from "../utils/api";
import { useNavigate } from "react-router-dom";


const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate(); 

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const safeGet = (key) => localStorage.getItem(key) || null;

  const [accessToken, setAccessToken] = useState(
    localStorage.getItem("accessToken")
  ); 

  useEffect(() => {
    //새로고침 시 로컬스토리지에서 복원
    const token = localStorage.getItem("accessToken");
    const role = localStorage.getItem("userRole");
    const name = localStorage.getItem("userName");

    if (token && role) {
      setUser({ username: name, role: role });
    }
    setLoading(false);
  }, []);
  
  //  
  const login = async (username, password) => {
    // 1. API 요청
    const res = await api.post("/auth/login", { username, password });

    // 2. 응답 데이터 저장 (Role 포함)
    const { access_token, refresh_token, role } = res;
    
    localStorage.setItem("accessToken", access_token);
    localStorage.setItem("refreshToken", refresh_token);
    localStorage.setItem("userRole", role); 
    localStorage.setItem("userName", username);

    // 3. 상태 업데이트
    const userData = { username, role: role};
    setUser(userData);
     
    return userData;
  };

	const logout = () => {
	  console.log("[AUTH] logout");

	  if (window.__ACTIVE_WS__) {
		import("../utils/ws").then(({ safeCloseWS }) => {
		  safeCloseWS(window.__ACTIVE_WS__);
		  window.__ACTIVE_WS__ = null;
		});
	  }

	  localStorage.clear();
	  setAccessToken(null);
	  navigate("/login", { replace: true });
	};
	
  return (
<AuthContext.Provider
      value={{
        user,
        login,
        logout,
        loading,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);