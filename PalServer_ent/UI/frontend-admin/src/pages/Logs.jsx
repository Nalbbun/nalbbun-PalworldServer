import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useLang } from "../context/LangContext"; 
import { createWS, safeCloseWS } from "../utils/ws";
import api from "../utils/api";
import NoticeModal from "../components/NoticeModal"; 

const MAX_LINES = 10000;

export default function Logs() {
  const { instance } = useParams();
  const navigate = useNavigate();
 
  const [showNotice, setShowNotice] = useState(false);
  const [sendingNotice, setSendingNotice] = useState(false);

  const [lines, setLines] = useState([]);
  const [wsState, setWsState] = useState("connecting");
  const wsRef = useRef(null);
  const { t } = useLang();  

  useEffect(() => { 
    setLines([]);
    setWsState("connecting");
    
    console.log("[Logs] mount", instance);
    
    const ws = createWS(`/ws/logs/${instance}`);
    
    if (!ws) {
      setWsState("error");
      return;
    }
    
    window.__ACTIVE_WS__ = ws;
    wsRef.current = ws;

    ws.onopen = () => { 
      console.log("[WS] opened");
      setWsState("open");
    }
    
    ws.onmessage = (e) => { 
      setLines((prev) => {
        const next = [...prev, e.data];
        return next.length > MAX_LINES
          ? next.slice(next.length - MAX_LINES)
          : next;
      });
    };
    
    ws.onerror = (e) => { 
      console.error("[WS] error", e);
      setWsState("error");
    }

    ws.onclose = (e) => { 
      console.log("[WS] closed", e.code, e.reason);
      setWsState("closed");
    };

    return () => {
      console.log("[Logs] cleanup"); 
      safeCloseWS(ws);
      window.__ACTIVE_WS__ = null;
      wsRef.current = null;
    };
  }, [instance]);
  
  const goDashboard = () => {
    safeCloseWS(wsRef.current);
    if (wsRef.current) {
      safeCloseWS(wsRef.current);
      wsRef.current = null;
      window.__ACTIVE_WS__ = null;
    }
    navigate("/", { replace: true });
  }; 
     
  const sendNotice = async (message) => {
    setSendingNotice(true);
    try {
      const data = await api.post(`/server/notice/${instance}`, { message });
      // console.log("[Notice] ",data.message);
      setShowNotice(false);
    } catch (e) {
      alert( t("msgProcessFail") );
    } finally {
      setSendingNotice(false);
    }
  };
    
  return (
    // [수정] 배경: 라이트(gray-100) / 다크(gray-900)
    <div className="p-6 min-h-screen bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-white transition-colors duration-200">
      
      {/* Header Section */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <button 
            className="mb-4 px-4 py-2 rounded shadow-sm bg-white hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-bold transition-colors"
            onClick={goDashboard} 
          >
            ← {t("btndashboard")}
          </button>

          <h2 className="text-3xl font-bold">
            {t("lablogs")} :{" "}<span className="text-blue-600 dark:text-blue-400">{instance}</span>
          </h2>
        </div>
        
        {/* 공지 버튼 */}
        <button 
          className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded shadow-sm transition transform active:scale-95" 
          onClick={() => setShowNotice(true)}
        >
          📢 {t("btnNotice")}
        </button>
      </div>

      {/* Log Terminal Window */}
      {/* [수정] 테두리 및 그림자 추가 */}
      <div className="rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* [수정] 배경: 라이트(흰색) / 다크(검은색 - 터미널 느낌) */}
        <div className="p-4 h-[80vh] overflow-auto font-mono text-sm bg-white dark:bg-black transition-colors duration-200">
          {lines.length ? (
            // [수정] 텍스트 색상: 라이트(진한 회색) / 다크(녹색 - 터미널 느낌)
            <pre className="whitespace-pre-wrap text-gray-800 dark:text-green-400 transition-colors">
              {lines.join("")}
            </pre>
          ) : (
            <span className="text-gray-400 dark:text-gray-500 italic">
              {wsState === "connecting" &&  t("msgConnecting") }
              {wsState === "open" &&  t("msgWaitingForLogs") }
              {wsState === "closed" &&  t("msgWLogsClose") }
              {wsState === "error" &&  t("msgWLogsError") }
            </span>
          )}
        </div>
      </div>

      <NoticeModal
        open={showNotice}
        loading={sendingNotice}
        onClose={() => setShowNotice(false)}
        onSubmit={sendNotice} 
      />
    </div>
  );
}