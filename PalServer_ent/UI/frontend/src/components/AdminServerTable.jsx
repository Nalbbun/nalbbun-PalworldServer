import { useNavigate } from "react-router-dom"; 
import { useLang } from "../context/LangContext";

function StatusBadge({ status }) {
  if (!status) {
    return (
      <span className="px-2 py-1 rounded text-xs font-bold bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-200">
        UNKNOWN
      </span>
    );
  }

  if (status.startsWith("STOPPED")) {
    return (
      <span className="px-2 py-1 rounded text-xs font-bold bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100">
        STOPPED
      </span>
    );
  }

  return (
    <span className="px-2 py-1 rounded text-xs font-bold bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100">
      {status}
    </span>
  );
} 

function normalizePorts(ports = []) {
  const set = new Set();

  ports.forEach((p) => { 
    // :18211->8211/udp
    // 0.0.0.0:18211->8211/udp
    const m = p.match(/(?:(\d+\.\d+\.\d+\.\d+):)?(\d+)->(\d+)\/(\w+)/);
    if (!m) return;

    const [, hostIp, hostPort, containerPort, proto] = m;

    const host = hostIp ? `${hostIp}:${hostPort}` : `:${hostPort}`;
    set.add(`${host} → ${containerPort}/${proto}`);
  });

  return Array.from(set);
}


