import { useState, useEffect } from "react";
import api from "../utils/api";
import { useLang } from "../context/LangContext";

export default function VersionSelectModal({
  open,
  mode,
  target,          
  currentVersion,   
  onSubmit,
  onClose,
}) {
  const [versions, setVersions] = useState([]);
  const [version, setVersion] = useState(currentVersion || "latest");
  const { t } = useLang();

  useEffect(() => {
	  
    if (!open) return; 
	setVersion(currentVersion || "latest");
	
    api.get("/instance/selectversions").then((res) => { setVersions(res.versions || []);
	
    });
  }, [open, currentVersion]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm"> 
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-2xl w-96 transition-colors duration-200">
        <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
          {t("labLatestUp")}
        </h2>

        {/* 현재 설치 버전 표시 */}
        {target && (
          <div className="text-sm text-gray-400 mb-3">
            {t("labinstanceName")} : <b className="text-gray-900 dark:text-white">{target}</b><br />
            {t("labCurrentVersion")} :{" "}
            <b className="text-green-600 dark:text-green-400">{currentVersion}</b>
          </div>
        )}

        <select
          className="w-full mb-4 p-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-green-500 transition-colors"
          value={version}
          onChange={(e) => setVersion(e.target.value)}
        >
          {versions.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-white rounded transition"
          >
            {t("btnCancel")}
          </button>
          <button
            onClick={() => onSubmit({ version, mode, target })}
             className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white rounded transition shadow-sm"
          >
            {t("btnOK")}
          </button>
        </div>
      </div>
    </div>
  );
}