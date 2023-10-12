import 'reflect-metadata';

import { createServer, RoutingControllersOptions, JsonController, Get, Param } from 'routing-controllers'
import { HonoDriver } from './driver/HonoDriver';
// import { serve } from '@hono/node-server'

export function useHonoServer<T>(honoApp: T, options?: RoutingControllersOptions): T {
    const driver = new HonoDriver(honoApp);
    return createServer(driver, options);
  }
  
  /**
   * Registers all loaded actions in your koa application.
   */
  export function createHonoServer(options?: RoutingControllersOptions): any {
    const driver = new HonoDriver();
    return createServer(driver, options);
  }
  

  // @JsonController('')
  // class TestController {
  //   @Get('/:id')
  //   getOne(@Param('id') id: string): any {
  //     return {
  //       login: id,
  //     };
  //   }

  //   @Get()
  //   getTwo(): any {
  //     return {
  //       a: 1
  //     }
  //   }

  //   @Get('some')
  //   getThree(): any {

  //     console.log("HATVAN some")
  //     return {
  //       a: 1
  //     }
  //   }
  // }



  // let honoServer = createHonoServer({
  //   controllers: [TestController]
  // })

  // serve({
  //   fetch: honoServer.fetch,
  //   port: 3001,
  // }, (x) => {
  //   console.log(x)
  // })
  