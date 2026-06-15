import { router } from "@/server/trpc";
import { authRouter } from "./auth";
import { spaceRouter } from "./space";
import { contentTypeRouter } from "./contentType";
import { entryRouter } from "./entry";
import { assetRouter } from "./asset";

export const appRouter = router({
  auth: authRouter,
  space: spaceRouter,
  contentType: contentTypeRouter,
  entry: entryRouter,
  asset: assetRouter,
});

export type AppRouter = typeof appRouter;
