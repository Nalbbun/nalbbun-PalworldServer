//utils/valueType.js 
export function detectType(value) {
  const v = String(value);

  if (v === "True" || v === "False") return "boolean";
  if (!isNaN(v) && v.trim() !== "") return "number";
  return "string";
}