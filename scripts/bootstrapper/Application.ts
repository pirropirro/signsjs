import { forEach } from "lodash";
import { Container } from "inversify";
import getDecorators from "inversify-inject-decorators";

import { IModule } from "./IModule";
import { ControllerUtil } from "./Route";
import { IExpress } from "../engine/IExpress";
import { MainModule } from "../modules/MainModule";
import { IMiddleware } from '../engine/IMiddleware';
import { IController, IHandlerFactory } from '../engine/IController';

let container = new Container();
export let { lazyInject, lazyMultiInject } = getDecorators(container);

export class Application {
    protected container = container;
    constructor() {
        this.register(new MainModule());
    }

    register(module: IModule): boolean {
        module.modules(this.container);
        return true;
    }

    run() {
        let exp = this.container.get<IExpress>("IExpress");
        let factory = this.container.get<IHandlerFactory>("IHandlerFactory");

        this.container.getAll<IMiddleware>("IMiddleware").forEach(m => exp.app.use(m.transform.bind(m)));
        this.container.getAll<IController>("IController").forEach(c => {
            let { base, routes } = ControllerUtil.getMetadata(c.constructor);
            forEach(routes, (metadata => exp.app[metadata.type](`/api${base}${metadata.location}`, factory.create(c, metadata))));
        });

        exp.start();
    }
}