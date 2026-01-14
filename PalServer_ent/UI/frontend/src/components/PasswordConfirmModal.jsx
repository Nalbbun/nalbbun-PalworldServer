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
    try {
      setLoading(true);
      setError("");

      await api.post("/auth/verify-password", { password });

      setPassword("");
      onSuccess();
    } catch {
      setError(t("msgPasswordIncorrect"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded w-[400px]">
        <h3 className="text-lg font-bold mb-4">
          🔒 {t("labpassword")}
        </h3>

        <input
          type="password"
          className="w-full p-2 bg-black border border-gray-600 rounded"
          placeholder={t("labpassword")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && (
          <div className="text-red-400 text-sm mt-2">{error}</div>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <button
            className="px-4 py-2 bg-gray-600 rounded"
            onClick={onClose}
          >
            {t("btnCancel")}
          </button>
          <button
            disabled={!password || loading}
            className="px-4 py-2 bg-emerald-600 rounded"
            onClick={submit}
          >
            {t("btnOK")}
          </button>
        </div>
      </div>
    </div>
  );
}