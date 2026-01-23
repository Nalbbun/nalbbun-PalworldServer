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
      setMsg("Failed to load images");
    }
  };

  const handleBuild = async () => {
    // 버전 포맷 검증
    if (!/^v\d+\.\d+\.\d+$/.test(newVersion)) {
      alert("Version format must be v0.0.0");
      return;
    }

    if (!window.confirm(`${t("msgConfirmBuild") || "Build new image?"} : ${newVersion}`)) {
      return;
    }

    setLoading(true);
    setMsg(`${t("msgBuilding") || "Building Image..."} (This may take a while)`);

    try {
      await api.post("/images/build", { version: newVersion });
      alert("Build Complete!");
      loadImages(); // 목록 갱신
      setNewVersion("v0.0.0");
    } catch (e) {
      alert("Build Failed. Check server logs.");
    } finally {
      setLoading(false);
      setMsg("");
    }
  };

  const handleDelete = async (version) => {
    if (!window.confirm(`${t("msgConfirmDelete") || "Delete image?"} : ${version}`)) {
      return;
    }
    setLoading(true);
    try {
      await api.post("/images/delete", { version });
      loadImages();
    } catch (e) {
      alert("Delete Failed");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl border border-gray-700 max-h-[90vh] flex flex-col">
        
        {/* HEADER */}
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">
            {t("tlImageMng") || "Image Management"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">
            &times;
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 overflow-y-auto flex-1">
          
          {/* BUILD SECTION */}
          <div className="bg-gray-900 p-4 rounded mb-6 border border-gray-700">
            <h3 className="text-sm font-bold text-gray-300 mb-2 uppercase tracking-wider">
              {t("msgCreatImage")}              
            </h3>
            <div className="flex gap-3">
              <input 
                type="text" 
                value={newVersion}
                onChange={(e) => setNewVersion(e.target.value)}
                className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500 font-mono"
                placeholder="v1.0.0"
              />
              <button 
                onClick={handleBuild}
                className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded font-semibold transition"
              >
                {t("btnImgBuild")}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {t("msgBuildDesc")}
            </p>
          </div>

          {/* LIST SECTION */}
          <h3 className="text-sm font-bold text-gray-300 mb-2 uppercase tracking-wider">
            {t("labRepositoryList")}
          </h3>
          <div className="border border-gray-700 rounded overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-700 text-gray-200">
                <tr>
                  <th className="p-3">{t("labVersion")}</th>
                  <th className="p-3">{t("labCreatTime")}</th>
                  <th className="p-3">{t("labstatus")}</th>
                  <th className="p-3 text-right">{t("labactions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700 bg-gray-800">
                {images.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-4 text-center text-gray-500">
                      {t("msgNoImages")}
                    </td>
                  </tr>
                ) : (
                  images.map((img) => (
                    <tr key={img.version} className="hover:bg-gray-750 transition">
                      <td className="p-3 font-mono text-yellow-400 font-bold">
                        {img.version}
                      </td>
                      <td className="p-3 text-gray-400">
                        {img.built}
                      </td>
                      <td className="p-3">
                        {img.version === latest && (
                          <span className="bg-green-800 text-green-200 px-2 py-0.5 rounded text-xs font-bold">
                            LATEST
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <button 
                          onClick={() => handleDelete(img.version)}
                          className="bg-red-900 text-red-200 hover:bg-red-700 px-3 py-1 rounded text-xs"
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
        <div className="p-4 border-t border-gray-700 flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition"
          >
            {t("btnCancel")}
          </button>
        </div>
      </div>

      <LoadingOverlay show={loading} message={msg} />
    </div>
  );
}