export default function AdminServerTable({
  instances,
  status,
  loading,
  basePath ,  
  onStart,
  onStop,
  onBackup,
  onUpdate,
  onDelete,
  onConfig,
  onSvrSave,
}) {     
  const nav = useNavigate();
  const { t } = useLang();
  const goTo = (path) => {
    // path가 "logs/nal" 이고 basePath가 "/admin" 이면 -> "/admin/logs/nal"
    // 상대 경로로 처리하려면 navigate(path) 만 써도 되지만, 
    // 명시적으로 합쳐주는 것이 안전할 수 있음.
    // 여기서는 상대 경로 방식을 추천: navigate(`logs/${ins.name}`)
    // 하지만 ServerTable이 호출되는 위치가 이미 /admin 이라면 상대 경로가 맞음.
    // 확실하게 하기 위해 basePath를 결합합니다.
    const target = basePath ? `${basePath}/${path}` : path;
    nav(target);
  };
  
  const btn = (enabled, color) =>
    `px-3 py-1 rounded text-sm font-semibold transition text-white shadow-sm whitespace-nowrap ${
      enabled
        ? `${color} hover:brightness-110`
        : "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 opacity-60 cursor-not-allowed"
    }`;  

  return (
    <div className="rounded-lg overflow-hidden shadow-lg bg-white dark:bg-gray-800 transition-colors duration-200 border border-gray-200 dark:border-gray-700">
      <table className="w-full text-left">
        <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600 uppercase text-xs tracking-wider">
          <tr>
          <th className="p-3">{t("labinstanceName")}</th>
          <th className="p-3">{t("labVersion")}</th>
          <th className="p-3">{t("labstatus")}</th>
          <th className="p-3 text-center">{t("labactions")}</th>
        </tr>
      </thead>

      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">	  
      {instances.map((ins) => {
        const s = status[ins.name] || {
          status: "STOPPED",
          ports: [],
          uptime: null,
          info: null,
        };

		const running =   s.status &&  (s.status === "RUNNING" || s.status.toUpperCase().startsWith("UP"));

    const ports = normalizePorts(s.ports); 
		const version = ins.version || "unknown";		  
    const info = s.info || null;  
      /* btn color
        bg-blue-600  bg-green-600  bg-red-600  bg-yellow-600  bg-purple-600
        bg-emerald-600  bg-cyan-600  bg-pink-600  bg-orange-600  bg-teal-600
      */

        return (
            <tr key={ins.name} className="hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors duration-150 group">
              {/* INSTANCE */}
              <td className="p-4 font-bold text-lg text-gray-800 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-white transition-colors">
                  {ins.name}
              </td>
              {/* VERSION */}
              <td className="p-4 text-center text-sm font-mono">
                {version === "latest" ? (
                  <span className="text-green-600 dark:text-green-400 font-bold bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded border border-green-200 dark:border-green-800">
                    latest
                  </span>
                ) : (
                  <span className="text-blue-600 dark:text-blue-400 font-bold bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                    {version}
                  </span>
                )}
              </td>
              {/* STATUS / UPTIME / PORT */}
              <td className="p-4 text-sm space-y-2">
                {/* STATUS BADGE */}
                <div className="flex items-center gap-2">
                  <StatusBadge status={s.status} />
                  {s.uptime && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ({s.uptime})
                      </span>
                    )}
                </div>

                {/* PORTS */}
                {ports.length > 0 ? (
                  <div className="space-y-0.5 pl-1">
                    {ports.map((p) => (
                      <div key={p} className="text-gray-600 dark:text-gray-300 text-xs font-mono">
                        {p}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-400 italic">{t("labnoPorts")}</div>
                )}

                  {s.status.toUpperCase().startsWith("UP") &&
                    (info ? (
                      <div className="mt-2 text-xs bg-gray-100 dark:bg-black/40 p-2 rounded text-gray-700 dark:text-gray-300 space-y-0.5 border border-gray-200 dark:border-gray-600">
                        <div><span className="font-semibold text-gray-500 dark:text-gray-400">Server:</span> {info.servername}</div>
                        <div><span className="font-semibold text-gray-500 dark:text-gray-400">Version:</span> {info.version}</div>
                        <div className="truncate text-gray-400" title={info.worldguid}>
                          <span className="font-semibold text-gray-500 dark:text-gray-400">World:</span> {info.worldguid}</div>
                      </div>
                    ) : (
                      <div className="text-xs text-yellow-600 dark:text-yellow-400 animate-pulse mt-1">
                        {t("msgRestAPIInitializing")}
                      </div>
                    ))}
                </td>
              <td className="p-4 space-y-3">
                  {/* ACTIONS */}
                  <div className="flex flex-wrap gap-2 justify-center">
                    <button disabled={loading || running} onClick={() => onStart(ins.name)} className={btn(!loading && !running, "bg-green-600")}>{t("btnstart")}</button>
                    <button disabled={loading || !running} onClick={() => onStop(ins.name)} className={btn(!loading && running, "bg-red-600")}>{t("btnstop")}</button>
                    <button disabled={loading} onClick={() => onBackup(ins.name)} className={btn(!loading, "bg-yellow-600")}>{t("btnbackup")}</button>
                    <button disabled={loading || running} onClick={() => onUpdate({ open: true, mode: "update-instance", target: ins.name, currentVersion: ins.version })} className={btn(!loading && !running, "bg-blue-600")}>{t("btnupdate")}</button>
                    <button disabled={loading} onClick={() => onConfig(ins.name)} className={btn(!loading, "bg-emerald-600")}>{t("btnconfig")}</button>
                    <button disabled={loading || running} onClick={() => onDelete(ins.name)} className={btn(!loading && !running, "bg-gray-500 hover:bg-red-600")}>{t("btnindelete")}</button>
                  </div>

                  {/* SUB ACTIONS */}
                  <div className="flex flex-wrap gap-2 justify-center border-t border-gray-200 dark:border-gray-700 pt-3 mt-2">
                    <button disabled={!running} onClick={() => goTo(`logs/${ins.name}`)} className={btn(running, "bg-slate-600")}>{t("btnlogs")}</button>
                    <button disabled={!running} onClick={() => goTo(`metrics/${ins.name}`)} className={btn(running, "bg-purple-600")}>{t("btnmetrics")}</button>
                    <button disabled={!running} onClick={() => goTo(`players/${ins.name}`)} className={btn(running, "bg-indigo-600")}>{t("btnplayers")}</button>
                    <button disabled={!running} onClick={() => onSvrSave(ins.name)} className={btn(running, "bg-teal-600")}>{t("btninsSave")}</button>
                  </div>
                </td>
              </tr>
            );
          })}

        {instances.length === 0 && (
          <tr>
            <td colSpan="4" className="p-10 text-center text-gray-500 dark:text-gray-400">
              {t("msgnoinstance")}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
  );
}