// 전역 라우트 이벤트 헬퍼

export const ROUTE_EVENTS = {
  LOGS_ENTER: "route:logs:enter",
  LOGS_LEAVE: "route:logs:leave",
};

export function emitRouteEvent(name) {
  window.dispatchEvent(new Event(name));
}

export function onRouteChange(name, handler) {
  window.addEventListener(name, handler);
  return () => window.removeEventListener(name, handler);
}