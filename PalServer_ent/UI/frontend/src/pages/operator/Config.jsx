import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useLang } from "../../context/LangContext";
import { isDangerOption } from "../../utils/isDangerOption";
import { detectType } from "../../utils/valueType"; 
import LoadingOverlay from "../../components/LoadingOverlay";
import api from "../../utils/api";
import Tooltip from "../../components/Tooltip";

// 눈 아이콘 컴포넌트 (SVG)
const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
);

const EyeSlashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
  </svg>
);

export default function Config() {
  const { instance } = useParams();
  const navigate = useNavigate();

  const [options, setOptions] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [showPw, setShowPw] = useState({});
  const { t, tip } = useLang();

  useEffect(() => {
    api.get(`/config/${instance}`)
      .then((res) => {
        const { options, isDefault } = res;
        setOptions(options || {});
        setIsDefault(isDefault === true);
      })
      .catch((err) => {
        console.error("Config load failed", err);
      });
  }, [instance]);

  /* ==================== LOAD ==================== */
  const loadInstances = async () => {
    api.get(`/config/${instance}`).then((res) => {
      const { options, isDefault } = res;
      setOptions(options || {});
      setIsDefault(isDefault === true);
    })
      .catch((err) => {
        console.error("Config load failed", err);
      });
  };

  const save = async () => {
    if (isDefault) {
      const ok = window.confirm(t("msgConfirmConfSave"));
      if (!ok) return;
    }

    try {
      setLoading(true);
      await api.post(`/config/${instance}`, { options });
      alert(t("msgConfSaved"));
      loadInstances();
    } finally {
      setLoading(false);
    }
  };

  const apply = async () => {
    if (!window.confirm(t("msgConfirmApplyCof"))) {
      return;
    }
    try {
      setLoading(true);
      await api.post(`/config/apply/${instance}`);
      alert(t("msgServerRestarted"));
      navigate("/operator", { replace: true });
    } finally {
      setLoading(false);
    }
  };
  // 토글 핸들러
  const togglePw = (key) => {
    setShowPw((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // 키 이름으로 비밀번호 필드인지 확인
  const isPasswordField = (key) => {
    const k = key.toLowerCase();
    return k.includes("password") || k.includes("pwd") || k.includes("secret") || k.includes("token");
  }; 

  // [스타일 공통 클래스]
  // 기본 스타일
  const baseInputClass = "w-full p-2 rounded border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors";
  
  // 활성/비활성 상태에 따른 스타일 분기
  const getInputClass = (isDisabled) => {
      if (isDisabled) {
          // 비활성: 회색 배경, 커서 금지, 투명도 조절
          return `${baseInputClass} bg-gray-200 dark:bg-gray-700 cursor-not-allowed opacity-60`;
      }
      // 활성: 흰색/검은색 배경
      return `${baseInputClass} bg-white dark:bg-gray-800`;
  };

  return (
    // 배경: 라이트(gray-100) / 다크(gray-900)
    <div className="p-8 min-h-screen bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-white transition-colors duration-200">
      <button
        className="mb-6 px-4 py-2 rounded shadow-sm bg-white hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-bold transition-colors"
        onClick={() => navigate("/operator")}
      >
      {t("btndashboard")}
      </button>      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
          <span className="text-blue-600 dark:text-blue-400">{instance}</span> : {t("labConfig")}
        </h1> 
      </div> 

      {/* 기본 설정 로드 경고창: 노란색 계열 */}
      {isDefault && (
        <div className="mb-6 p-4 rounded text-sm font-semibold bg-yellow-100 text-yellow-800 border border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-200 dark:border-yellow-700">
          ⚠️ {t("msgDefalutConfLoaded")}
        </div>
      )}

      {/* 설정 폼 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 transition-colors">
        {Object.entries(options).map(([k, v]) => {
          const type = detectType(v);
          const danger = isDangerOption(k);
          const isPw = isPasswordField(k);
          return (
            <div key={k} className="flex flex-col gap-1">
                <label className="flex items-center gap-2 text-sm font-medium mb-1">
                {/* 비활성화된 항목은 라벨도 약간 흐리게 처리 */}
                <span className={danger ? "text-gray-500 dark:text-gray-500" : "text-gray-700 dark:text-gray-300"}>
                  {k}
                </span>

                {danger && (
                  <span className="text-xs bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-100 px-2 py-0.5 rounded border border-red-200 dark:border-red-700 font-bold">
                    {t("labDanger")}
                  </span>
                )}
                <Tooltip
                  text={tip(k)}
                  danger={danger}
                />
              </label>

              {/* BOOLEAN */}
              {type === "boolean" && (
                <select
                  disabled={danger}
                  className={getInputClass(danger)}
                  value={v}
                  onChange={(e) =>
                    setOptions({ ...options, [k]: e.target.value })
                  }
                >
                  <option value="True">True</option>
                  <option value="False">False</option>
                </select>
              )}

              {/* NUMBER */}
              {type === "number" && (
                <input
                  type="number"
                  disabled={danger}
                  className={getInputClass(danger)}
                  value={v}
                  onChange={(e) =>
                    setOptions({ ...options, [k]: e.target.value })
                  }
                />
              )}

              {/* STRING */}
              {type === "string" && (
                <div className="relative">
                  {/* 비밀번호 필드 여부에 따라 input type 결정 */}
                  <input
                    type={isPw && !showPw[k] ? "password" : "text"} 
                    className={`${getInputClass(danger)} ${isPw ? "pr-10" : ""}`} // 아이콘 공간 확보
                    value={String(v)}
                    autoComplete={isPw ? "new-password" : "off"}
                    name={k} // 랜덤한 이름보다 명시적 이름이 낫지만 autocomplete가 중요함
                    onChange={(e) =>
                      setOptions({ ...options, [k]: e.target.value })
                    }
                  />
                  
                  {/* 비밀번호 필드일 경우에만 눈 아이콘 표시 */}
                  {isPw && (
                    <button
                      type="button"
                      onClick={() => togglePw(k)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
                    >
                      {showPw[k] ? <EyeSlashIcon /> : <EyeIcon />}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex gap-4 border-t border-gray-200 dark:border-gray-700 pt-6">
        <button 
          onClick={save} 
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold shadow-md transition transform active:scale-95"
        >
          {t("btnsave")}
        </button>
        <button 
          onClick={apply} 
          className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded font-bold shadow-md transition transform active:scale-95"
        >
          {t("btnapply")}
        </button>
      </div>

      <LoadingOverlay
        show={loading}
        message={message} />

    </div>
  );
}