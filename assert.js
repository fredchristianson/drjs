import Logger from './logger.js';
const log = Logger.create('Assert');

export class Assert {
    equal(val1,val2,message=null) {
        if (val1 == val2) {
            return;
        }

        const err = new Error(message || "assert.equal() failed");
        log.error(err);
        throw err;
    }

    notEmpty(val,message) {
        try {
            if (val == null || (typeof val != 'string' && !Array.isArray(val))) {
                throw new Error(message || 'assert.notEmpty() failed.  Requires string or array');   
            } else if (typeof val == 'string' && val.trim().length == 0) {
                throw new Error(message || 'assert.notEmpty() failed.  String is empty');   
            } else if (Array.isArray(val) && val.length == 0) {
                throw new Error(message || 'assert.notEmpty() failed.  Array is empty');   
            } 
        } catch(err) {
            log.error(err);
            throw err;
        }
    }

    notNull(item,message) {
        // treat "undefined" and null items the same
        if (typeof item === 'undefined' || item === null) {
            message || "value cannot be null";
            log.error(message);
            throw new Error(message);
        }
    }

    null(item,message) {
        // treat "undefined" and null items the same
        if (typeof item !== 'undefined' && item !== null) {
            message || "expected null value";
            log.error(message);
            throw new Error(message);
        }
    }

    empty(item,message) {
        var isEmpty = false;
        if (typeof item === "undefined" || item === null) {
            isEmpty = true;
        } else if (typeof item === 'string'){
            isEmpty = true;
        } else  if (Array.isArray(item)) {
            isEmpty = true;
        }
        if (!isEmpty) {
            message = message || "expected value to be an empty string or array";
            log.error(mesage);
            throw new Error(message);
        }
    }
    range(val,min,max,message = null) {
        if (val < min || val > max) {
            throw new Error(message || `value must be at least ${min} and at most ${max}: ${val}`);
        }
    }

    type(object, type,message) {
        if (! (object instanceof type)){
            log.error(message || "object is the wrong type");
            throw new Error(message);
        }
    }
}

export default new Assert();