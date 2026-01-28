// 기본 위험 옵션 (기존 유지)

//  "DeathPenalty",
//  "bEnablePlayerToPlayerDamage", 
//  "bEnableFriendlyFire",

export const BASE_DANGER_OPTIONS = [
  "ServerName",
  "ServerDescription",
  "ServerPassword",
  "AdminPassword",
  "bUseAuth",
];

// 추가 위험 옵션 (확장용)
export const EXTRA_DANGER_OPTIONS = [
  "bIsPvP",
  "bHardcore",
  "bPalLost",
  "bCharacterRecreateInHardcore",
  "bAllowClientMod",
  "RCONEnabled",
  "RESTAPIEnabled",
  "PublicPort",
  "PublicIP",
  "RCONPort",
  "Region",
  "BanListURL",
  "RESTAPIPort",
  "BanListURL", 
];

// 최종 병합 (중복 제거)
export const DANGER_OPTIONS = Array.from(
  new Set([...BASE_DANGER_OPTIONS, ...EXTRA_DANGER_OPTIONS])
);