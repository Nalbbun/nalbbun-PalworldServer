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

    setChecking(true);
    try {
      const res = await api.get(`/instance/exists/${name}`);
      setExists(res.exists);
      setChecked(true);

      if (res.exists) {
        const ok = window.confirm(
          t("msgOverwriteConfirm")
        );
        setOverwrite(ok);
      } else {
        setOverwrite(false);
      }
    } finally {
      setChecking(false);
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

    const chk = await api.get(`/instance/exists/${name}`);
    let overwrite = false; 

    if (!name || !port|| !version|| !query) 
		return alert(`{t("msginsCreatInfo")}`);

    await api.post("/instance/create", { name, port , query , version, overwrite });
    onCreated();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
      <div className="bg-gray-800 p-6 rounded w-96">
        <h2 className="text-xl font-bold mb-4">{t("labCreateIns")}</h2>

        <input
          className="w-full mb-3 p-2 rounded bg-gray-700"
          placeholder={t("labinstanceName")}
          value={name}
          onChange={(e) => {setName(e.target.value); resetCheck();}}
        />
        <button
          onClick={checkDuplicate}
          disabled={!name || checking}
          className="w-full mb-3 px-3 py-2 bg-yellow-600 rounded hover:bg-yellow-500 disabled:opacity-50"
        >{checking ?  t("msgConnectingDuplicate") : t("btnduplicateCheck")}
        </button>        
        {/* 중복 결과 표시 */}
        {checked && !exists && (
          <p className="text-green-400 text-sm mb-2">
            {t("msgNameAvailable")}
          </p>
        )}

        {checked && exists && overwrite && (
          <p className="text-yellow-400 text-sm mb-2">
            {t("msgOverwriteInstance")}
          </p>
        )}

        {checked && exists && !overwrite && (
          <p className="text-red-400 text-sm mb-2">
            {t("msgNameExists")}
          </p>
        )}
        <input
          className="w-full mb-3 p-2 rounded bg-gray-700"
          placeholder={t("labPorts")}
          value={port}
          onChange={(e) => setPort(e.target.value)}
        />
        <input
          className="w-full mb-3 p-2 rounded bg-gray-700"
          placeholder={t("labQuery")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        /> 
        <select
          className="w-full mb-4 p-2 rounded bg-gray-700"
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
          <button onClick={onClose} className="px-3 py-1 bg-gray-600 rounded">
            {t("btnCancel")}
          </button>
          <button onClick={create} disabled={!checked} className={`px-3 py-1 rounded ${ checked
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