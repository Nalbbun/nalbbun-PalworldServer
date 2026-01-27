import { useEffect, useRef,useState } from "react";
import { useNavigate } from "react-router-dom";  
import ServerTable from "../../components/ServerTable";
import VersionSelectModal from "../../components/VersionSelectModal";
import InstanceCreateModal from "../../components/InstanceCreateModal";
import BlockingModal from "../../components/BlockingModal";
import LoadingOverlay from "../../components/LoadingOverlay";
import PasswordConfirmModal from "../../components/PasswordConfirmModal";
import ImageManageModal from "../../components/ImageManageModal";
import { useLang } from "../../context/LangContext"; 
import { ROUTE_EVENTS, onRouteChange } from "../../utils/routeEvents";
import api from "../../utils/api"; 
import { safeCloseWS } from "../../utils/ws";

 
const RefreshIcon = ({ spin }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={`w-5 h-5 ${spin ? "animate-spin" : ""}`}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
    />
  </svg>
);

export default function Dashboard() { 
  const { t } = useLang();
  const nav = useNavigate();

  const [instances, setInstances] = useState([]);
  const [status, setStatus] = useState({});

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const pollingRef = useRef(null); 
  const [updating, setUpdating] = useState(false);
  
  const [updateMsg, setUpdateMsg] = useState("");
  const [imgMngOpen, setImgMngOpen] = useState(false);  
  const [authForImg, setAuthForImg] = useState(false);   
  
  const [versionModal, setVersionModal] = useState({
    open: false,
    mode: null,    // load | promote | update-instance | update-all
    target: null,  // instance name
    currentVersion: null,  // current Version
  });
  
  const [confirmConfig, setConfirmConfig] = useState({
	open: false,
	target: null,
  });


  /* ==================== LOAD ==================== */
	const loadInstances = async () => {
	  try {
		// interceptor 때문에 res === response.data
		const res = await api.get("/instance/instancelist");

		// res.instances 가 맞다
		const names = res.instances || [];

		const withVersion = await Promise.all(
		  names.map(async (name) => {
			try {
			  const v = await api.get(`/instance/${name}/version`);
			  return {
				name,
				version: v.version, 
			  };
			} catch {
			  return {
				name,
				version: "unknown",
			  };
			}
		  })
		);

		setInstances(withVersion);
	  } catch (e) {
		console.error("[loadInstances error]", e);
		setInstances([]);
	  }
	};

  const loadStatus = async (ins) => {
    try { 
      const res = await api.get(`/instance/${ins.name}/status`,{ silent: true } );
      setStatus((p) => ({ ...p, [ins.name]: res }));
    } catch (e) { 
	
      setStatus((p) => ({
        ...p,
        [ins.name]: { status: "STOPPED", ports: [], uptime: null },
      }));
    }
  };

  const refreshAllStatus = () => {
    instances.forEach(loadStatus);
  };
  
// [추가] 수동 새로고침 핸들러
  const handleManualRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true); // 버튼만 뱅글뱅글 돌게 함
    await loadInstances();    // 인스턴스 목록 갱신
    await refreshAllStatus(); // 상태 갱신
    setTimeout(() => setRefreshing(false), 500); // 너무 빨리 끝나면 어색하므로 0.5초 유지
  };
  const openConfigWithAuth = (instance) => {
	setConfirmConfig({ open: true, target: instance });
  };

  /* ==================== ACTIONS ==================== */
  const action = async (msg, fn) => {
    setLoading(true);
    setMessage(msg);
    await fn();
    refreshAllStatus();
    setLoading(false);
    setMessage("");
  };
  
  const deleteInstance = async (n) => {
	const ok = window.confirm(`⚠ ${t("msgConfirmInsDel")}`);
	if (!ok) return;

	await api.post(`/instance/${n}/delete`);
	alert(t("msginstanceDeleted"));
	loadInstances();  
  };
	  
  const startInstance = async (n) => {
	const ok = window.confirm(` ${t("msgConfirmInsStart")}`);
	if (!ok) return;

		action(`${t("msgInstanceStarting")} ${n}...`, 
		async () => {
			const r = await api.post(`/instance/${n}/start`);
			setMessage(r.result || `${t("msgStarting")}.......!!`);
		});
	};

  const stopInstance = async (n) => {
	const ok = window.confirm(` ${t("msgConfirmInsStop")}`);
	if (!ok) return;
		action(`${t("msgInstanceStopping")} ${n}...`, 
		async () => {
			const r = await api.post(`/instance/${n}/stop`);
		setMessage(r.result || `${t("msgStopping")}.......!!`);
		});
	};

  const backupInstance = async (n) => {
	const ok = window.confirm(` ${t("msgConfirmInsBackup")}`);
	if (!ok) return;
		action(`${t("msgInstanceBackup")} ${n}...`, 
		async () => {
		const r = await api.post(`/instance/${n}/backup`);
		setMessage(r.result || `${t("msgBackupComplete")} !!!`);
		}); 
  	};

  const sumitServerSave = async (n) => {
	const ok = window.confirm(` ${t("msgConfirmInsSave")}`);
	if (!ok) return;
		action(`${t("msgInstanceSaving")} ${n}...`, 
		async () => {
		const r = await api.post(`/server/svrsave/${n}`);
		setMessage(r.result || `${t("msgSaveComplete")} !!!`);
		}); 
  	};

  const handleVersionAction = async ({ version, mode, target }) => { 	
	  try {
		setUpdating(true);
		setUpdateMsg(`${t("msgWaiteTime")}....  ${t("msgUpdating")} ${target} : ${version}...`);

		  if (mode === "promote") {
			await api.post("/instance/update", { version });
		  }

		  if (mode === "update-instance") {
			await api.post("/instance/update", { name: target, version });
		  }

		  if (mode === "update-all") {
			await api.post("/instance/update", {name: "all", version	});
		  }

		setUpdateMsg( `${t("msgUpdateSuccess")}` ); 
		setVersionModal({ open: false, mode: null , target: null})
		loadInstances();  
	  } catch (e) {
		setUpdateMsg( `${t("msgUpdateFail")}` );
	  } finally {
		setTimeout(() => {
		  setUpdating(false);
		  setUpdateMsg("");
		}, 1500);
	  }
	};

	// 이미지 관리 버튼 클릭 핸들러
  const handleImageMngClick = () => {
    // 설정 페이지처럼 비밀번호 확인 모달 오픈
    setAuthForImg(true);
  };
  /* ==================== EFFECT ==================== */
  useEffect(() => {
	  if (window.__ACTIVE_WS__) {
		safeCloseWS(window.__ACTIVE_WS__);
		window.__ACTIVE_WS__ = null;
	  }
	  loadInstances();
  }, []);

  useEffect(() => {
    refreshAllStatus();

	  const startPolling = () => {
		if (pollingRef.current) return;
		pollingRef.current = setInterval(refreshAllStatus, 60000);
		console.log("[DASHBOARD] polling started");
	  };

	  const stopPolling = () => {
		if (!pollingRef.current) return;
		clearInterval(pollingRef.current);
		pollingRef.current = null;
		console.log("[DASHBOARD] polling stopped");
	  };

	  startPolling();

	  //Logs 진입 시 polling 중단
	  const offEnter = onRouteChange(
		ROUTE_EVENTS.LOGS_ENTER,
		stopPolling
	  );

	  //Logs 이탈 시 polling 재개
	  const offLeave = onRouteChange(
		ROUTE_EVENTS.LOGS_LEAVE,
		startPolling
	  );

	  const onLogout = () => stopPolling();
	  window.addEventListener("auth-logout", onLogout);

	  return () => {
		stopPolling();
		offEnter();
		offLeave();
		window.removeEventListener("auth-logout", onLogout);
	  };
  }, [instances]);

  return (
	<div className="animate-fade-in">  
      {/* HEADER ACTION BAR: Layout 하단에 위치하는 Page Title 및 Action 버튼들 */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
		{/* Title & Refresh */}
        <div className="flex items-center gap-3">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t("tldashboard")}
          </h2>
          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="p-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 transition disabled:opacity-50 shadow-sm"
            title="Refresh Status"
          >
            <RefreshIcon spin={refreshing} />
          </button>
		  <button
            onClick={handleImageMngClick}
            className="px-4 py-2 bg-indigo-600 rounded hover:bg-indigo-500 text-white font-bold shadow" >
            {t("btnImgMng")}
          </button>
          <button
            onClick={() => setCreateOpen(true)}
            className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-500 text-white shadow"
          >
            + {t("btninstance")}
          </button>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-600 rounded hover:bg-red-500 text-white shadow"
          >
            {t("btnlogout")}
          </button>
		  <button
			  onClick={() => setVersionModal({ open: true, mode: "update-all", target: null}) }
			  className="px-4 py-2 bg-green-700 rounded hover:bg-green-600 text-white shadow"
		  >
		   {t("btnallupdate")}
		  </button>
        </div>
      </div>

	 {message && (
        <div className="mb-4 p-3 bg-blue-50 text-blue-800 dark:bg-blue-900/40 dark:text-blue-100 rounded text-center font-semibold animate-pulse border border-blue-100 dark:border-blue-800">
          {message}
        </div>
      )}

    	<ServerTable
        instances={instances}
        status={status}
        loading={loading}
		basePath="/admin"
        onStart={startInstance}
        onStop={stopInstance}
        onBackup={backupInstance}
        onUpdate={(cfg) => setVersionModal({ ...cfg, open: true })}
		onDelete={deleteInstance}
		onConfig={openConfigWithAuth}
		onSvrSave={sumitServerSave}
    	/>

		<InstanceCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={loadInstances}
    	/>
	  
		<VersionSelectModal
		  open={versionModal.open}
		  mode={versionModal.mode}
		  target={versionModal.target}
		  currentVersion={versionModal.currentVersion} 
		  onSubmit={handleVersionAction}
		  onClose={() =>
			setVersionModal({ open: false, mode: null, target: null , currentVersion: null , })
		  }
		/>
		<BlockingModal open={updating} message={updateMsg} />
		<LoadingOverlay show={loading} message={message} />

		<PasswordConfirmModal
			open={confirmConfig.open}
			onClose={() => setConfirmConfig({ open: false, target: null })}
			onSuccess={() => {
				nav(`config/${confirmConfig.target}`);
				setConfirmConfig({ open: false, target: null });
			}}
		/>
		{/* 1. 비밀번호 확인 모달 (이미지 관리용) */}
		<PasswordConfirmModal
			open={authForImg}
			onClose={() => setAuthForImg(false)}
			onSuccess={() => {
				setAuthForImg(false); // 인증 모달 닫고
				setImgMngOpen(true);  // 관리 모달 열기
			}}
		/>

		{/* 2. 이미지 관리 모달 */}
		<ImageManageModal
			open={imgMngOpen}
			onClose={() => setImgMngOpen(false)}
		/>
    </div>
  );
}