import { UseMetadata, MiddlewareMetadata, ActionMetadata, ParamMetadata } from 'routing-controllers';
import { Action, BaseDriver } from 'routing-controllers';
/**
 * Integration with hono framework.
 */
export declare class HonoDriver extends BaseDriver {
    hono?: any;
    constructor(hono?: any);
    /**
     * Initializes the things driver needs before routes and middlewares registration.
     */
    initialize(): void;
    /**
     * Registers middleware that run before controller actions.
     */
    registerMiddleware(middleware: MiddlewareMetadata): void;
    /**
     * Registers action in the driver.
     */
    registerAction(actionMetadata: ActionMetadata, executeCallback: (options: Action) => any): void;
    /**
     * Registers all routes in the framework.
     */
    registerRoutes(): void;
    /**
     * Gets param from the request.
     */
    getParamFromRequest(action: Action, param: ParamMetadata): any;
    /**
     * Handles result of successfully executed controller action.
     */
    handleSuccess(result: any, action: ActionMetadata, options: Action): void;
    /**
     * Handles result of failed executed controller action.
     */
    handleError(error: any, action: ActionMetadata | undefined, options: Action): any;
    /**
     * Creates middlewares from the given "use"-s.
     */
    protected prepareMiddlewares(uses: UseMetadata[]): Function[];
    /**
     * Dynamically loads express module.
     */
    protected loadHono(): void;
}
//# sourceMappingURL=HonoDriver.d.ts.map