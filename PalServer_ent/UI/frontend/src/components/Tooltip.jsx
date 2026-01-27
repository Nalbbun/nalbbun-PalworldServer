export default function Tooltip({ text, danger = false }) {
  if (!text) return null;

  return (
    <span className="relative inline-flex items-center group">
      {/*  (hover ) */}
      <span
        className={`
          inline-flex items-center justify-center
          w-4 h-4 ml-1
          cursor-help select-none
          text-xs font-bold
          rounded-full
          transition-colors
          ${danger 
            ? "text-red-500 border border-red-500 hover:bg-red-500 hover:text-white" 
            : "text-gray-400 border border-gray-400 hover:bg-gray-400 hover:text-white dark:text-gray-500 dark:border-gray-500 dark:hover:bg-gray-500"
          }
        `}
      >
        i
      </span>

      {/*  */}
      <div
        className={`
          absolute left-6 top-1
          hidden group-hover:block
          w-96 p-4
          rounded-lg shadow-xl z-50 border transition-colors
          ${danger 
            ? "bg-red-50 text-red-900 border-red-200 dark:bg-red-900 dark:text-red-100 dark:border-red-800" 
            : "bg-white text-gray-800 border-gray-200 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
          }
        `}
      >
        {danger && (
          <div className="mb-2 font-bold text-red-600 dark:text-red-300">
            ⚠ Dangerous Option
          </div>
        )}
        {text}
      </div>
    </span>
  );
}