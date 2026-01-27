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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"> 
      <div className="bg-white dark:bg-gray-800 w-[520px] rounded-lg shadow-2xl p-6 transition-colors duration-200">
        <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
          📢 {t("btnNotice")}
        </h3>

        <textarea
          className="w-full h-32 p-3 bg-gray-50 dark:bg-black text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded resize-none focus:outline-none focus:border-blue-500 transition-colors"
          placeholder={t("msgNoticeInput")}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <div className="flex justify-end gap-2 mt-5">
          <button
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-white rounded transition"
            onClick={cancel}
          >
            {t("btnCancel")}
          </button>

          <button
            disabled={!message.trim() || loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded disabled:opacity-50 transition shadow-sm"
            onClick={submit}
          >
            {loading ? `${t("msgProcessing")}...` : t("btnOK")}
          </button>
        </div>
      </div>
    </div>
  );
}