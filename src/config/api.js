export const getApiBaseUrl = () => {
  const configured = import.meta.env.VITE_API_URL;

  if (configured) {
    return configured.replace(/\/$/, "");
  }

  if (
    typeof window !== "undefined" &&
    ["localhost", "127.0.0.1"].includes(window.location.hostname)
  ) {
    return "http://localhost:5000";
  }

  return window.location.origin;
};

export const buildApiUrl = (path) => {
  const base = getApiBaseUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${base}${normalizedPath}`;
};
