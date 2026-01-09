import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

// AccessToken  
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");

//      console.log( "[API][REQ]",  config.method?.toUpperCase(),  config.url, "token=",  token );

  if (token) config.headers.Authorization = `Bearer ${token}`;

//    console.log("[API][REQ][HEADERS]", config.headers);
    return config;
  },
    (error) => {
      console.error("[API][REQ][ERR]", error);
      return Promise.reject(error);
    }
  );

// AccessToken   refresh  
/* ===== RESPONSE ===== */
api.interceptors.response.use(
  (response) => {
 //   console.log( "[API][RES]", response.status, response.config.url, response.data);
    return response.data;
  },
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
	
    console.error("[API][ERR]", status, original?.url);
	
	if (!error.response) {
      console.error("[API][NETWORK DOWN]");
      logoutHard();
      return Promise.reject(error);
    }
	
    // access token expired
    if (status === 401 && !original._retry) {
      original._retry = true;

      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        logoutHard();
        return Promise.reject(error);
      }

      try {
        const raw = axios.create();
        const res = await raw.post("/api/auth/refresh", {
          refresh_token: refreshToken,
        });

        const newToken = res.data.access_token;
        localStorage.setItem("accessToken", newToken);

        original.headers.Authorization = `Bearer ${newToken}`;

        return api(original);
      } catch (e) {
        console.error("[API][REFRESH][FAIL]");
        logoutHard();
      }
    }

    return Promise.reject(error);
  }
);

function logoutHard() {
  console.warn("[AUTH] Hard logout");
  localStorage.clear();
  window.dispatchEvent(new Event("auth-logout"));
  window.location.replace("/admin/login");
}

export default api;