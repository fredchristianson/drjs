import assert from '../assert.js';
import Logger from '../logger.js';
import util from '../util.js';
import componentLoader from './component-loader.js';
import dom from './dom.js';

const log = Logger.create("Component");

export class ComponentBase {
    constructor(selector,htmlName) {
        this.load(selector,htmlName);
    }

    load(selector,htmlName) {
        this.loadingSelector = selector;
        this.loadingHtmlName = htmlName;
        componentLoader.load(htmlName)
        .then(elements=>{
            const parent = dom.first(selector);
            if (parent == null) {
                throw new Error(`cannot find parent selector ${selector} for html file ${htmlName}`);
            }
            parent.innerHTML = '';
            var body = document.body;
            elements.forEach(element=>{
                if (element.tagName == 'SCRIPT' && !util.isEmpty(element.getAttribute('src'))) {
                    const script = document.createElement('script');
                    script.src = element.getAttribute('src');
                    body.append(script);
                } else if (element.tagName == 'SCRIPT' && element.getAttribute('type') === 'application/javascript') {
                    const script = document.createElement('script');
                    script.innerHTML = element.innerHTML;
                    body.append(script);
                } else {
                    parent.appendChild(element);
                }
            });
            this.onHtmlLoaded(parent);
            this.htmlName = htmlName;
            this.selector = selector;
        })
        .catch(err=>{
            log.error("failed to load comonent html file ",htmlName,err);
        });
    }

    onHtmlLoaded() {
        // derived class can override if it needs to modify html
    }
}

export class TemplateComponent extends ComponentBase {
    constructor(selector,htmlName) {
        super(selector,htmlName);
    }
}

export default ComponentBase;