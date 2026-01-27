import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react"; 
import api from "../../utils/api";
import { useLang } from "../../context/LangContext"; 

export default function Players() {
  const { instance } = useParams();
  const [players, setPlayers] = useState([]);
  const navigate = useNavigate();
  const { t } = useLang();

  const load = async () => {
    try {
      const data = await api.get(`/server/players/${instance}`);
      // API 응답 구조에 따라 데이터 설정 로직이 다를 수 있음
      // 기존 로직 유지: data.players가 있으면 사용, 없으면 raw 데이터 가공 시도
      let playerList = data.players || [];

      if (data.status === "RUNNING" && data.raw?.players) {
        // 만약 data.raw.players가 존재하면 가공해서 덮어쓰기 (원본 코드 의도 반영)
        playerList = data.raw.players.map(p => ({
          name: p.name,
          level: p.level ?? "-",
          playtime: Math.round((p.playTimeSeconds ?? 0) / 60) + " min", // 분 단위 변환 및 단위 추가
        }));
      }
      setPlayers(playerList);
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
    // [수정] 배경: 라이트(gray-100) / 다크(gray-900)
    <div className="p-8 min-h-screen bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-white transition-colors duration-200">
      
      {/* Header Section */}
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
        {/* LangToggle이 필요하다면 주석 해제하여 사용 */}
        {/* <LangToggle /> */}
      </div>

      {/* [수정] 테이블 컨테이너: 흰색/어두운회색, 그림자 */}
      <div className="rounded-lg overflow-hidden shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-colors">
        <table className="w-full text-left">
          <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 uppercase text-xs tracking-wider border-b border-gray-200 dark:border-gray-600">
            <tr>
              <th className="p-4 font-bold">Name</th>
              <th className="p-4 font-bold">Playtime</th>
              <th className="p-4 font-bold">Level</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {players.map((p, i) => (
              <tr 
                key={i} 
                className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
              >
                <td className="p-4 font-medium text-gray-900 dark:text-gray-100">{p.name}</td>
                <td className="p-4 text-gray-600 dark:text-gray-300">{p.playtime}</td>
                <td className="p-4 text-gray-600 dark:text-gray-300">{p.level}</td>
              </tr>
            ))}

            {players.length === 0 && (
              <tr>
                <td colSpan="3" className="p-10 text-center text-gray-500 dark:text-gray-400">
                  {t("msgNoPlayersOnline")} .....
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}