import { Context } from "hono";

/**
 * Used to register middlewares.
 * This signature is used for hono middlewares.
 */
export interface HonoMiddlewareInterface {
    /**
     * Called before controller action is being executed.
     */
    use(context: Context, next: (err?: any) => Promise<any>): Promise<any>;
  }
  