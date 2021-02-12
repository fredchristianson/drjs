import assert from '../assert.js';
import Logger from '../logger.js';
import util from '../util.js';

const log = Logger.create("DOM");

export class DOM {
    constructor(rootSelector = null) {
        this.rootSelector = rootSelector;
        this.root = document.querySelector(rootSelector);
    }

    first(parent,selector) {
        // if 1 arg is passed parent is assumed to be the document
        // and the arg is the selector
        if (typeof parent === 'string') {
            if (selector != null) {
                log.error("invalid parent for dom.find() ",parent);
                return [];
            }
            selector = parent;
            parent = document;
        } 
        const element = parent.querySelector(selector);
        
        return element;
    }

    find(parent,selector= null) {
        // if 1 arg is passed parent is assumed to be the document
        // and the arg is the selector
        if (typeof parent === 'string') {
            if (selector != null) {
                log.error("invalid parent for dom.find() ",parent);
                return [];
            }
            selector = parent;
            parent = document;
        } 
        const elements = document.querySelectorAll(selector);
        
        return Array.from(elements);
    }

    hide(element) {
        util.toArray(element).forEach(elem=>{
            const oldDisplay = this.getStyle(elem,'display');
            this.setStyle(elem,'display','none');
            this.setData(elem,'drjs-old-display',oldDisplay);
        });
    }
    show(element) {
        util.toArray(element).forEach(elem=>{
            const display = this.getData(elem,'drjs-old-display') || this.getData(elem,'drjs-default-display')  || 'block';
            this.setStyle(elem,'display',display);
        });
    }

    setData(element, name,val) {
        assert.notNull(element,"setData requires an element");
        assert.notEmpty(name,"setData requires a name");
        if (!name.startsWith('data-')){
            name = `data-${name}`;
        }
        util.toArray(element).forEach(elem=>{
            elem.setAttribute(name,val);
        });
    }

    getData(element, name) {
        assert.notNull(element,"setData requires an element");
        assert.notEmpty(name,"setData requires a name");
        if (!name.startsWith('data-')){
            name = `data-${name}`;
        }
        const val = element.getAttribute(name);
        return val;
    }

    // setStyle can be called in many ways
    //  dom.setStyle(element,"color:red; width: 5%");
    //  dom.setStyle([element1,element2],"color","red");
    //  dom.setStyle(element,{"color":"red","width: 50px"})
    setStyle(elements,...style) {
        const styles = this.parseStyles(style);
        util.toArray(elements).forEach(element=>{
            styles.forEach(style=>{
                element.style[style.name] = style.value;
            });
        });
    }

    getStyle(element,name) {
        assert.type(element,HTMLElement, "getStyle requires an HTMLElement value");
        assert.notEmpty(name,"getStyle requires a style name");
        return element.style[name];
    }



    parseStyles(styleArgs) {
        assert.range(styleArgs.length,1,2, "invalid style arguments");
        if (styleArgs.length == 1){
            const arg = styleArgs[0];
            if (typeof arg === 'string') {
                const parts = arg.split(';');
                return parts.map(part=>{
                    const nameVal = part.split(':');
                    if (nameVal.length == 2) {
                        return {name:nameVal[0],value:nameVal[1]};
                    } else {
                        log.error("invalid style value: ",part);
                        return {name: part,value:null};
                    }
                });
            } else if (typeof arg === 'object') {
                return Object.keys(arg).map(key=>{
                    return {name:key,value:arg[key]};
                });
            } else {
                log.error("unexpect style argument ",arg);
                return [];
            }
        } else if (styleArgs.length == 2) {
            return [{name:styleArgs[0], value: styleArgs[1]}];
        } else {
            log.error("invalid style arguments",styleArgs);
            return [];
        }
    }

    hasClass(element,className) {
        return element.classList.contains(className);
    }

    addClass(elements,className) {
        util.toArray(elements).forEach(element=>{
            if (!this.hasClass(element,className)) {
                element.classList.add(className);
            }
        });
    }

    removeClass(elements,className) {
        util.toArray(element).forEach(element=>{
            element.classList.remove(className);
        });
    }
}

export default new DOM();