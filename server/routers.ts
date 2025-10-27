import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { goldRouter } from "./routers/goldRouter";
import { notificationsRouter } from "./routers/notificationsRouter";

export const appRouter = router({
  system: systemRouter,
  gold: goldRouter,
  notifications: notificationsRouter,

  // auth: router({
  //   me: publicProcedure.query(opts => opts.ctx.user),
  //   logout: publicProcedure.mutation(({ ctx }) => {
  //     const cookieOptions = getSessionCookieOptions(ctx.req);
  //     ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
  //     return {
  //       success: true,
  //     } as const;
  //   }),
  // }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
