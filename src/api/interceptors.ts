import type { AxiosInstance } from "axios";
import { redirectToLogin } from "../utils/auth";

export const setupInterceptors = (api: AxiosInstance) => {
  api.interceptors.response.use(
    (response) => response,

    async (error) => {
      const status = error?.response?.status;

      if (status === 401) {
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        
        redirectToLogin();

        return Promise.reject(error);
      }

      return Promise.reject(error);
    },
  );
};
