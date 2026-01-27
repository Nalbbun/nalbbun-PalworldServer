import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLang } from "../../context/LangContext";
import LangToggle from "../../components/LangToggle";
import { useNavigate } from "react-router-dom"; 

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const { t } = useLang();

  const submit = async (e) => {
    e.preventDefault();
    try {      
      const user = await login(id, pw);  

      if (user.role === "operator") {
        navigate("/operator", { replace: true });
      } else {
        navigate("/admin", { replace: true });
      }

    } catch {
      setError(t("msgloginError"));
    }
  };
  //   ID 입력 핸들러: 영문과 숫자만 허용
  const handleIdChange = (e) => {
    const val = e.target.value;
    // 정규식: A-Z, a-z, 0-9 , _-가 아닌 문자는 모두 제거
    const onlyEngNum = val.replace(/[^A-Za-z0-9_-]/g, "")
    setId(onlyEngNum);
  };
  return (
   <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-[#0e0f11] transition-colors duration-300">
      <div className="bg-white dark:bg-[#1b1c1f]/80 p-10 rounded-xl shadow-2xl w-96 backdrop-blur transition-colors duration-300 border border-gray-200 dark:border-gray-800">
        <h1 className="text-center text-2xl mb-6 font-bold text-gray-900 dark:text-white">
          {t("tlLogin")}
        </h1>
        {error && <div className="text-red-500 text-sm mb-3 font-medium text-center">{error}</div>}

        <form onSubmit={submit} className="space-y-4">
          <input
            type="text"
            placeholder={t("labid")}
            className="w-full p-3 rounded bg-gray-50 dark:bg-[#2a2b2e] border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            value={id}
            onChange={handleIdChange}
          />
          <input
            type="password"
            placeholder={t("labpassword")}
            className="w-full p-3 rounded bg-gray-50 dark:bg-[#2a2b2e] border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
          />

          <button 
            type="submit"
            className="w-full p-3 bg-blue-600 hover:bg-blue-700 text-white rounded mt-4 font-bold transition shadow-md"
          >
            {t("btnlogin")}
          </button>
        </form>
      </div>
        <div className="absolute top-5 right-5">
            <LangToggle /> 
        </div>
    </div>
  );
}
