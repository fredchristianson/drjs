"use strict";

import {logWriterManager,LOG_LEVEL,LogLevel, LoggerModule, LogWriter, LogMessage} from './log-writer.js';
import {OptionDef,default as Util} from './util.js';
import ENV from './env.js';

//export const LOG_LEVEL = BASE_LOG_LEVEL;

const OptionDefs = [
    new OptionDef("writers",LogWriter,null),
    new OptionDef("level",LogLevel, ENV.DEBUG ? LOG_LEVEL.DEBUG : LOG_LEVEL.INFO)
];

export class Logger {
    constructor(moduleName,...options) {
        this.module = new LoggerModule(moduleName);
        this.options = Util.getOptions(OptionDefs, options);
    } 

    write(messages) {
        Util.toArray(messages).forEach(message=>{
            logWriterManager.write(message,this.writers);
        });
    }

    log(level,messageParts) { 
        // messageParts is an array of all the arguments passed. for example
        //  log.debug("a",1,{foo:bar})
        // results in messageParts = ["a",1,{foo:bar}]
        const message = new LogMessage(level,messageParts,this.module);
        logWriterManager.write(message,this.writers);
    }

    debug(...msg) {
        this.log(LOG_LEVEL.DEBUG,msg);
    }

    info(...msg) {
        this.log(LOG_LEVEL.INFO,msg);
    }

    warn(...msg) {
        this.log(LOG_LEVEL.WARN,msg);
    }

    error(...msg) {
        this.log(LOG_LEVEL.ERROR,msg);
    }

    fatal(...msg) {
        this.log(LOG_LEVEL.FATAL,msg);
        if (typeof process !== "undefined" && typeof process.abort === "function"){
            process.abort();
        }
        this.log(LOG_LEVEL.ERROR,"log.fatal called but environment doesn't support aborting");
    }
}

export function createLogger(moduleName,level = LOG_LEVEL.DEFAULT) {
    return new Logger(moduleName,level);
}

if (typeof window != 'undefined') {
    window.drjs = window.drjs || {};
    window.drjs.createLogger = createLogger;
}

export default {create: createLogger};