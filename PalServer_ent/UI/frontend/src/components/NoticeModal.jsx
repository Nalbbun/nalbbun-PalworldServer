import { useState, useEffect } from "react";
import api from "../utils/api";
import { useLang } from "../context/LangContext";

export default function NoticeModal({
  open,
  onClose,
  onSubmit,
  loading = false,
}) {
  const [message, setMessage] = useState("");
  const { t } = useLang();

  if (!open) return null;

  const submit = () => {
    if (!message.trim()) return;
    onSubmit(message);
    setMessage("");
  };

  const cancel = () => {
    setMessage("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-gray-800 w-[520px] rounded shadow-lg p-6">
        <h3 className="text-xl font-bold mb-4 text-white">
          📢 {t("btnNotice")}
        </h3>

        <textarea
          className="w-full h-32 p-3 bg-black text-white border border-gray-600 rounded resize-none"
          placeholder={t("msgNoticeInput")}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <div className="flex justify-end gap-2 mt-5">
          <button
            className="px-4 py-2 bg-gray-600 rounded"
            onClick={cancel}
          >
            {t("btnCancel")}
          </button>

          <button
            disabled={!message.trim() || loading}
            className="px-4 py-2 bg-blue-600 rounded disabled:opacity-50"
            onClick={submit}
          >
            {loading ? `${t("msgProcessing")}...` : t("btnOK")}
          </button>
        </div>
      </div>
    </div>
  );
}