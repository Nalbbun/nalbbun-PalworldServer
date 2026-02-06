// src/components/BanListModal.jsx
import { useEffect, useState } from "react";
import api from "../utils/api";
import { useLang } from "../context/LangContext";

export default function BanListModal({ instance, open, onClose }) {
  const [bans, setBans] = useState([]);
  const [loading, setLoading] = useState(false);
  const { t } = useLang();

  useEffect(() => {
    if (open) loadBans();
  }, [open, instance]);

  const loadBans = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/server/banlist/${instance}`);
      setBans(res || []);
    } catch (e) {
      console.error("Failed to load ban list", e);
    } finally {
      setLoading(false);
    }
  };

  const handleUnban = async (banInfo) => {
        const userid = prompt(t("msgEnterUnbanSteamID"));
    if (!userid) return; 
    if (!window.confirm(`${t("msgConfirmUnban")} :'${banInfo.name}' (${banInfo.userid})?`)) return;

    try {
      await api.post("/server/players/unban", {
        instance,
        userid: banInfo.userid,
        name: banInfo.name // DB 업데이트용 이름
      });
      
      alert(`✅ ${t("msgUnbanComplete")} ${banInfo.userid}`); 
      loadBans(); // 리스트 갱신
    } catch (e) { 
      alert("❌ " + t("msgUnbanFail") + ": " + (e.response?.data?.detail || e.message));
    }
  };
 
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-2xl w-[700px] border border-gray-200 dark:border-gray-700 flex flex-col max-h-[80vh]">
        <div className="flex justify-between items-center mb-4 border-b border-gray-200 dark:border-gray-700 pb-3">
          <h2 className="text-xl font-bold text-red-600 dark:text-red-400">
             🚫 {t("labBanPlayerList")}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white text-2xl">
            &times;
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="text-center py-8 text-gray-500">{t("msgProcessing")}...</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 uppercase font-bold sticky top-0">
                <tr>
                  <th className="p-3">{t("labplayers")}</th>
                  <th className="p-3">{t("labReason")}</th>
                  <th className="p-3">{t("labDate")}</th>
                  <th className="p-3 text-right">{t("labAction")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                {bans.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="p-3">
                      <div className="font-bold text-gray-900 dark:text-white">{b.name}</div>
                      <div className="text-xs text-gray-500 font-mono">{b.userid}</div>
                    </td>
                    <td className="p-3 text-gray-700 dark:text-gray-300">{b.reason}</td>
                    <td className="p-3 text-gray-500 text-xs">
                      {new Date(b.timestamp).toLocaleString()}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleUnban(b)}
                        className="px-3 py-1 bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 rounded font-bold transition text-xs border border-green-200 dark:border-green-800"
                      >
                        {t("labUnban")}
                      </button>
                    </td>
                  </tr>
                ))}
                {bans.length === 0 && (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-gray-500">
                      {t("msgNoActiveFound")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        
        <div className="mt-4 pt-2 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded font-bold transition"
          >
            {t("btnClose")}
          </button>
        </div>
      </div>
    </div>
  );
}