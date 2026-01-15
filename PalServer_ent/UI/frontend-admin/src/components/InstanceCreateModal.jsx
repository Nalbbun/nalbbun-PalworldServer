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
  const [isEditing, setIsEditing] = useState(false);
  const { t } = useLang();

  
  useEffect(() => {
    if (!open) return;

    api.get("/instance/selectversions").then((res) => {
      setVersions(res.versions || []);
    });
  }, [open]);
  
  if (!open) return null;
  
  const create = async () => {
    if (!name || !port|| !version|| !query) 
		return alert(`{t("msginsCreatInfo")}`);
	
    await api.post("/instance/create", { name, port , query , version });
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
          onChange={(e) => setName(e.target.value)}
        />
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
          <button onClick={create} className="px-3 py-1 bg-green-600 rounded">
            {t("btnCreate")}
          </button>
        </div>
      </div>
    </div>
  );
}