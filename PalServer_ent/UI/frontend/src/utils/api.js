import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

/* =========================
 * Request Interceptor
 * ========================= */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error("[API][REQ][ERR]", error);
    return Promise.reject(error);
  }
);

/* =========================
 * Refresh Control
 * ========================= */
let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

/* =========================
 * Response Interceptor
 * ========================= */
api.interceptors.response.use( (response) => response.data, 
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    console.error("[API][ERR]", status, original?.url);
    
    // 네트워크 자체가 죽은 경우
    if (!error.response) {
      console.error("[API][NETWORK DOWN]");
      logoutHard();
      return Promise.reject(error);
    }

    // refresh API 자체는 interceptor 대상에서 제외
    if (original.url?.includes("/api/auth/refresh")) {
      console.error("[AUTH][REFRESH LOOP BLOCK]");
      logoutHard();
      return Promise.reject(error);
    }

    // AccessToken 만료 처리
    if (status === 401 && !original._retry) {
      original._retry = true;

      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        logoutHard();
        return Promise.reject(error);
      }

      // 이미 refresh 중이면 대기
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((newToken) => {
            original.headers.Authorization = `Bearer ${newToken}`;
            resolve(api(original));
          });
        });
      }

      isRefreshing = true;

      try {
        const raw = axios.create({ timeout: 5000 });

        const res = await raw.post("/api/auth/refresh", {
          refresh_token: refreshToken,
        });

        const newToken = res.data.access_token;
        localStorage.setItem("accessToken", newToken);

        isRefreshing = false;
        onRefreshed(newToken);

        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);

      } catch (e) {
        isRefreshing = false;
        refreshSubscribers = [];
        console.error("[API][REFRESH][FAIL]");
        logoutHard();
        return Promise.reject(e);
      }
    }
    return Promise.reject(error);
  }
);

/* =========================
 * Hard Logout
 * ========================= */
function logoutHard() {
  console.warn("[AUTH] Hard logout");
  localStorage.clear();
  window.dispatchEvent(new Event("auth-logout"));
  window.location.replace("/admin/login");
}

export default api;
