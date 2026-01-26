import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LangContext";
import LangToggle from "../components/LangToggle";

export default function Login() {
  const { login } = useAuth();
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const { t } = useLang();

  const submit = async (e) => {
    e.preventDefault();
    try {
      await login(id, pw);
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
    <div className="min-h-screen flex items-center justify-center bg-[#0e0f11]">
        <LangToggle /> 
      <div className="bg-[#1b1c1f]/80 p-10 rounded-xl shadow-xl w-96 backdrop-blur">
        <h1 className="text-center text-2xl text-white mb-6 font-bold">
          {t("tlLogin")}
        </h1>
        {error && <div className="text-red-400 mb-3">{error}</div>}

        <form onSubmit={submit} className="space-y-4">
          <input
            type="text"
            placeholder={t("labid")}
            className="w-full p-3 rounded bg-[#2a2b2e] text-white"
            value={id}
            onChange={handleIdChange}
          />
          <input
            type="password"
            placeholder={t("labpassword")}
            className="w-full p-3 rounded bg-[#2a2b2e] text-white"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
          />

          <button 
            type="submit"
            className="w-full p-3 bg-blue-600 hover:bg-blue-700 text-white rounded mt-2"
          >
            {t("btnlogin")}
          </button>
        </form>
      </div>
    </div>
  );
}
