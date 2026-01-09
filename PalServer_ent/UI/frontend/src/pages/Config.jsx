
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useLang } from "../context/LangContext";
import { isDangerOption } from "../utils/isDangerOption";
import { detectType } from "../utils/valueType";
import LangToggle from "../components/LangToggle";
import LoadingOverlay from "../components/LoadingOverlay";
import api from "../utils/api";
import Tooltip from "../components/Tooltip";

export default function Config() {
  const { instance } = useParams();
  const navigate = useNavigate();

  const [options, setOptions] = useState({});
  const [loading, setLoading] = useState(false); 
  const [message, setMessage] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const { t, tip } = useLang(); 

	useEffect(() => {
	  api.get(`/config/${instance}`)
		.then((res) => {  
		  const { options, isDefault } = res;

		  setOptions(options || {});
		  setIsDefault(isDefault === true);
		})
		.catch((err) => {
		  console.error("Config load failed", err);
		});
	}, [instance]);

  const save = async () => {
      if (isDefault) {
      const ok = window.confirm(t("msgConfirmConfSave")); 
      if (!ok) return;
    }

    try {
      setLoading(true);
      await api.post(`/config/${instance}`, { options });
      alert(t("msgConfSaved")); 
      navigate("/", { replace: true });
    } finally {
      setLoading(false);
    }
  };

  const apply = async () => {
    if (!window.confirm(t("msgConfirmApplyCof"))) {
      return;
    }
     try {
      setLoading(true);
      await api.post(`/config/apply/${instance}`);
      alert(t("msgServerRestarted")); 
      navigate("/", { replace: true });
    } finally {
      setLoading(false);
    } 
  };

  return (
    <div className="p-8 bg-gray-900 text-white">
	  <LangToggle />     
      <button className="mb-4 px-4 py-2 bg-gray-700 rounded" onClick={() => navigate("/")}>
 		{t("btndashboard")}
      </button>
      <h1 className="text-3xl mb-6"> {instance}  : {t("labConfig")}</h1>  
      {isDefault && (
        <div className="mb-4 p-3 bg-yellow-700 text-sm rounded">
         {t("msgDefalutConfLoaded")}
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
		{Object.entries(options).map(([k, v]) => {
        const type = detectType(v);
        const danger = isDangerOption(k);
			return (
			<div key={k}>
              <label className="flex items-center gap-2 text-sm text-gray-400">
				  <span className={danger ? "text-red-400" : "text-gray-400"}>
					{k}
				  </span>

              {danger && (
                <span className="text-xs bg-red-700 text-white px-2 py-0.5 rounded">
                  DANGER
                </span>
              )} 
              <Tooltip
                text={tip(k)}
                danger={danger}
              />
            </label>
				{/* BOOLEAN */}
				{type === "boolean" && (
				  <select
					className="w-full p-2 bg-gray-800 rounded"
					value={v}
					onChange={(e) =>
					  setOptions({ ...options, [k]: e.target.value })
					}
				  >
					<option value="True">True</option>
					<option value="False">False</option>
				  </select>
				)}

				{/* NUMBER */}
				{type === "number" && (
				  <input
					type="number"
					className="w-full p-2 bg-gray-800 rounded"
					value={v}
					onChange={(e) =>
					  setOptions({ ...options, [k]: e.target.value })
					}
				  />
				)}

				{/* STRING */}
				{type === "string" && (
				  <input
					type="text"
					className="w-full p-2 bg-gray-800 rounded"
					//value={String(v).replace(/^"|"$/g, "")}
          value={String(v)}
					onChange={(e) =>
					  setOptions({ ...options, [k]: e.target.value })
					}
				  />
				)}
			  </div>
			);
        })}
      </div>

      <div className="mt-6 flex gap-3">
        <button onClick={save} className="bg-blue-600 px-4 py-2 rounded">
          {t("btnsave")}
        </button>
        <button onClick={apply} className="bg-red-600 px-4 py-2 rounded">
          {t("btnapply")}
        </button>
      </div>
		<LoadingOverlay 
		  show={loading} 
		  message={message}/>

    </div>
  );
}
