import { useState, useEffect } from "react";
import api from "../utils/api";
import { useLang } from "../context/LangContext";

export default function InstanceCreateModal({ open, onClose, onCreated }) {
  const defaultVersion = "latest";    
  const [name, setName] = useState("");
  const [port, setPort] = useState("");
  const [query, setQuery] = useState("");
  const [version, setVersion] = useState(defaultVersion);
  const [versions, setVersions] = useState([]);

  const [checked, setChecked] = useState(false); 
  const [exists, setExists] = useState(false);     
  const [overwrite, setOverwrite] = useState(false);
  const [checking, setChecking] = useState(false);

  const { t } = useLang();

  useEffect(() => {
    if (!open) return;

    api.get("/instance/selectversions").then((res) => {
      setVersions(res.versions || []);
    });
  }, [open]);
  
  if (!open) return null;
  
  const resetCheck = () => {
    setChecked(false);
    setExists(false);
    setOverwrite(false);
  };

  const checkDuplicate = async () => {
    if (!name) {
      alert(t("labinstanceName"));
      return;
    }

    try {
      setChecking(true);
      const res = await api.get(`/instance/exists/${name}`);
      
      const isExist = res.exists;
      setExists(isExist);
      setChecked(true); 

      if (isExist) {
        const ok = window.confirm(
          t("msgOverwriteConfirm")
        );
        setOverwrite(ok);
      } else {
        setOverwrite(false);
      }
    } catch (e) {
      console.error(e); 
      setChecked(false);
    } finally {
      setChecking(false); // 로딩 끝
    }
  };

  const create = async () => {
    
    if (!checked) {
      alert(t("msgDuplicateCheckFirst"));
      return;
    }

    if (exists && !overwrite) {
      alert(t("msgNoOverwrite"));
      return;
    } 
     if (!name || !port || !version || !query) 
      return alert(t("msginsCreatInfo"));  

    try {
      // [수정] state에 있는 overwrite 값을 전송
      await api.post("/instance/create", { name, port, query, version, overwrite });
      onCreated();
      onClose();
    } catch (e) {
      alert("Create failed: " + e.message);
    } 
  }; 

  const inputClass = "w-full mb-3 p-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors";

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-2xl w-96 transition-colors duration-200">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">{t("labCreateIns")}</h2>

        <input
          className={inputClass}
          placeholder={t("labinstanceName")}
          value={name}
          onChange={(e) => {setName(e.target.value); resetCheck();}}
        />
        <button
          onClick={checkDuplicate}
          disabled={!name || checking}
          className="w-full mb-3 px-3 py-2 bg-yellow-500 hover:bg-yellow-400 text-white font-bold rounded disabled:opacity-50 transition shadow-sm"
        > 
         {checking ?  t("msgConnectingDuplicate") : t("btnduplicateCheck")}
        </button>    
          {/* 결과 메시지 영역 */}
        <div className="mb-4 min-h-[20px]">
          {checked && !exists && (
            <p className="text-green-600 dark:text-green-400 text-sm font-medium">
              {t("msgNameAvailable")}
            </p>
          )}
          {checked && exists && overwrite && (
            <p className="text-yellow-600 dark:text-yellow-400 text-sm font-medium">
              {t("msgOverwriteInstance")}
            </p>
          )}
          {checked && exists && !overwrite && (
            <p className="text-red-600 dark:text-red-400 text-sm font-medium">
              {t("msgNameExists")}
            </p>
          )}
        </div>

        <input
          className={inputClass}
          placeholder={t("labPorts")}
          value={port}
          onChange={(e) => setPort(e.target.value)}
        />
        <input
          className={inputClass}
          placeholder={t("labQuery")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        /> 
        <select
          className={inputClass}
          value={version}
          onChange={(e) => setVersion(e.target.value)}
        >
          {versions.map((v) => (
            <option key={v} value={v}>
              {v === "latest" ? "latest" : v}
            </option>
          ))}
        </select>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-white rounded transition">
            {t("btnCancel")}
          </button>
          <button onClick={create} disabled={!checked} className={`px-4 py-2 rounded text-white font-bold transition shadow
           ${ checked
                ? "bg-green-600 hover:bg-green-500"
                : "bg-gray-600 cursor-not-allowed"
            }`}
          > {t("btnCreate")}
          </button>
        </div>
      </div>
    </div>
  );
}