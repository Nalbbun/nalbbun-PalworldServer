import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import api from "../utils/api";
import { useLang } from "../context/LangContext";
import LangToggle from "../components/LangToggle";

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

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
  <LangToggle /> 
      <button
        className="mb-4 px-4 py-2 bg-gray-700 rounded"
        onClick={() => navigate("/")}
      >
         {t("btndashboard")}
      </button>

      <h2 className="text-3xl font-bold mb-6">
        {t("labmetrics")} : <span className="text-blue-400">{instance}</span>
      </h2>

      {/* ================= CPU ================= */}
      <div className="mb-10">
        <h3 className="text-xl mb-2">CPU {t("labUsage")} (%)</h3>
        <Line
          data={{
            labels,
            datasets: [
              {
                label: "CPU %",
                data: cpu,
                borderColor: "#22d3ee",
                tension: 0.3,
              },
            ],
          }}
          options={{
            scales: {
              y: {
                min: 0,
                max: 100,
                ticks: {
                  callback: (v) => `${v}%`,
                },
              },
            },
          }}
        />
      </div>

      {/* ================= RAM ================= */}
      <div>
        <h3 className="text-xl mb-2">Memory {t("labUsage")} (MiB)</h3>
        <Line
          data={{
            labels,
            datasets: [
              {
                label: "RAM (MiB)",
                data: ram,
                borderColor: "#f87171",
                tension: 0.3,
              },
            ],
          }}
          options={{
            scales: {
              y: {
                ticks: {
                  callback: (v) => `${v} MiB`,
                },
              },
            },
          }}
        />
      </div>
    </div>
  );
}
