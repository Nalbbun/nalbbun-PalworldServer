import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useLang } from "../context/LangContext"; 
import { createWS, safeCloseWS } from "../utils/ws";
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
		await fetch(`/api/server/notice/${instance}`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ message }),
		});

		setShowNotice(false);
	} catch (e) {
		alert( t("msgProcessFail") );
	} finally {
		setSendingNotice(false);
	}
	};
	
  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen"> 
      <button className="mb-4 px-4 py-2 bg-gray-700 rounded" 
	  		  onClick={goDashboard} >
        {t("btndashboard")}
      </button>
	<button className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-500" 
			onClick={() => setShowNotice(true)}>
		📢 {t("btnNotice")}
	</button>
      <h2 className="text-3xl font-bold mb-4">
        {t("lablogs")} :{" "}<span className="text-blue-400">{instance}</span>
      </h2>

      <div className="bg-black p-4 h-[80vh] overflow-auto font-mono text-sm">
        {lines.length ? (
          <pre className="whitespace-pre-wrap text-green-400">
            {lines.join("")}
          </pre>
        ) : (
          <span className="text-gray-400">
            {wsState === "connecting" &&  t("msgConnecting") }
            {wsState === "open" &&  t("msgWaitingForLogs") }
            {wsState === "closed" &&  t("msgWLogsClose") }
            {wsState === "error" &&  t("msgWLogsError") }
          </span>
        )}
      </div>
	  	<NoticeModal
			open={showNotice}
			loading={sendingNotice}
			onClose={() => setShowNotice(false)}
			onSubmit={sendNotice} 	/>
    </div>

  );
}