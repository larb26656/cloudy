import type { NetworkInterfaceInfo } from "node:os";

export type NetworkAddress = {
  type: "Tailscale" | "LAN" | "Network";
  address: string;
};

export function getNetworkAddresses(
  interfaces: Record<string, NetworkInterfaceInfo[] | undefined>,
): NetworkAddress[] {
  const addresses = Object.values(interfaces).flatMap((items) =>
    (items ?? [])
      .filter((item) => item.family === "IPv4" && !item.internal)
      .map((item) => item.address),
  );
  const uniqueAddresses = [...new Set(addresses)];
  const isTailscaleAddress = (address: string) =>
    /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./.test(address);
  const isPrivateAddress = (address: string) =>
    address.startsWith("192.168.") ||
    address.startsWith("10.") ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(address);

  return [
    ...uniqueAddresses
      .filter(isTailscaleAddress)
      .map((address) => ({ type: "Tailscale" as const, address })),
    ...uniqueAddresses
      .filter(
        (address) => !isTailscaleAddress(address) && isPrivateAddress(address),
      )
      .map((address) => ({ type: "LAN" as const, address })),
    ...uniqueAddresses
      .filter(
        (address) => !isTailscaleAddress(address) && !isPrivateAddress(address),
      )
      .map((address) => ({ type: "Network" as const, address })),
  ];
}
