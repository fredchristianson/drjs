import assert from '../assert.js';
import Logger from '../logger.js';
import util from '../util.js';

const log = Logger.create("HttpRequest");

export class HttpRequest {
    constructor(baseUrl='/') {
        this.baseUrl = baseUrl;
    }

    get(path,params=null,responseType='html') {
        return new Promise((resolve,reject)=>{
            const fullPath = this.baseUrl+encodeURI(path).replaceAll('//','/');
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
    }
}

const httpRequest = new HttpRequest();
export default httpRequest;