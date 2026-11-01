import {
  createAcpAdapter,
  type AcpAdapter,
  type AcpAdapterOptions,
} from "../acp/acp.adapter";

export interface OmpAdapterOptions extends Omit<
  AcpAdapterOptions,
  "id" | "name" | "launch"
> {
  id?: string;
  name?: string;
}

export function createOmpAdapter({
  id = "omp",
  name = "OMP",
  ...options
}: OmpAdapterOptions = {}): AcpAdapter {
  return createAcpAdapter({
    id,
    name,
    launch: { command: "omp", args: ["acp"] },
    catalogDirectory: process.cwd(),
    catalogLaunch: { command: "omp", args: ["acp", "--no-session"] },
    ...options,
  });
}
