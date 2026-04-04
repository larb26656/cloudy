import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  splitting: true,
  clean: true,
  external: [
    "react",
    "react-dom",
    "@base-ui/react",
    "@base-ui/react/dialog",
    "@base-ui/react/select",
    "vaul",
    "react-resizable-panels",
    "radix-ui",
    "lucide-react",
    "sonner",
  ],
  alias: { "@/": "./src/" },
})
