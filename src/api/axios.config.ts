import axios from "axios";
import { setupInterceptors } from "./interceptors";

const fetcher = axios.create({ baseURL: import.meta.env.VITE_API_URL });

fetcher.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if(token) config.headers.set('x-access-token',token)
  return config;
});

setupInterceptors(fetcher);

export default fetcher;
