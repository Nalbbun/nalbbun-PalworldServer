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
		  ${danger ? "text-red-400 border border-red-400" : "text-gray-400 border border-gray-500"}
		  hover:text-white hover:border-white
          transition
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
          rounded-lg shadow-xl z-50
          ${danger ? "bg-red-900 text-red-100" : "bg-gray-900 text-gray-100"}
        `}
      >
        {danger && (
          <div className="mb-2 font-bold text-red-300">
            ⚠ Dangerous Option
          </div>
        )}
        {text}
      </div>
    </span>
  );
}