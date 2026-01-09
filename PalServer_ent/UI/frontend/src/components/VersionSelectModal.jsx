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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
      <div className="bg-gray-800 p-6 rounded w-96">
        <h2 className="text-xl font-bold mb-2">{t("labLatestUp")}</h2>

        {/* 현재 설치 버전 표시 */}
        {target && (
          <div className="text-sm text-gray-400 mb-3">
            {t("labinstanceName")} : <b className="text-white">{target}</b><br />
            {t("labCurrentVersion")} :{" "}
            <b className="text-green-400">{currentVersion}</b>
          </div>
        )}

        <select
          className="w-full mb-4 p-2 rounded bg-gray-700"
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
          <button onClick={onClose} className="px-3 py-1 bg-gray-600 rounded">
            {t("btnCancel")}
          </button>
          <button
            onClick={() => onSubmit({ version, mode, target })}
            className="px-3 py-1 bg-green-600 rounded"
          >
            {t("btnOK")}
          </button>
        </div>
      </div>
    </div>
  );
}