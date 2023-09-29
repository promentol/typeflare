"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const routing_controllers_1 = require("routing-controllers");
const routing_controllers_2 = require("routing-controllers");
const axios_1 = __importDefault(require("./utilities/axios"));
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const index_1 = require("../src/index");
const node_server_1 = require("@hono/node-server");
describe(`last`, () => {
    let honoServer;
    describe('dynamic redirect', function () {
        beforeAll((done) => {
            (0, routing_controllers_2.getMetadataArgsStorage)().reset();
            let TestController = class TestController {
                getOne(id) {
                    return {
                        login: id,
                    };
                }
            };
            __decorate([
                (0, routing_controllers_1.Get)('/:id'),
                __param(0, (0, routing_controllers_1.Param)('id'))
            ], TestController.prototype, "getOne", null);
            TestController = __decorate([
                (0, routing_controllers_1.JsonController)('/users')
            ], TestController);
            let RedirectController = class RedirectController {
                template() {
                    return { owner: 'pleerock', repo: 'routing-controllers' };
                }
                original() {
                    // Empty
                }
                override() {
                    return '/users/pleerock';
                }
            };
            __decorate([
                (0, routing_controllers_1.Get)('/template'),
                (0, routing_controllers_1.Redirect)('/users/:owner')
            ], RedirectController.prototype, "template", null);
            __decorate([
                (0, routing_controllers_1.Get)('/original'),
                (0, routing_controllers_1.Redirect)('/users/pleerock')
            ], RedirectController.prototype, "original", null);
            __decorate([
                (0, routing_controllers_1.Get)('/override'),
                (0, routing_controllers_1.Redirect)('https://api.github.com')
            ], RedirectController.prototype, "override", null);
            RedirectController = __decorate([
                (0, routing_controllers_1.JsonController)()
            ], RedirectController);
            honoServer = (0, index_1.createHonoServer)();
            console.log((0, node_server_1.serve)({
                fetch: honoServer.fetch,
                port: 3001,
            }, (x) => {
                console.log(x);
                done();
            }));
        });
        afterAll((done) => {
            // honoServer.close()
        });
        it('using template', async () => {
            expect.assertions(2);
            const response = await axios_1.default.get('/template');
            expect(response.status).toEqual(http_status_codes_1.default.OK);
            expect(response.data.login).toEqual('pleerock');
        });
        // it('using override', async () => {
        //   expect.assertions(2);
        //   const response = await axios.get('/override');
        //   expect(response.status).toEqual(HttpStatusCodes.OK);
        //   expect(response.data.login).toEqual('pleerock');
        // });
        // it('using original', async () => {
        //   expect.assertions(2);
        //   const response = await axios.get('/original');
        //   expect(response.status).toEqual(HttpStatusCodes.OK);
        //   expect(response.data.login).toEqual('pleerock');
        // });
    });
});
//# sourceMappingURL=index.test.js.map