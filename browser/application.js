import Logger from "./logger";
import assert from './assert.js'
const log = Logger.create("Application");
export var theApp = null;

export class Application {
    constructor(name="unnamed") {

        thApp = this;
        this.name = name;
        log.debug("application",name,"initialized");
    }

    start() {
        log.debug("application",this.name,"started");
    }
}

export default Application;