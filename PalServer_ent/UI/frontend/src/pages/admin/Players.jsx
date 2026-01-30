import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react"; 
import api from "../../utils/api";
import { useLang } from "../../context/LangContext"; 

export default function Players() {
  const { instance } = useParams();
  const navigate = useNavigate();
  const { t } = useLang();
  
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false);

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
    const interval = setInterval(load, 5000); 
    return () => clearInterval(interval);
  }, [instance]);

  /* --- Actions --- */
  
  // 1. KICK 액션
  const handleKick = async (player) => {
    // 1단계: 사유 입력
    const msg = prompt(`[KICK] '${player.name}' 추방 사유를 입력하세요:`, "Kicked by Admin");
    if (msg === null) return; // 취소
    
    // 2단계: 최종 확인
    if (!window.confirm(`정말 '${player.name}' 플레이어를 추방(Kick) 하시겠습니까?\n사유: ${msg}`)) {
      return;
    }

    setLoading(true);
    try {
      await api.post("/server/players/kick", {
        instance,
        userid: player.userId,
        message: msg
      });
      alert(`✅ 추방 완료: ${player.name}`);
      load(); // 목록 갱신
    } catch (e) {
      alert("❌ Kick Failed: " + (e.response?.data?.detail || e.message));
    } finally {
      setLoading(false);
    }
  };

  // 2. BAN 액션
  const handleBan = async (player) => {
    // 1단계: 사유 입력
    const msg = prompt(`[BAN] '${player.name}' 차단(영구정지) 사유를 입력하세요:`, "Banned by Admin");
    if (msg === null) return;

    // 2단계: 최종 확인 (위험하므로 한번 더 강조)
    if (!window.confirm(`⚠️ 경고: '${player.name}' 플레이어를 영구 차단(BAN) 하시겠습니까?\n이 작업은 되돌릴 수 없으며, 사유는 '${msg}' 입니다.`)) {
      return;
    }

    setLoading(true);
    try {
      await api.post("/server/players/ban", {
        instance,
        userid: player.userId,
        message: msg
      });
      alert(`✅ 차단 완료: ${player.name}`);
      load();
    } catch (e) {
      alert("❌ Ban Failed: " + (e.response?.data?.detail || e.message));
    } finally {
      setLoading(false);
    }
  };

  // 3. UNBAN 액션 (목록에 없는 사용자용)
  const handleUnban = async () => {
    const userid = prompt("차단을 해제할 사용자의 SteamID (UserID)를 입력하세요:");
    if (!userid) return;

    if (!window.confirm(`UserID: ${userid} 의 차단을 해제하시겠습니까?`)) return;

    setLoading(true);
    try {
      await api.post("/server/players/unban", {
        instance,
        userid: userid
      });
      alert(`✅ 차단 해제 완료: ${userid}`);
    } catch (e) {
      alert("❌ Unban Failed: " + (e.response?.data?.detail || e.message));
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
          onClick={handleUnban}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white font-bold rounded shadow transition text-sm"
        >
          🚫 Unban Player (ID)
        </button>
      </div>

      {/* Players Table */}
      <div className="rounded-lg overflow-hidden shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 uppercase text-xs tracking-wider border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="p-4 font-bold">Identity</th>
                <th className="p-4 font-bold">Network</th>
                <th className="p-4 font-bold">Location</th>
                <th className="p-4 font-bold">Stats</th>
                <th className="p-4 font-bold text-right">Actions</th>
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
                      ID: {p.userId}
                    </div>
                  </td>

                  {/* Network */}
                  <td className="p-4">
                    <div className="text-sm">IP: {p.ip}</div>
                    <div className={`text-sm mt-1 font-bold ${p.ping > 150 ? "text-red-500" : "text-green-500"}`}>
                      Ping: {p.ping} ms
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
                      LV. {p.level}
                    </div>
                    <div className="text-sm text-gray-500">
                      🏠 {p.building_count} Builds
                    </div>
                  </td>
                  
                  {/* [수정] Actions: 표 안에서 Kick/Ban 버튼 제공 */}
                  <td className="p-4 text-right">
                    <div className="flex flex-col gap-2 items-end">
                      <button
                        onClick={() => handleKick(p)}
                        className="w-20 px-3 py-1.5 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-200 rounded text-xs font-bold transition border border-yellow-200 dark:border-yellow-800"
                      >
                        KICK
                      </button>
                      <button
                        onClick={() => handleBan(p)}
                        className="w-20 px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-200 rounded text-xs font-bold transition border border-red-200 dark:border-red-800"
                      >
                        BAN
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {players.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-10 text-center text-gray-500 dark:text-gray-400">
                    {t("msgNoPlayersOnline") || "No players online..."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
           <div className="text-white text-xl font-bold animate-pulse">Processing...</div>
        </div>
      )}
    </div>
  );
}