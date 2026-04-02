export const env = {
  get CLOUDY_ASSISTANT_BASE_PATH() {
    return process.env.CLOUDY_ASSISTANT_BASE_PATH || "./base-path";
  },
  get CLOUDY_API_BASE_PATH() {
    return process.env.CLOUDY_ASSISTANT_BASE_PATH || "http://localhost:3000";
  },
};
