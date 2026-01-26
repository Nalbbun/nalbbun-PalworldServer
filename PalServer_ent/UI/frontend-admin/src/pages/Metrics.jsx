import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import api from "../utils/api";
import { useLang } from "../context/LangContext";
import LangToggle from "../components/LangToggle"; // 임포트는 유지하되 사용되지 않았으나, 필요 시 헤더에 추가 가능

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

export default function Metrics() {
  const { instance } = useParams();
  const navigate = useNavigate();

  const [cpu, setCpu] = useState([]);
  const [ram, setRam] = useState([]);
  const [running, setRunning] = useState(true);
  const { t } = useLang();

  const load = async () => {
    try {
      const mres = await api.get(`/metrics/${instance}`);
      setCpu((l) => [...l.slice(-30), mres.cpu ?? 0]);
      setRam((l) => [...l.slice(-30), mres.ram ?? 0]);
    } catch {
      setRunning(false);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, [instance]);

  const labels = cpu.map((_, i) => i);

  // 공통 차트 옵션 (높이 제어 및 스타일)
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false, // [중요] 컨테이너 높이에 맞춤
    plugins: {
      legend: {
        labels: {
          color: "#9ca3af", // 범례 글자색 (기본 회색)
        }
      }
    },
    scales: {
      x: {
        ticks: { color: "#9ca3af" },
        grid: { color: "#374151" } // 그리드 색상 미세 조정
      },
      y: {
        ticks: { color: "#9ca3af" },
        grid: { color: "#374151" }
      }
    }
  };

  return (
    // [수정] 배경: 라이트(gray-100) / 다크(gray-900)
    <div className="p-6 min-h-screen bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-white transition-colors duration-200">
      
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <button
            className="mb-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded text-sm font-bold transition shadow-sm"
            onClick={() => navigate("/")}
          >
             ← {t("btndashboard")}
          </button>
          <h2 className="text-3xl font-bold">
            {t("labmetrics")} : <span className="text-blue-600 dark:text-blue-400">{instance}</span>
          </h2>
        </div>
        {/* LangToggle이 필요하다면 여기에 배치 */}
        {/* <LangToggle /> */}
      </div>

      {/* [수정] Grid Layout: 2컬럼 (좌: CPU, 우: RAM) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* ================= CPU Card ================= */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 h-96 flex flex-col">
          <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
            CPU {t("labUsage")} (%)
          </h3>
          <div className="flex-1 min-h-0"> {/* 차트 영역 */}
            <Line
              data={{
                labels,
                datasets: [
                  {
                    label: "CPU %",
                    data: cpu,
                    borderColor: "#22d3ee",
                    backgroundColor: "rgba(34, 211, 238, 0.1)", // 배경색 추가 (선택사항)
                    tension: 0.3,
                    pointRadius: 2,
                  },
                ],
              }}
              options={{
                ...commonOptions,
                scales: {
                  ...commonOptions.scales,
                  y: {
                    ...commonOptions.scales.y,
                    min: 0,
                    max: 100,
                    ticks: { callback: (v) => `${v}%`, color: "#9ca3af" },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* ================= RAM Card ================= */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 h-96 flex flex-col">
          <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
            Memory {t("labUsage")} (MiB)
          </h3>
          <div className="flex-1 min-h-0">
            <Line
              data={{
                labels,
                datasets: [
                  {
                    label: "RAM (MiB)",
                    data: ram,
                    borderColor: "#f87171",
                    backgroundColor: "rgba(248, 113, 113, 0.1)",
                    tension: 0.3,
                    pointRadius: 2,
                  },
                ],
              }}
              options={{
                ...commonOptions,
                scales: {
                  ...commonOptions.scales,
                  y: {
                    ...commonOptions.scales.y,
                    ticks: { callback: (v) => `${v} MiB`, color: "#9ca3af" },
                  },
                },
              }}
            />
          </div>
        </div>

      </div>
    </div>
  );
}