const DEFAULT_CLOUDY_API_URL = "http://localhost:5122";

export const cloudyApiUrl = (
  import.meta.env.VITE_API_URL || DEFAULT_CLOUDY_API_URL
).replace(/\/+$/, "");
