"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHonoServer = exports.useHonoServer = void 0;
require("reflect-metadata");
const routing_controllers_1 = require("routing-controllers");
const HonoDriver_1 = require("./driver/HonoDriver");
function useHonoServer(honoApp, options) {
    const driver = new HonoDriver_1.HonoDriver(honoApp);
    return (0, routing_controllers_1.createServer)(driver, options);
}
exports.useHonoServer = useHonoServer;
/**
 * Registers all loaded actions in your koa application.
 */
function createHonoServer(options) {
    const driver = new HonoDriver_1.HonoDriver();
    return (0, routing_controllers_1.createServer)(driver, options);
}
exports.createHonoServer = createHonoServer;
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
//# sourceMappingURL=index.js.map