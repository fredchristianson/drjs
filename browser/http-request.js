import assert from '../assert.js';
import Logger from '../logger.js';
import util from '../util.js';

const log = Logger.create("HttpRequest");

export class HttpRequest {
    constructor(baseUrl='/') {
        this.baseUrl = baseUrl;
    }

    async get(path,params=null,responseType='text') {
        const promise = new Promise((resolve,reject)=>{
            
            const fullPath = util.combinePath(this.baseUrl,encodeURI(path))+this.encodeParams(params);
            var xhttp = new XMLHttpRequest();
            xhttp.responseType = responseType;
            xhttp.onreadystatechange = ()=> {
                if (xhttp.readyState == 4 && xhttp.status< 400) {
                    resolve(xhttp.response);
                }
                else if (xhttp.readyState == 4 && xhttp.status >=400) {
                    reject(xhttp.responseText);
                }
            };
            xhttp.open("GET", fullPath, true);
            xhttp.send();
        });
        const result = await promise;
        return result;
    }

    encodeParams(params) {
        if (params == null) {
            return '';
        }
        const pairs = [];
        Object.keys(params).forEach(key=>{
            pairs.push(`${key}=${encodeURIComponent(params[key])}`);
        });
        return `?${pairs.join('&')}`;
    }
}

const httpRequest = new HttpRequest();
export default httpRequest;