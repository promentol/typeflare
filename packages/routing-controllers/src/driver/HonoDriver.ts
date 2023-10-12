import {
  UseMetadata,
  MiddlewareMetadata,
  ActionMetadata,
  ParamMetadata,
} from "routing-controllers";
import {
  Action,
  BaseDriver,
  RoleChecker,
  RoutingControllersOptions,
} from "routing-controllers";
import { HonoMiddlewareInterface } from "./HonoMiddlewareInterface";

import { AuthorizationRequiredError } from "routing-controllers";

import { AccessDeniedError } from "routing-controllers";
import { AuthorizationCheckerNotDefinedError } from "routing-controllers";
import { NotFoundError } from "routing-controllers";

// import { isPromiseLike } from '../../util/isPromiseLike';
import { getFromContainer } from "routing-controllers";
// import { NotFoundError } from '../../index';
import { Hono, Context } from "hono";
import { cors } from "hono/cors";

import {
  getCookie,
  getSignedCookie,
  setCookie,
  setSignedCookie,
  deleteCookie,
} from "hono/cookie";
// import templateUrl from 'template-url'
/**
 * Integration with hono framework.
 */
export class HonoDriver extends BaseDriver {
  // -------------------------------------------------------------------------
  // Constructor
  // -------------------------------------------------------------------------

  constructor(public hono?: any) {
    super();
    this.loadHono();
    this.app = this.hono;
  }

  // -------------------------------------------------------------------------
  // Public Methods
  // -------------------------------------------------------------------------

