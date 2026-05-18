import { useEffect } from "react";

export const useTokenListener = () => {
  useEffect(() => {
    const url = new URL(window.location.href);
    const token = url.searchParams.get("token");
    
    if (token) {
      localStorage.setItem("token", token);

      const returnUrl = sessionStorage.getItem("returnUrl") || "/";
      sessionStorage.removeItem("returnUrl");

      url.searchParams.delete("token");
      window.history.replaceState({}, "", url.toString());

      window.location.href = returnUrl;
    }
  }, []);
};
