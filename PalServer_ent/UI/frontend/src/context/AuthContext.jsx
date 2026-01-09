// frontend/src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import api from "../utils/api";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  const safeGet = (key) => localStorage.getItem(key) || null;

  const [accessToken, setAccessToken] = useState(
    localStorage.getItem("accessToken")
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);
  
  //  
  const login = async (username, password) => {
//    console.log("[AUTH][LOGIN] try", username);

    const res = await api.post("/auth/login", { username, password });

//    console.log("[AUTH][LOGIN][OK]", res); 

    localStorage.setItem("accessToken", res.access_token);
    localStorage.setItem("refreshToken", res.refresh_token);

//    console.log("[AUTH][access_token][OK]", localStorage.getItem("accessToken") ); 
	
    setAccessToken(res.access_token);
    setLoading(false);

    navigate("/", { replace: true });
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
        accessToken,
        setAccessToken,
        login,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);