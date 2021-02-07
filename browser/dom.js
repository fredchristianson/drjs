import assert from '../assert.js';
import Logger from '../logger.js';
import util from '../util.js';

const log = Logger.create("DOM");

export class DOM {
    constructor(rootSelector = null) {
        this.rootSelector = rootSelector;
        this.root = document.querySelector(rootSelector);
    }

    first(selector) {
        const element = document.querySelector(selector);
        return element;
    }

    find(selector) {
        const elements = document.querySelectorAll(selector);
        return Array.from(elements);
    }
}

export default new DOM();