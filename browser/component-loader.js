import assert from '../assert.js';
import Logger from '../logger.js';
import util from '../util.js';
import httpRequest from './http-request.js';

const log = Logger.create("ComponentLoader");

export class ComponentLoader {
    constructor() {
        this.componentDirectory = 'component';
    }

    load(htmlFile) {
        return new Promise((resolve,reject) =>{
            assert.notEmpty(htmlFile);
            const fileExt = htmlFile.split('.');
            var fileName = htmlFile;
            var ext = '.html';
            if (fileExt.length > 1) {
                ext = fileExt[fileExt.length-2];
                file = htmlFile.substr(htmlFile.length-ext.length);
            }
            const filename=`${this.componentDirectory}/${fileName}${ext}`;
            httpRequest.get(filename)
            .then(contents=>{
                const htmlObject = document.createElement('div');
                htmlObject.innerHTML = contents.trim();
                const elements = Array.from(htmlObject.childNodes);
                resolve(elements);
            });
        });
    }
}

const componentLoader = new ComponentLoader();
export default componentLoader;