import { _base64Decode } from "./common";

export const listenForToken = (saveToken: (t: string) => void) => {
  const url = new URL(window.location.href);
  const token = url.searchParams.get("key");

  if (token) {
    saveToken(_base64Decode(token));

    const returnUrl = sessionStorage.getItem("returnUrl") || "/";
    sessionStorage.removeItem("returnUrl");

    url.searchParams.delete("token");
    window.history.replaceState({}, "", url.toString());

    window.location.href = returnUrl;
  }
};
