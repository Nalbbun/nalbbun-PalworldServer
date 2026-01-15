export function createWS(path) {
  const token = localStorage.getItem("accessToken");

  //console.log("[WS] createWS called", path, token);

  if (!token) {
    console.warn("[WS] no token");
    return null;
  }

  const proto = location.protocol === "https:" ? "wss" : "ws";
  const url = `${proto}://${location.host}/api${path}?token=${token}`;

  //console.log("[WS] connecting to ....", url);
  console.log("[WS] connecting to ....", `${proto}://`);

  const ws = new WebSocket(url);
  ws._closedByApp = false;
  return ws;
}

export function safeCloseWS(ws) {
  if (!ws) return;

  try {
    if (
      ws.readyState === WebSocket.OPEN ||
      ws.readyState === WebSocket.CONNECTING
    ) {
      ws._closedByApp = true;
      ws.onopen = null;
      ws.onmessage = null;
      ws.onerror = null;
      ws.onclose = null;
      ws.close(1000, "cleanup");
    }
  } catch (e) {
    console.warn("[WS] close failed", e);
  }
}
