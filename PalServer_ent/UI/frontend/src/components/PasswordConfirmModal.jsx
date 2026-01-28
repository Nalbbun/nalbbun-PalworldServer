import { useState } from "react";
import { useLang } from "../context/LangContext";
import api from "../utils/api";

export default function PasswordConfirmModal({ open, onClose, onSuccess }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { t } = useLang();

  if (!open) return null;

  const submit = async () => {
    setLoading(true);
    setError("");
 
     const res = await api.post(
        "/auth/verify-password",
        { password: password.trim() },
        { skipAuthRefresh: true }  
      );

    if (res.verified) {
        onSuccess();           
    } else {
        setError(t("msgPasswordIncorrect"));
        setPassword("");
    } 
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-[400px] transition-colors duration-200">
        <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
          🔒 {t("labpassword")}
        </h3>

        <input
          type="password"
          className="w-full p-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
          placeholder={t("labpassword")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          autoComplete="new-password"
          name="confirm-password-field"
        />

        {error && (
          <div className="text-red-500 dark:text-red-400 text-sm mt-2">{error}</div>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <button
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-white rounded transition"
            onClick={onClose}
          >
            {t("btnCancel")}
          </button>
          <button
            disabled={!password || loading}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded transition disabled:opacity-50"
            onClick={submit}
          >
            {t("btnOK")}
          </button>
        </div>
      </div>
    </div>
  );
}