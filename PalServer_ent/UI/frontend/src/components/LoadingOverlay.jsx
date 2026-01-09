import { useLang } from "../context/LangContext";

export default function LoadingOverlay({ show , message }) {
  const { t } = useLang();
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
      <div className="bg-gray-800 p-6 rounded shadow-xl w-96 text-center">
        <div className="text-lg font-bold mb-3">{t("msgProcessing")}</div>
        <div className="text-sm text-gray-300 mb-4">{message}</div>
        <div className="animate-spin h-8 w-8 border-4 border-green-400 border-t-transparent rounded-full mx-auto" />
        <div className="text-xs text-gray-500 mt-3">
          {t("msgNotRefreshPage")}
        </div>
      </div>
    </div>
  );
}