import Logger from '../../shared/js/logger.js';
const log = Logger.create('Assert');

export class AssertionError extends Error {
    constructor(message) {
        super(message);
    }
}
export class Assert {
    test(func,message) {
        if (!func()) {
            const errorMessage = message || "assert test failed";
            console.error(errorMessage);
            throw new AssertionError(errorMessage);
        }
    }

    equal(val1,val2,message=null) {
        this.test(()=>val1==val2,message || "assert.equal() failed");
    }

    notEqual(val1,val2,message=null) {
        this.test(()=>val1!=val2,message || "assert.notEqual() failed");
    }

    null(val1,message=null) {
        this.test(()=>val1===null || (typeof val1 === 'undefined'),message || "assert.null() failed");
    }

    notNull(val1,message=null) {
        this.test(()=>val1!==null && (typeof val1 !== 'undefined'),message || "assert.notNull() failed");
    }

    range(val,minValue,maxValue,message) {
        this.test(()=>val>=minValue && val <= maxValue,message || "assert.notEqual() failed");
    }

    notRange(val,minValue,maxValue,message) {
        this.test(()=>val<minValue || val > maxValue,message || "assert.notEqual() failed");
    }

}
