import { useState, useEffect } from "react";
import { useLang } from "../context/LangContext";
import api from "../utils/api";
import LoadingOverlay from "./LoadingOverlay";

export default function ImageManageModal({ open, onClose }) {
  const { t } = useLang();
  
  // 데이터 상태
  const [images, setImages] = useState([]);
  const [latest, setLatest] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  
  // 신규 빌드 입력 상태
  const [newVersion, setNewVersion] = useState("v0.0.0");

  // 모달 열릴 때 목록 로드
  useEffect(() => {
    if (open) {
      loadImages();
      setNewVersion("v0.0.0"); // 초기화
    }
  }, [open]);

  const loadImages = async () => {
    try {
      const res = await api.get("/images/list");
      setImages(res.images || []);
      setLatest(res.latest || "");
    } catch (e) {
      console.error(e);
      setMsg(" "+ t("msgFailedToLoadImages") );
    }
  };

  const handleBuild = async () => {
    // 버전 포맷 검증
    if (!/^v\d+\.\d+\.\d+$/.test(newVersion)) {
      alert(t("msgVersionFormat"));
      return;
    }

    if (!window.confirm(`${t("msgNewImgConfirmBuild")} : ${newVersion}`)) {
      return;
    }

    setLoading(true);

    setMsg(`${t("msgBuilding")} (${t("msgBuildingDesc")})`);

    try {

      await api.post("/images/build", { version: newVersion });

      alert(t("msgBuildComplete"));

      loadImages(); // 목록 갱신

      setNewVersion("v0.0.0");
      
    } catch (e) {
      alert(t("msgBuildFailed"));
    } finally {
      setLoading(false);
      setMsg("");
    }
  };

  const handleDelete = async (version) => {
    if (!window.confirm(`${t("msgImgConfirmDelete")} : ${version}`)) {
      return;
    }
    setLoading(true);
    try {
      await api.post("/images/delete", { version });
      loadImages();
    } catch (e) {
      alert(t("msgDeleteFailed"));
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-3xl border border-gray-200 dark:border-gray-700 max-h-[90vh] flex flex-col transition-colors duration-200">
        
        {/* HEADER */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {t("tlImageMng")}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white text-2xl transition">
            &times;
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 overflow-y-auto flex-1 text-gray-900 dark:text-gray-100">
          
          {/* BUILD SECTION */}
<div className="bg-gray-100 dark:bg-gray-900 p-4 rounded mb-6 border border-gray-200 dark:border-gray-700 transition-colors">
            <h3 className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-2 uppercase tracking-wider">
              {t("msgCreatImage")}              
            </h3>
            <div className="flex gap-3">
              <input 
                type="text" 
                value={newVersion}
                onChange={(e) => setNewVersion(e.target.value)}
                className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono transition-colors"
                placeholder="v1.0.0"
              />
              <button 
                onClick={handleBuild}
                className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded font-semibold transition shadow-sm"
             >
                {t("btnImgBuild")}
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {t("msgImgBuildDesc")}
            </p>
          </div>

          {/* LIST SECTION */}
          <h3 className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-2 uppercase tracking-wider">
            {t("labRepositoryList")}
          </h3>
          <div className="border border-gray-200 dark:border-gray-700 rounded overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                <tr>
                  <th className="p-3">{t("labVersion")}</th>
                  <th className="p-3">{t("labCreatTime")}</th>
                  <th className="p-3">{t("labstatus")}</th>
                  <th className="p-3 text-right">{t("labactions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                {images.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-4 text-center text-gray-500">
                      {t("msgNoImages")}
                    </td>
                  </tr>
                ) : (
                  images.map((img) => (
                    <tr key={img.version} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                      <td className="p-3 font-mono text-blue-600 dark:text-yellow-400 font-bold">
                        {img.version}
                      </td>
                      <td className="p-3 text-gray-400">
                        {img.built}
                      </td>
                      <td className="p-3">
                        {img.version === latest && (
                          <span className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 px-2 py-0.5 rounded text-xs font-bold">
                            LATEST
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <button 
                          onClick={() => handleDelete(img.version)}
                          className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-700 px-3 py-1 rounded text-xs transition"
                        >
                          {t("btnDelete")}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-white rounded transition"
          >
            {t("btnClose")}
          </button>
        </div>
      </div>

      <LoadingOverlay show={loading} message={msg} />
    </div>
  );
}