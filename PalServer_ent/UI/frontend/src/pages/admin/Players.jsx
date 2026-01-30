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
        // 모든 필드 매핑
        const mapped = data.players.map(p => ({
          name: p.name || "Unknown",
          accountName: p.accountName || "-",
          playerId: p.playerId || "-",
          userId: p.userId || "-",     // Kick/Ban 식별자
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
    const interval = setInterval(load, 5000); // 5초 자동 갱신
    return () => clearInterval(interval);
  }, [instance]);

  /* --- Actions --- */
  const handleKick = async (player) => {
    const msg = prompt(`Kick '${player.name}'? Reason:`, "Kicked by Admin");
    if (msg === null) return;
    
    setLoading(true);
    try {
      await api.post("/server/players/kick", {
        instance,
        userid: player.userId,
        message: msg
      });
      alert(`Kicked: ${player.name}`);
      load();
    } catch (e) {
      alert("Kick Failed: " + (e.response?.data?.detail || e.message));
    } finally {
      setLoading(false);
    }
  };

  const handleBan = async (player) => {
    if (!window.confirm(`WARNING: Ban '${player.name}'?`)) return;
    const msg = prompt("Ban Reason:", "Banned by Admin");
    if (msg === null) return;

    setLoading(true);
    try {
      await api.post("/server/players/ban", {
        instance,
        userid: player.userId,
        message: msg
      });
      alert(`Banned: ${player.name}`);
      load();
    } catch (e) {
      alert("Ban Failed: " + (e.response?.data?.detail || e.message));
    } finally {
      setLoading(false);
    }
  };

  const handleUnban = async () => {
    const userid = prompt("Enter UserID (SteamID) to Unban:");
    if (!userid) return;

    setLoading(true);
    try {
      await api.post("/server/players/unban", {
        instance,
        userid: userid
      });
      alert(`Unbanned ID: ${userid}`);
    } catch (e) {
      alert("Unban Failed: " + (e.response?.data?.detail || e.message));
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
             ← {t("btndashboard")}
          </button>
          <h1 className="text-3xl font-bold">
            {t("labplayers")} : <span className="text-blue-600 dark:text-blue-400">{instance}</span>
          </h1>
        </div>
        
        <button
          onClick={handleUnban}
          className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded shadow transition"
        >
          Unban Player (ID)
        </button>
      </div>

      {/* Players Table */}
      <div className="rounded-lg overflow-hidden shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 uppercase text-xs tracking-wider border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="p-4 font-bold">Identity (Name / Account / ID)</th>
                <th className="p-4 font-bold">Network (IP / Ping)</th>
                <th className="p-4 font-bold">Location (X, Y)</th>
                <th className="p-4 font-bold">Stats (Lv / Build)</th>
                <th className="p-4 font-bold text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {players.map((p, i) => (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  
                  {/* 1. Identity */}
                  <td className="p-4">
                    <div className="font-bold text-lg text-blue-600 dark:text-blue-400">{p.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Acct: {p.accountName}</div>
                    <div className="text-xs text-gray-400 mt-1 font-mono">
                      UID: {p.userId}<br/>
                      PID: {p.playerId}
                    </div>
                  </td>

                  {/* 2. Network */}
                  <td className="p-4">
                    <div className="text-sm">IP: {p.ip}</div>
                    <div className={`text-sm mt-1 font-bold ${p.ping > 150 ? "text-red-500" : "text-green-500"}`}>
                      Ping: {p.ping} ms
                    </div>
                  </td>

                  {/* 3. Location */}
                  <td className="p-4 font-mono text-sm text-gray-600 dark:text-gray-300">
                    <div>X: {p.location_x?.toFixed(2)}</div>
                    <div>Y: {p.location_y?.toFixed(2)}</div>
                  </td>

                  {/* 4. Stats */}
                  <td className="p-4">
                    <div className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs font-bold mb-1">
                      LV. {p.level}
                    </div>
                    <div className="text-sm text-gray-500">
                      🏠 {p.building_count}
                    </div>
                  </td>
                  
                  {/* 5. Actions */}
                  <td className="p-4 text-right">
                    <div className="flex flex-col gap-2 items-end">
                      <button
                        onClick={() => handleKick(p)}
                        className="px-3 py-1 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-200 rounded text-xs font-bold transition border border-yellow-200 dark:border-yellow-800 w-20"
                      >
                        Kick
                      </button>
                      <button
                        onClick={() => handleBan(p)}
                        className="px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-200 rounded text-xs font-bold transition border border-red-200 dark:border-red-800 w-20"
                      >
                        Ban
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