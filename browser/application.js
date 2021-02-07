import Logger from "../logger";
import assert from '../assert.js'
const log = Logger.create("Application");
export var app = null;

export class Application {
    constructor(name="unnamed") {

        app = this;
        this.name = name;
        log.debug("application",name,"initialized");
    }

    start() {
        log.debug("application",this.name,"started");
    }
}

export default Application;