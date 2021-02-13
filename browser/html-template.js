import assert from '../assert.js';
import Logger from '../logger.js';
import util from '../util.js';
import dom from './dom.js';

const log = Logger.create("HtmlTemplate");

export class TemplateValue {
    constructor(value) {
        this._value = value;
    }

    get value(){
        return this._value;
    }

    set value(val) {
        this._value = val;
    }

    set(element) {
        log.error("derived class did not implement the set(element) method ",this.constructor.name);
    }
}

export class HtmlValue extends TemplateValue {
    constructor(value=null) {
        super(value);
    }

    set(element) {
        element.innerHTML = this._value;
    }
}

export class TextValue extends TemplateValue {
    constructor(value=null) {
        super(value);
    }

    set(element) {
        element.innerText = this._value;
    }
}


export class AttributeValue extends TemplateValue {
    constructor(attributeName, value=null) {
        super(value);
        this.attributeName = attributeName;
    }

    set(element) {
        element.setAttribute(this.attributeName,this._value);
    }
}


export class DataValue extends TemplateValue {
    constructor(attributeName, value=null) {
        super(value);
        this.attributeName = attributeName;
    }

    set(element) {
        var name = this.attributeName;
        if (!name.startsWith('data-')) {
            name = 'data-'+name;
        }
        element.setAttribute(name,this._value);
    }
}

export class HtmlTemplate {
    constructor(templateElement) {
        assert.type(templateElement,HTMLElement,"HtmlTemplate requires an HTMLElement");
        this.templateElement = templateElement;
        if (typeof this.templateElement === 'string') {
            this.nodes = this.stringToNodes(this.templateElement);
        } else if (this.templateElement.tagName == 'SCRIPT') {
            // if the template is a script, process all elements in it
            this.nodes = this.stringToNodes(this.templateElement.innerHTML);
        } else {
            // the template is not a script, so there is only one node to process
            this.nodes = [this.templateElement];
        }
    }

    stringToNodes(text) {
        const parent = document.createElement('div');
        parent.innerHTML = text.trim();
        return Array.from(parent.childNodes);
    }


    // values is a map of selectors and values
    fill(values) {
        const filled = [];
        this.nodes.forEach(node=>{
            const clone = node.cloneNode(true);
            Object.keys(values).forEach(selector=>{
                const value = values[selector];
                const elements = dom.find(clone,selector);
                elements.forEach(element=>{
                    this.setValue(element,value);
                });
            });
            filled.push(clone);
        });
        return filled;
    }

    setValue(element,value) {
        if (util.isEmpty(value)) {
            element.innerHTML = '';
            return;
        }
        if (Array.isArray(value)) {
            value.forEach(val=>this.setValue(element,val));
        } else if (typeof value === 'string' || typeof value === 'number'){
            element.innerText = value;
        } else if (value instanceof TemplateValue) {
            value.set(element);
        } else {
            log.error('unknown template value type ',value);
        }

    }

}
export default HtmlTemplate;