  /**
   * Initializes the things driver needs before routes and middlewares registration.
   */
  initialize() {
    if (this.cors) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      if (this.cors === true) {
        this.hono.use(cors());
      } else {
        this.hono.use(cors(this.cors as any));
      }
    }
  }

  /**
   * Registers middleware that run before controller actions.
   */
  registerMiddleware(middleware: MiddlewareMetadata): void {
    //TODO
    if ((middleware.instance as HonoMiddlewareInterface).use) {
      this.hono.use("*", function (ctx: any, next: any) {
        return (middleware.instance as HonoMiddlewareInterface).use(ctx, next);
      });
    }
  }

  /**
   * Registers action in the driver.
   */
  registerAction(
    actionMetadata: ActionMetadata,
    executeCallback: (options: Action) => any
  ): void {
    // middlewares required for this action
    const defaultMiddlewares: any[] = [];

    // if (actionMetadata.isBodyUsed) {
    //   if (actionMetadata.isJsonTyped) {
    //     defaultMiddlewares.push(this.loadBodyParser().json(actionMetadata.bodyExtraOptions));
    //   } else {
    //     defaultMiddlewares.push(this.loadBodyParser().text(actionMetadata.bodyExtraOptions));
    //   }
    // }

    if (actionMetadata.isAuthorizedUsed) {
      defaultMiddlewares.push((context: any, next: Function) => {
        if (!this.authorizationChecker)
          throw new AuthorizationCheckerNotDefinedError();

        const action: Action = {
          request: context.request,
          response: context.response,
          context,
          next,
        };
        try {
          const checkResult =
            actionMetadata.authorizedRoles instanceof Function
              ? getFromContainer<RoleChecker>(
                  actionMetadata.authorizedRoles,
                  action
                ).check(action)
              : this.authorizationChecker(
                  action,
                  actionMetadata.authorizedRoles
                );

          const handleError = (result: any) => {
            if (!result) {
              const error =
                actionMetadata.authorizedRoles.length === 0
                  ? new AuthorizationRequiredError(action)
                  : new AccessDeniedError(action);
              return this.handleError(error, actionMetadata, action);
            } else {
              return next();
            }
          };

          if (isPromiseLike(checkResult)) {
            return checkResult
              .then((result) => handleError(result))
              .catch((error) =>
                this.handleError(error, actionMetadata, action)
              );
          } else {
            return handleError(checkResult);
          }
        } catch (error) {
          return this.handleError(error, actionMetadata, action);
        }
      });
    }

    // if (actionMetadata.isFileUsed || actionMetadata.isFilesUsed) {
    //   const multer = this.loadMulter();
    //   actionMetadata.params
    //     .filter(param => param.type === 'file')
    //     .forEach(param => {
    //       defaultMiddlewares.push(multer(param.extraOptions).single(param.name));
    //     });
    //   actionMetadata.params
    //     .filter(param => param.type === 'files')
    //     .forEach(param => {
    //       defaultMiddlewares.push(multer(param.extraOptions).array(param.name));
    //     });
    // }

    // user used middlewares
    const uses = actionMetadata.controllerMetadata.uses.concat(
      actionMetadata.uses
    );
    const beforeMiddlewares = this.prepareMiddlewares(
      uses.filter((use) => !use.afterAction)
    );
    const afterMiddlewares = this.prepareMiddlewares(
      uses.filter((use) => use.afterAction)
    );

    // prepare route and route handler function
    const route = ActionMetadata.appendBaseRoute(
      this.routePrefix,
      actionMetadata.fullRoute
    );
    const routeHandler = (context: any, next: () => Promise<any>) => {
      const options: Action = {
        request: context.req,
        response: context.res,
        context,
        next,
      };
      return executeCallback(options);
    };

    // This ensures that a request is only processed once. Multiple routes may match a request
    // e.g. GET /users/me matches both @All(/users/me) and @Get(/users/:id)), only the first matching route should
    // be called.
    // The following middleware only starts an action processing if the request has not been processed before.
    const routeGuard = async (context: any, next: () => Promise<any>) => {
      if (!context.get("routingControllersStarted")) {
        context.set("routingControllersStarted", true);
        await next();
      }
    };

    this.hono[actionMetadata.type.toLowerCase()](route, routeGuard);
    beforeMiddlewares.forEach((x) => {
      this.hono[actionMetadata.type.toLowerCase()](route, x);
    });
    defaultMiddlewares.forEach((x) => {
      this.hono[actionMetadata.type.toLowerCase()](route, x);
    });
    this.hono[actionMetadata.type.toLowerCase()](route, routeHandler);

    afterMiddlewares.forEach((x) => {
      this.hono[actionMetadata.type.toLowerCase()](route, x);
    });
  }

  /**
   * Registers all routes in the framework.
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  registerRoutes() {}

  /**
   * Gets param from the request.
   */
  getParamFromRequest(action: Action, param: ParamMetadata): any {
    const request: any = action.request;
    const context: any = action.context;
    switch (param.type) {
      case "body":
        return request.body;

      case "body-param":
        return request.body[param.name];

      case "param":
        return request.param(param.name);

      case "params":
        return request.param();

      case "session-param":
        return request.session[param.name];

      case "session":
        return request.session;

      case "state":
        throw new Error(
          "@State decorators are not supported by express driver."
        );

      case "query":
        return request.query(param.name);

      case "queries":
        return request.query();

      case "header":
        return request.headers[param.name.toLowerCase()];

      case "headers":
        return request.headers;

      case "file":
        return request.file;

      case "files":
        return request.files;

      case "cookie":
        return getCookie(context, param.name);

      case "cookies":
        // if (!request.headers.cookie) return {};
        return getCookie(context);
    }
  }

  /**
   * Handles result of successfully executed controller action.
   */
  handleSuccess(result: any, action: ActionMetadata, options: Action): void {
    // if the action returned the response object itself, short-circuits
    // if (result && result === options.response) {
    //   options?.next?.();
    //   return;
    // }

    // transform result if needed
    result = this.transformResult(result, action, options);

    // set http status code
    if (result === undefined && action.undefinedResultCode) {
      if (action.undefinedResultCode instanceof Function) {
        throw new (action.undefinedResultCode as any)(options);
      }
      options.context.status(action.undefinedResultCode);
    } else if (result === null) {
      if (action.nullResultCode) {
        if (action.nullResultCode instanceof Function) {
          throw new (action.nullResultCode as any)(options);
        }
        options.context.status(action.nullResultCode);
      } else {
        options.context.status(204);
      }
    } else if (action.successHttpCode) {
      options.context.status(action.successHttpCode);
    }

    // apply http headers
    Object.keys(action.headers).forEach((name) => {
      options.context.header(name, action.headers[name]);
    });

    if (action.redirect) {
      // if redirect is set then do it
      if (typeof result === "string") {
        return options.context.redirect(result);
      } else if (result instanceof Object) {
        // options.response.redirect(templateUrl(action.redirect, result));
      } else {
        return options.context.redirect(action.redirect);
      }
      // } else if (action.renderedTemplate) {
      //   // if template is set then render it
      //   const renderOptions = result && result instanceof Object ? result : {};

      //   return options.context.render(action.renderedTemplate, renderOptions, (err: any, html: string) => {
      //     if (err && action.isJsonTyped) {
      //       return options.next?.(err);
      //     } else if (err && !action.isJsonTyped) {
      //       return options.next?.(err);
      //     } else if (html) {
      //       options.context.send(html);
      //     }
      //     options.next?.();
      //   });
    } else if (result === undefined) {
      // throw NotFoundError on undefined response

      if (action.undefinedResultCode) {
        if (action.isJsonTyped) {
          return options.context.json();
        } else {
          return options.context.send();
        }
      } else {
        throw new NotFoundError();
      }
    } else if (result === null) {
      // send null response
      if (action.isJsonTyped) {
        return options.context.json(null);
      } else {
        return options.context.send(null);
      }
      // } else if (result instanceof Buffer) {
      //   // check if it's binary data (Buffer)
      //   options.response.end(result, 'binary');
      // } else if (result instanceof Uint8Array) {
      //   // check if it's binary data (typed array)
      //   options.response.end(Buffer.from(result as any), 'binary');
    } else if (result.pipe instanceof Function) {
      // result.pipe(options.context);
    } else {
      // send regular result
      if (action.isJsonTyped) {
        return options.context.json(result);
      } else {
        return options.context.text(result);
      }
    }

    return options.context.text("anasun2");
  }

  /**
   * Handles result of failed executed controller action.
   */
  handleError(
    error: any,
    action: ActionMetadata | undefined,
    options: Action
  ): any {
    if (this.isDefaultErrorHandlingEnabled) {
      const response: any = options.response;
      const context: any = options.context;

      // set http code
      // note that we can't use error instanceof HttpError properly anymore because of new typescript emit process
      if (error.httpCode) {
        context.status(error.httpCode);
      } else {
        context.status(500);
      }

      // apply http headers
      if (action) {
        Object.keys(action.headers).forEach((name) => {
          context.header(name, action.headers[name]);
        });
      }

      // send error content
      if (action && action.isJsonTyped) {
        context.json(this.processJsonError(error));
      } else {
        context.send(this.processTextError(error)); // todo: no need to do it because express by default does it
      }
    }
    options.next?.(error);
  }

  // -------------------------------------------------------------------------
  // Protected Methods
  // -------------------------------------------------------------------------

  /**
   * Creates middlewares from the given "use"-s.
   */
  protected prepareMiddlewares(uses: UseMetadata[]) {
    const middlewareFunctions: Function[] = [];
    uses.forEach((use) => {
      if (use.middleware.prototype && use.middleware.prototype.use) {
        // if this is function instance of MiddlewareInterface
        middlewareFunctions.push(
          async (context: any, next: (err?: any) => Promise<any>) => {
            try {
              return await getFromContainer<HonoMiddlewareInterface>(
                use.middleware
              ).use(context, next);
            } catch (error) {
              return await this.handleError(error, undefined, {
                request: context.req,
                response: context,
                context,
                next,
              });
            }
          }
        );
      } else {
        middlewareFunctions.push(use.middleware);
      }
    });
    return middlewareFunctions;
  }
  /**
   * Dynamically loads express module.
   */
  protected loadHono() {
    // eslint-disable-next-line
    // if (require) {
    if (!this.hono) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        this.hono = new Hono();
      } catch (e) {
        throw new Error(
          "hono package was not found installed. Try to install it: npm install hono --save"
        );
      }
    }
    // } else {
    //   throw new Error('Cannot load hono. Try to install all required dependencies.');
    // }
  }

  /**
   * Dynamically loads body-parser module.
   */
  //   protected loadBodyParser() {
  //     try {
  //       return require('body-parser');
  //     } catch (e) {
  //       throw new Error('body-parser package was not found installed. Try to install it: npm install body-parser --save');
  //     }
  //   }

  /**
   * Dynamically loads multer module.
   */
  //   protected loadMulter() {
  //     try {
  //       return require('multer');
  //     } catch (e) {
  //       throw new Error('multer package was not found installed. Try to install it: npm install multer --save');
  //     }
  //   }
}

function isPromiseLike(arg: any): arg is Promise<any> {
  return (
    arg != null && typeof arg === "object" && typeof arg.then === "function"
  );
}
