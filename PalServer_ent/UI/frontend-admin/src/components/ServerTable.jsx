import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useLang } from "../context/LangContext";

function StatusBadge({ status }) {
  if (!status) {
    return (
      <span className="px-2 py-1 rounded text-xs bg-gray-600">
        UNKNOWN
      </span>
    );
  }

  if (status.startsWith("STOPPED")) {
    return (
      <span className="px-2 py-1 rounded text-xs bg-red-700 text-red-100">
        STOPPED
      </span>
    );
  }

  return (
    <span className="px-2 py-1 rounded text-xs bg-green-700 text-green-100">
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


export default function ServerTable({
  instances,
  status,
  loading,
  onStart,
  onStop,
  onBackup,
  onUpdate,
  onDelete,
  onConfig,
  onSvrSave,
}) {     
  const nav = useNavigate();

  const btn = (enabled, color) =>
    `px-3 py-1 rounded text-sm font-semibold transition ${
      enabled
        ? `${color} hover:brightness-110`
        : "bg-gray-700 text-gray-400 opacity-60 cursor-not-allowed"
    }`;

  const { t } = useLang();
  

  return (
    <table className="w-full bg-gray-800 rounded overflow-hidden">
      <thead className="bg-gray-700">
        <tr>
          <th className="p-3">{t("labinstanceName")}</th>
          <th className="p-3">{t("labVersion")}</th>
          <th className="p-3">{t("labstatus")}</th>
          <th className="p-3 text-center">{t("labactions")}</th>
        </tr>
      </thead>

      <tbody>
	  
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

        return (
            <tr key={ins.name} className="border-b border-gray-700"> 
              {/* INSTANCE */}
              <td className="p-3 font-bold">{ins.name}</td>
			  {/* VERSION */}
			  <td className="p-2 text-center text-xs">
				{ version === "latest" ? (
				  <span className="text-green-400">latest</span>
				) : (
				  <span className="text-blue-400">{version}</span>
				)}
			  </td>
              {/* STATUS / UPTIME / PORT */}
              <td className="p-3 text-sm space-y-1">
                {/* STATUS BADGE */}
                <div>
                  <StatusBadge status={s.status} />
                </div>

                {/* UPTIME */}
                {s.uptime && (
                  <div className="text-xs text-gray-300">
                     {t("labuptime")}:{" "}
                    <span className="text-white font-semibold">
                      {s.uptime}
                    </span>
                  </div>
                )}

                {/* PORTS */}
                {ports.length > 0 ? (
                  <div className="mt-1 space-y-0.5">
                    {ports.map((p) => (
                      <div key={p} className="text-gray-200 text-xs font-mono">
                        {p}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500">{t("labnoPorts")}</div>
                )}

                  {s.status.toUpperCase().startsWith("UP") && (
                    info ? (
                      <div className="text-sm text-green-400 space-y-1">
                        <div>Server: {info.servername}</div>
                        <div>Version: {info.version}</div>
                        <div>World: {info.worldguid}</div>
                      </div>
                    ) : (
                      <div className="text-xs text-yellow-400">
                        REST API initializing...
                      </div>
                    )
                  )}
              </td>

              <td className="p-3 space-y-2">
                {/* Server CONTROL */}
                <div className="flex gap-2 justify-center">
                  <button
                    disabled={loading || running}
                    onClick={() => onStart(ins.name)}
                    className={btn(!loading && !running, "bg-green-600")}
                  >
                    {t("btnstart")}
                  </button>
                  <button
                    disabled={loading || !running}
                    onClick={() => onStop(ins.name)}
                    className={btn(!loading && running, "bg-red-600")}
                  >
                  {t("btnstop")}
                  </button>
                  <button
                    disabled={loading}
                    onClick={() => onBackup(ins.name)}
                    className={btn(!loading, "bg-yellow-600")}
                  >
                  {t("btnbackup")}
                  </button>
                  <button
                    disabled={loading || running}
                    onClick={() => onUpdate({
                        open: true,
                        mode: "update-instance",
                        target: ins.name,
                        currentVersion: ins.version,
                          })
                        }
                      className={btn(!loading && !running, "bg-blue-600")}      
                  >
                  {t("btnupdate")}
                  </button>
                  <button
                    disabled={loading}
                    onClick={() => onConfig(ins.name)}
                    className={btn(!loading, "bg-emerald-600")}
                  >
                    {t("btnconfig")}
                  </button>
                  <button
                    disabled={loading || running}
                    onClick={() => onDelete(ins.name)}
                    className={btn(!loading && !running, "bg-red-600")}
                  >
                  {t("btnindelete")}
                  </button>
                </div>

                {/* Server Info + RESTAPI Info */}
                <div className="flex gap-2 justify-center">
                  <button
                    disabled={!running}
                    onClick={() => nav(`/logs/${ins.name}`)}
                    className={btn(running, "bg-gray-600")}
                  >
                  {t("btnlogs")}
                  </button>
                  <button
                    disabled={!running}
                    onClick={() => nav(`/metrics/${ins.name}`)}
                    className={btn(running, "bg-purple-600")}
                  >
                    {t("btnmetrics")}
                  </button>
                  <button
                    disabled={!running}
                    onClick={() => nav(`/players/${ins.name}`)}
                    className={btn(running, "bg-indigo-600")}
                  >
                    {t("btnplayers")}
                  </button>                  
                  <button
                    disabled={!running}
                    onClick={() => onSvrSave(ins.name)}
                    className={btn(running, "bg-indigo-600")}
                  >
                    {t("btninsSave")}
                  </button>
                </div>
              </td>
            </tr>
          );
        })}

        {instances.length === 0 && (
          <tr>
            <td colSpan="3" className="p-5 text-center text-gray-400">
              {t("msgnoinstance")}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}