import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react"; 
import api from "../../utils/api";
import { useLang } from "../../context/LangContext"; 
import BanListModal from "../../components/BanListModal";

export default function Players() {
  const { instance } = useParams();
  const navigate = useNavigate();
  const { t } = useLang();
  
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [banListOpen, setBanListOpen] = useState(false);

  // 데이터 로드
  const load = async () => {
    try {
      const data = await api.get(`/server/players/${instance}`);
      
      if (data.status === "RUNNING" && Array.isArray(data.players)) {
        const mapped = data.players.map(p => ({
          name: p.name || "Unknown",
          accountName: p.accountName || "-",
          playerId: p.playerId || "-",
          userId: p.userId || "-",     
          ip: p.ip || "-",
          ping: p.ping ?? 0,
          location_x: p.location_x ?? 0,
          location_y: p.location_y ?? 0,
          level: p.level ?? 1,
          building_count: p.building_count ?? 0
        }));
        setPlayers(mapped);
      } else {
        setPlayers([]);
      }
    } catch (e) {
      console.error("Load players failed", e);
      setPlayers([]);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 60000); 
    return () => clearInterval(interval);
  }, [instance]);

  /* --- Actions --- */
  
  // 1. KICK 액션
  const handleKick = async (player) => {
    // 1단계: 사유 입력
    const msg = prompt(` ['${t("labKick")}']'${player.name}' ${t("msgEnterKickReason")}:`, "Kicked by Admin");
    if (msg === null) return; // 취소
    
    // 2단계: 최종 확인
    if (!window.confirm(`'${player.name}' ${t("msgConfirmKick")} '${msg}' 입니다.`)) {
      return;
    }

    setLoading(true);
    try {
      await api.post("/server/players/kick", {
        instance,
        userid: player.userId,
        name: player.name, // [추가] 이름도 같이 보내서 DB에 저장
        message: msg
      });
      alert(`✅ ${t("msgKickComplete")}: ${player.name}`);
      load(); // 목록 갱신
    } catch (e) {
      alert("❌ " + t("msgKickFailed") + ": " + (e.response?.data?.detail || e.message));
    } finally {
      setLoading(false);
    }
  };

  // 2. BAN 액션
  const handleBan = async (player) => { 
    const msg = prompt(` ['${t("labBan")}'] '${player.name}' ${t("msgEnterBanReason")}:`, "Banned by Admin");
    if (msg === null) return;
 
    if (!window.confirm(`⚠️'${player.name}' ${t("msgConfirmBan")} '${msg}' 입니다.`)) {
      return;
    }

    setLoading(true);
    try {
      await api.post("/server/players/ban", {
        instance,
        userid: player.userId,
        name: player.name, // [추가] 이름도 같이 보내서 DB에 저장
        message: msg
      });
      alert(`✅ ${t("msgBanComplete")}: ${player.name}`);
      load();
    } catch (e) {
      alert("❌ " + t("msgBanFailed") + ": " + (e.response?.data?.detail || e.message));
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="p-8 min-h-screen bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-white transition-colors duration-200">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <button
            className="mb-4 px-4 py-2 rounded shadow-sm bg-white hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-bold transition-colors"
            onClick={() => navigate("/admin")}
          >
            {t("btndashboard")}
          </button>
          <h1 className="text-3xl font-bold">
            {t("labplayers")} : <span className="text-blue-600 dark:text-blue-400">{instance}</span>
          </h1>
        </div>
        
        {/* Unban 버튼: 목록에 없는 사용자를 위해 별도 유지 */}
        <button
          onClick={() => setBanListOpen(true)}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white font-bold rounded shadow transition text-sm"
        >
          🚫 {t("btnUnbanPlayer")}
        </button>
      </div>

      {/* Players Table */}
      <div className="rounded-lg overflow-hidden shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 uppercase text-xs tracking-wider border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="p-4 font-bold">{t("labIdentity")}</th>
                <th className="p-4 font-bold">{t("labNetwork")}</th>
                <th className="p-4 font-bold">{t("labLocation")}</th>
                <th className="p-4 font-bold">{t("labStats")}</th>
                <th className="p-4 font-bold text-right">{t("labAction")}</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {players.map((p, i) => (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  
                  {/* Identity */}
                  <td className="p-4">
                    <div className="font-bold text-lg text-blue-600 dark:text-blue-400">{p.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">{p.accountName}</div>
                    <div className="text-xs text-gray-400 mt-1 font-mono cursor-pointer hover:text-gray-600" title="Click to copy ID" onClick={() => navigator.clipboard.writeText(p.userId)}>
                      {t("labid")}: {p.userId}
                    </div>
                  </td>

                  {/* Network */}
                  <td className="p-4">
                    <div className="text-sm">{t("labIP")}: {p.ip}</div>
                    <div className={`text-sm mt-1 font-bold ${p.ping > 150 ? "text-red-500" : "text-green-500"}`}>
                      {t("labPing")}: {p.ping} ms
                    </div>
                  </td>

                  {/* Location */}
                  <td className="p-4 font-mono text-sm text-gray-600 dark:text-gray-300">
                    <div>X: {p.location_x}</div>
                    <div>Y: {p.location_y}</div>
                  </td>

                  {/* Stats */}
                  <td className="p-4">
                    <div className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs font-bold mb-1">
                      {t("labLevel")}. {p.level}
                    </div>
                    <div className="text-sm text-gray-500">
                      🏠 {p.building_count} {t("labBuilds")}
                    </div>
                  </td>
                  
                  {/*  Actions: 표 안에서 Kick/Ban 버튼 제공 */}
                  <td className="p-4 text-right">
                    <div className="flex flex-col gap-2 items-end">
                      <button
                        onClick={() => handleKick(p)}
                        className="w-20 px-3 py-1.5 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-200 rounded text-xs font-bold transition border border-yellow-200 dark:border-yellow-800"
                      >
                        {t("labKick")}
                      </button>
                      <button
                        onClick={() => handleBan(p)}
                        className="w-20 px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-200 rounded text-xs font-bold transition border border-red-200 dark:border-red-800"
                      >
                        {t("labBan")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {players.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-10 text-center text-gray-500 dark:text-gray-400">
                    {t("msgNoPlayersOnline")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <BanListModal 
        instance={instance} 
        open={banListOpen} 
        onClose={() => setBanListOpen(false)} 
      />
      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
           <div className="text-white text-xl font-bold animate-pulse">{t("msgProcessing")} ... </div>
        </div>
      )}
    </div>
  );
}