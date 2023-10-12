import "reflect-metadata";
import { Hono } from 'hono'
import { useHonoServer } from "@typeflare/routing-controllers"
import {
	JsonController,
	Get,
	Param,
} from "routing-controllers";

const app = new Hono()

@JsonController('')
class TestController {
  @Get('/:id')
  getOne(@Param('id') id: string): any {
    return {
      login: id,
    };
  }

  @Get()
  getTwo(): any {
    return {
      a: 1
    }
  }

  @Get('some')
  getThree(): any {
    return {
      a: 1
    }
  }
}


useHonoServer(app, {
	controllers: [TestController]
})



export default app