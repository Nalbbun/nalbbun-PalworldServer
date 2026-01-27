import { useLang } from "../context/LangContext";

export default function BlockingModal({ open, message }) {
  const { t } = useLang();
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-96 text-center transition-colors duration-200">
        <div className="text-lg font-bold mb-3 text-gray-900 dark:text-white">{t("msgProcessing")}</div>
        <div className="text-sm text-gray-600 dark:text-gray-300 mb-4">{message}</div>
        <div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto" />
        <div className="text-xs text-gray-500 mt-3">
          {t("msgNotRefreshPage")}
        </div>
      </div>
    </div>
  );
}
