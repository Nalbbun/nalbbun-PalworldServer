// src/hooks/useWebSocket.js
import { useEffect, useRef } from "react";
import { createWS, safeCloseWS } from "../utils/ws";

export function useWebSocket({ path, onMessage }) {
  const wsRef = useRef(null);
  const closedByUser = useRef(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      console.warn("[WS] no token, skip connect");
      return;
    }

    const proto = location.protocol === "https:" ? "wss" : "ws";
    const url = `${proto}://${location.host}/api${path}?token=${token}`;

    closedByUser.current = false;
    wsRef.current = createWS(url, {
      onMessage,
      onClose: () => {
        if (!closedByUser.current) {
          console.warn("[WS] closed unexpectedly (no reconnect)");
        }
      },
    });

    return () => {
      // 페이지 떠날 때 무조건 정리
      closedByUser.current = true;
      safeCloseWS(wsRef.current);
      wsRef.current = null;
    };
  }, [path]);

  return {
    close: () => {
      closedByUser.current = true;
      safeCloseWS(wsRef.current);
      wsRef.current = null;
    },
  };
}