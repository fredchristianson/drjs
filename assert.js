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
        }
    }
}

export default new Assert();