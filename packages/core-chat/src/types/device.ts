export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export const BREAKPOINTS = {
  mobile: 640,
  tablet: 1024,
} as const;

export function getDeviceType(width: number): DeviceType {
  if (width < BREAKPOINTS.mobile) return 'mobile';
  if (width < BREAKPOINTS.tablet) return 'tablet';
  return 'desktop';
}
