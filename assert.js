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
}

export default new Assert();