import {OptionDef, default as util} from './util.js';
import ENV from './env.js';

export class LogLevel{
    constructor(value,name) {
        this.value = value;
        this.name = name;
    }

    toString() {
        return this.name;
    }
}

export const LOG_LEVEL = {
    DEBUG: new LogLevel(100,"DEBUG"),
    INFO: new LogLevel(80,"INFO"),
    WARN: new LogLevel(60,"WARN"),
    ERROR: new LogLevel(40,"ERROR"),
    FATAL: new LogLevel(0,"FATAL")
};

if (ENV.DEBUG) {
    LOG_LEVEL.DEFAULT= new LogLevel(100,"DEBUG");
} else {
    LOG_LEVEL.DEFAULT= new LogLevel(60,"WARN");
}

export class LoggerModule{
    constructor(name) {
        this.moduleName = name;
    }

    get name(){
        return this.moduleName;
    }


}

export class LogMessage {
    
    constructor(level,text,module){
        this.level = level;
        this.text = text;
        this.module = module;
    }

    isError() {
        return this.level <= LOG_LEVEL.WARN;
    }

}



export class LogFormatter {
    constructor() {
        this.maxLengthValue == null;
    }

    get maxLength() {
        return this.maxLengthValue;
    }

    set maxLength(len) {
        if (!Number.isNaN(len)) {
            this.maxLengthValue = len;
        }
        else {
            throw new Error("invalid value passed to maxLength()");
        }
    }

    format(message) {
        // message may be a single item or array of items (e.g. ["this","is","the value:",123]);
        const textParts = util.toArray(message.text);
        const formatted = textParts.map(part=>this.formatPart(part));
        var value = this.getMessagePrefix(message) + formatted.join(' ');
        if (this.maxLength !== null && value.length > this.maxLength) {
            return value.substr(0,this.maxLength)+"...";
        }
        if (message.isError()) {
            // it's unlikely we will have more than 1 Error, but show the stack trace for multiple if there are many
            const errors = textParts.filter(part=> (part instanceof Error));
            errors.forEach(error=>{
                const stack = this.getStack(error);
                if (!util.isEmpty(stack)) {
                    value = value + stack;
                }
            });
        }
        return value;
    }

    getStack(error) {
        if (util.isNull(error) || util.isNull(error.stack)){
            return "--no stack--";
        }
        return (error.stack.split('\n').map(l=>`\n\t\t${l}`));
    }

    formatPart(part) {
        var text = util.toString(part);

        return text;
    }

    getMessagePrefix(message) {
        const level = message.level.toString();
        const time = util.formatTime(Date.now(),"HH:MM:SS.ss");
        const module = message.module.name;
        return `${util.padRight(level,7)} | ${util.padRight(time,14)} | ${util.padRight(module,20)} |`;
    }
}

export const defaultLogFormatter = new LogFormatter();

const LogWriterOptions = [
    new OptionDef("level",LogLevel, ENV.DEBUG ? LOG_LEVEL.DEBUG : LOG_LEVEL.INFO),
    new OptionDef('formatter',LogFormatter,defaultLogFormatter),
    new OptionDef('includeModules',null,'*'),
    new OptionDef('excludeModules',null,null),
    new OptionDef('filter','function',null)
];

export class LogWriter {
    constructor(options) {
        this.options = util.getOptions(LogWriterOptions,options);
        logWriterManager.addWriter(this);
    }

    getFormatter(message) {
        // derived classes may choose different formatters based on the message (e.g. level or text)
        return this.options.formatter;
    }

    filterMatch(message) {
        if (this.options.level.value < message.level.value) {
         return false;
        } 
        if (this.options.excludeModules && this.moduleMatch(this.options.excludeModules,message)) {
            return false;
        }

        if (this.options.filter && !this.options.filter(message)) {
            return false;
        }
        return this.options.includeModules && this.moduleMatch(this.options.includeModules,message);
    }

    moduleMatch(moduleList, message) {
        if (util.isNull(moduleList)) {
            return false;
        }

        const accept = util.toArray(moduleList);
        const level = message.level.value;
        const moduleName = message.module.name;
        return accept.some(module=>{
            if (typeof module == 'string') {
                return module == '*' || module == moduleName;
            } else if (typeof module == 'function' && module.name == moduleName) {
                return true;
            }
            return false;
        });
    }

    write(text,origMessage) {
        throw new Error(`LogWriter ${this.constructor.name} must implement write()`);
    }
}

export class ConsoleWriter extends LogWriter {
    constructor(...options) {
        super(options);
    }

    write(text, origMessage) {
        if (origMessage.level.value <= LOG_LEVEL.ERROR.value) {
            console.error(text);
        } else {
            console.log(text);
        }
    }
}

export class InMemoryWriter extends LogWriter {
    constructor(...options) {
        super(options);
        this.lines = [];
    }

    write(text, origMessage) {
        this.lines.push(origMessage);
    }

    getLines() {
        return this.lines;
    }
}



export class LogWriterManager {
    constructor() {
        this.writers = [];
    }

    addWriter(writer) {
        const exists = this.writers.find((exists)=>{
            return exists === writer;
        });
        if (typeof exists === "undefined") {
            this.writers.push(writer);
        }
    }

    removeWriter(writer) {
        util.removeItem(this.writer);
    }
    
    write(message,writers=null) {
        writers = util.toArray(writers);
        const formats = {};
        this.writers.forEach(writer=>{
            if (util.isEmpty(writers) || writers.includes(writer) ) {
                if (writer.filterMatch(message)) { 
                    var formatter = writer.getFormatter();
                    var text = formats[formatter]; 
                    // if this message has already been formatted it's not "undefined"
                    // multiple writers may use the same formatter so don't need to reformat.
                    if (typeof text !== "undefined") {
                        text = formats[formatter];
                    } else {
                        text = formatter.format(message);
                        formats[formatter] = text;
                    }
                    writer.write(text,message);
                }
            }
        });
        
    }
}

export const logWriterManager = new LogWriterManager();


export default LogWriter;