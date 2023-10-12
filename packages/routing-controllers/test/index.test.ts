import "reflect-metadata";

import {
  JsonController,
  Param,
  Body,
  Get,
  Redirect,
} from "routing-controllers";

import {
  createExpressServer,
  getMetadataArgsStorage,
} from "routing-controllers";
import { Hono } from "hono";
import DoneCallback = jest.DoneCallback;
import axios from "./utilities/axios";
import HttpStatusCodes from "http-status-codes";
import { createHonoServer } from "../src/index";
import { serve } from "@hono/node-server";

describe(`last`, () => {
  let honoServer: Hono;

  describe("dynamic redirect", function () {
    beforeAll((done: DoneCallback) => {
      getMetadataArgsStorage().reset();

      @JsonController("/users")
      class TestController {
        @Get("/:id")
        getOne(@Param("id") id: string): any {
          return {
            login: id,
          };
        }
      }

      @JsonController()
      class RedirectController {
        @Get("/template")
        @Redirect("/users/:owner")
        template(): any {
          return { owner: "pleerock", repo: "routing-controllers" };
        }

        @Get("/original")
        @Redirect("/users/pleerock")
        original(): void {
          // Empty
        }

        @Get("/override")
        @Redirect("https://api.github.com")
        override(): string {
          return "/users/pleerock";
        }
      }

      honoServer = createHonoServer();

      console.log(
        serve(
          {
            fetch: honoServer.fetch,
            port: 3001,
          },
          (x) => {
            console.log(x);
            done();
          }
        )
      );
    });

    afterAll((done: DoneCallback) => {
      // honoServer.close()
    });

    it("using template", async () => {
      expect.assertions(2);
      const response = await axios.get("/template");
      expect(response.status).toEqual(HttpStatusCodes.OK);
      expect(response.data.login).toEqual("pleerock");
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
