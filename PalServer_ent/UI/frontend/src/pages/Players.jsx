import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react"; 
import api from "../utils/api";
import { useLang } from "../context/LangContext";
import LangToggle from "../components/LangToggle";

export default function Players() {
  const { instance } = useParams();
  const [players, setPlayers] = useState([]);
  const navigate = useNavigate();
  const { t } = useLang();

  const load = async () => {
    try {
      const data = await api.get(`/players/${instance}`);
      setPlayers(data.players || []);
	  
	  if (data.status === "RUNNING" && data.raw?.players) {
			const players = data.raw.players.map(p => ({
			name: p.name,
			level: p.level ?? "-",
			playtimeMin: Math.round((p.playTimeSeconds ?? 0) / 60),
		  }))
		}
    } catch {
      setPlayers([]);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [instance]);

  return (
    <div className="p-8 bg-gray-900 text-white min-h-screen">
      <button
        className="mb-4 px-4 py-2 bg-gray-700 rounded"
        onClick={() => navigate("/")}
      >
         {t("btndashboard")}
      </button>
      <h1 className="text-3xl mb-6">
        {t("labplayers")} : <span className="text-blue-400">{instance}</span>
      </h1>

      <table className="w-full bg-gray-800 rounded overflow-hidden">
        <thead className="bg-gray-700">
          <tr>
            <th className="p-3 text-left">Name</th>
            <th className="p-3 text-left">Playtime</th>
            <th className="p-3 text-left">Level</th>
          </tr>
        </thead>

        <tbody>
          {players.map((p, i) => (
            <tr key={i} className="border-b border-gray-700">
              <td className="p-3">{p.name}</td>
              <td className="p-3">{p.playtime}</td>
              <td className="p-3">{p.level}</td>
            </tr>
          ))}

          {players.length === 0 && (
            <tr>
              <td colSpan="3" className="p-6 text-center text-gray-400">
                {t("msgNoPlayersOnline")} .....
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
