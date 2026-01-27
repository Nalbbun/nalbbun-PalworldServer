import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useLang } from "../../context/LangContext";
import { isDangerOption } from "../../utils/isDangerOption";
import { detectType } from "../../utils/valueType"; 
import LoadingOverlay from "../../components/LoadingOverlay";
import api from "../../utils/api";
import Tooltip from "../../components/Tooltip";

export default function Config() {
  const { instance } = useParams();
  const navigate = useNavigate();

  const [options, setOptions] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isDefault, setIsDefault] = useState(false);
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
      navigate("/", { replace: true });
    } finally {
      setLoading(false);
    }
  };

  // [스타일 공통 클래스]
  // 입력 필드: 라이트(흰색+테두리) / 다크(어두운회색+테두리)
  const inputClass = "w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors";

  return (
    // [수정] 배경: 라이트(gray-100) / 다크(gray-900)
    <div className="p-8 min-h-screen bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-white transition-colors duration-200">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
          <span className="text-blue-600 dark:text-blue-400">{instance}</span> : {t("labConfig")}
        </h1> 
      </div>

      <button
        className="mb-6 px-4 py-2 rounded shadow-sm bg-white hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-bold transition-colors"
        onClick={() => navigate("/operator")}
      >
        ← {t("btndashboard")}
      </button>

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
          return (
            <div key={k} className="flex flex-col gap-1">
              <label className="flex items-center gap-2 text-sm font-medium mb-1">
                <span className={danger ? "text-red-600 dark:text-red-400 font-bold" : "text-gray-700 dark:text-gray-300"}>
                  {k}
                </span>

                {danger && (
                  <span className="text-xs bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-100 px-2 py-0.5 rounded border border-red-200 dark:border-red-700 font-bold">
                    DANGER
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
                  className={inputClass}
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
                  className={inputClass}
                  value={v}
                  onChange={(e) =>
                    setOptions({ ...options, [k]: e.target.value })
                  }
                />
              )}

              {/* STRING */}
              {type === "string" && (
                <input
                  type="text"
                  className={inputClass}
                  // value={String(v).replace(/^"|"$/g, "")}
                  value={String(v)}
                  onChange={(e) =>
                    setOptions({ ...options, [k]: e.target.value })
                  }
                />
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