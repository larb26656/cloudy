import { serve } from "@hono/node-server";
import { routes } from "@repo/server";

serve(
  {
    fetch: routes.fetch,
    port: 3004,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);
