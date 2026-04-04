// src/types/device.ts
var BREAKPOINTS = {
  mobile: 640,
  tablet: 1024
};
function getDeviceType(width) {
  if (width < BREAKPOINTS.mobile) return "mobile";
  if (width < BREAKPOINTS.tablet) return "tablet";
  return "desktop";
}
export {
  BREAKPOINTS,
  getDeviceType
};
//# sourceMappingURL=types.js.map