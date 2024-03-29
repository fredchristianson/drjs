import { Assert as assert } from '../assert.js';
import { Logger } from '../logger.js';
import { util } from '../util.js';

const log = Logger.create('DOM');
const NO_SELECTION = '~-NOSEL-~';
const svgns = 'http://www.w3.org/2000/svg';

/*
 * this doesn't include everything, but gets the most common properties that require units
 * if a value begins with "*", it includes all names that end with the rest
 * "*width" means "width", "border-width", ...
 */
const cssUnitRequired = [
  '*width',
  '*height',
  '*left',
  '*right',
  '*top',
  '*bottom',
  '*radius',
  '*gap',
  '*size'
];
export class DOMUtils {
  constructor(rootSelector = null) {
    this.rootSelector = rootSelector;
    if (rootSelector == null) {
      this.root = document;
    } else if (rootSelector instanceof HTMLElement) {
      this.root = rootSelector;
    } else {
      this.root = document.querySelector(rootSelector);
    }
  }

  getRoot() {
    return this.root;
  }
  getBody() {
    return document.body;
  }

  getParent(element) {
    if (typeof element == 'string') {
      element = this.first(element);
    }
    return element.parentNode;
  }

  getParentAndSelector(opts) {
    let parent = this.root;
    let selector = '*';
    /*
     * if 1 arg is passed parent is assumed to be the document
     * and the arg is the selector
     */
    if (opts.length == 1) {
      selector = opts[0];
    } else if (opts.length == 2) {
      parent = opts[0];
      selector = opts[1];
    } else {
      assert.false(
        'invalid options passed.  expect (selector) or (parent,selector)'
      );
    }
    if (Array.isArray(parent)) {
      parent = parent.filter((elem) => {
        const validParent =
          elem instanceof HTMLElement || elem instanceof HTMLDocument;
        if (!validParent) {
          /*
           * don't assert and throw an error since there are cases where Text nodes are in the array.
           * this keeps users from needing to filter out Text nodes when looking for children.
           */
          if (!(elem instanceof Text)) {
            log.warn(
              'parent array contains item that cannot be an HTMLElement parent'
            );
          }
        }
        return validParent;
      });
    } else if (typeof parent == 'string') {
      parent = this.first(parent);
      assert.type(parent, [HTMLElement], 'parent must be an HTMLElement');
    } else {
      assert.type(
        parent,
        [HTMLElement, HTMLDocument],
        'parent must be an HTMLElement'
      );
    }
    return { parent: parent, selector: selector };
  }

  // eslint-disable-next-line complexity
  first(...opts) {
    if (Array.isArray(opts[0])) {
      return opts[0][0];
    }
    const sel = this.getParentAndSelector(opts);
    try {
      let element = null;
      if (
        sel.selector instanceof HTMLElement ||
        sel.selector instanceof SVGElement
      ) {
        // a DOM element was passed as a selector, so return it
        element = sel.selector;
      } else if (Array.isArray(sel.parent)) {
        element = null;
        for (let idx = 0; element == null && idx < sel.parent.length; idx++) {
          element = sel.parent[idx].querySelector(sel.selector);
        }
      } else {
        element = sel.parent.querySelector(sel.selector);
      }
      return element;
    } catch (err) {
      log.error('failed to find first child of selector ', sel.selector, err);
      return null;
    }
  }

  firstSibling(elem, selector) {
    let element = this.first(elem);
    while (element != null && element.nextElementSibling != null) {
      const next = element.nextElementSibling;
      if (next.matches(selector)) {
        return next;
      }
      element = next;
    }
    return null;
  }

  find(...opts) {
    let result = [];
    const sel = this.getParentAndSelector(opts);
    if (Array.isArray(sel.selector)) {
      result = sel.selector.reduce((arr, e) => {
        arr.push(...this.find(sel.parent, e));
        return arr;
      }, []);
    } else if (sel.selector instanceof HTMLElement) {
      // a DOM element was passed as a selector, so return it
      result = [sel.selector];
    } else if (Array.isArray(sel.parent)) {
      sel.parent.forEach((parent) => {
        // if the parent matches, keep it
        if (parent.matches(sel.selector)) {
          result.push(parent);
        }
        // also keep any decendants that match
        result.push(...Array.from(parent.querySelectorAll(sel.selector)));
      });
    } else {
      const elements = sel.parent.querySelectorAll(sel.selector);
      result = Array.from(elements);
      if (sel.parent.matches && sel.parent.matches(sel.selector)) {
        result.push(sel.parent);
      }
    }
    return result;
  }

  // return true if one of the elements in the first argument matches one of the selectors in the 2nd
  matches(element, sel) {
    const selectors = util.toArray(sel);
    let match = false;
    this.toElementArray(element).forEach((elem) => {
      match =
        match ||
        selectors.find((s) => {
          return typeof s == 'string' ? elem.matches(s) : element == s;
        });
    });
    return match;
  }

  hide(element) {
    this.toElementArray(element).forEach((elem) => {
      this.setStyle(elem, 'display', 'none');
    });
  }
  show(element, isShown = true) {
    if (!isShown) {
      this.hide(element);
      return;
    }
    this.toElementArray(element).forEach((elem) => {
      this.setStyle(elem, 'display', null);
    });
  }

  display(element, display) {
    this.toElementArray(element).forEach((elem) => {
      this.setStyle(elem, 'display', display);
    });
  }

  setData(element, name, val) {
    assert.notNull(element, 'setData requires an element');
    assert.notEmpty(name, 'setData requires a name');
    if (!name.startsWith('data-')) {
      name = `data-${name}`;
    }
    this.toElementArray(element).forEach((elem) => {
      elem.setAttribute(name, val);
    });
  }

  removeData(element, name) {
    this.toElementArray(element).forEach((elem) => {
      delete elem.dataset[name];
    });
  }

  getData(element, name, type) {
    assert.notNull(element, 'getData requires an element');
    assert.notEmpty(name, 'getData requires a name');
    if (!name.startsWith('data-')) {
      name = `data-${name}`;
    }
    let val = element.getAttribute(name);
    if (val != null) {
      try {
        if (type == 'number' || /^-?[0-9]*\.?[0-9]*$/.test(val)) {
          val = parseFloat(val);
        } else if (type == 'date') {
          val = Date.parse(val);
        }
      } catch {
        log.debug('unable to convert data value', val);
      }
    }
    return val;
  }

  getDataWithParent(element, name, type = null) {
    element = this.first(element);
    if (element == null) {
      return null;
    }

    const val = this.getData(element, name, type);
    if (val == null) {
      return this.getDataWithParent(element.parentElement, name);
    }
    return val;
  }

  setAttribute(element, name, value) {
    this.toElementArray(element).forEach((elem) => {
      elem.setAttribute(name, value);
    });
  }

  getAttribute(element, name) {
    const e = this.first(element);
    return e == null ? null : e.getAttribute(name);
  }

  setProperty(element, name, val) {
    assert.notNull(element, 'setProperty requires an element');
    assert.notEmpty(name, 'setProperty requires a name');
    this.toElementArray(element).forEach((elem) => {
      if (elem[name] != val) {
        elem[name] = val;

        const event = new Event('change', { bubbles: true, cancelable: false });
        elem.dispatchEvent(event);
      }
    });
  }

  getProperty(element, name) {
    assert.notNull(element, 'getProperty requires an element');
    assert.notEmpty(name, 'getProperty requires a name');
    const val = element[name];
    return val;
  }

  isChecked(element) {
    return this.getProperty(element, 'checked');
  }

  isSelected(element) {
    return this.getProperty(element, 'selected');
  }

  /*
   * setStyle can be called in many ways
   *  dom.setStyle(element,"color:red; width: 5%");
   *  dom.setStyle([element1,element2],"color","red");
   *  dom.setStyle(element,{"color":"red","width: 50px"})
   */
  setStyle(elements, ...style) {
    const styles = this.parseStyles(style);
    this.toElementArray(elements).forEach((element) => {
      styles.forEach((style) => {
        element.style[style.name] = this.addPxUnits(style.name, style.value);
      });
    });
  }

  addPxUnits(name, value) {
    if (this.needsUnit(name) && !this.hasUnit(value)) {
      return `${value}px`;
    }
    return value;
  }

  needsUnit(name) {
    const needs = cssUnitRequired.find((css) => {
      if (css[0] == '*') {
        return name.endsWith(css.substring(1));
      }
      return name == css;
    });
    return needs;
  }
  hasUnit(value) {
    if (value == null || value == 'unset' || value == 'inherited') {
      return true;
    }
    if (typeof value == 'number') {
      return false;
    }
    if (typeof value == 'string') {
      if (value.length == 0) {
        return false;
      }
      // if the last character is numeric, it doesn't end with a unit
      return isNaN(value[length - 1]);
    }
    log.warn('trying to set a css unit on an invalid value ', value);
    return false;
  }

  getStyle(element, name) {
    assert.type(element, HTMLElement, 'getStyle requires an HTMLElement value');
    assert.notEmpty(name, 'getStyle requires a style name');
    return element.style[name];
  }

  parseStyles(styleArgs) {
    assert.range(styleArgs.length, 1, 2, 'invalid style arguments');
    if (styleArgs.length == 1) {
      const arg = styleArgs[0];
      if (typeof arg === 'string') {
        const parts = arg.split(';');
        return parts.map((part) => {
          const nameVal = part.split(':');
          if (nameVal.length == 2) {
            return { name: nameVal[0], value: nameVal[1] };
          } else {
            log.error('invalid style value: ', part);
            return { name: part, value: null };
          }
        });
      } else if (typeof arg === 'object') {
        return Object.keys(arg).map((key) => {
          return { name: key, value: arg[key] };
        });
      } else {
        log.error('unexpect style argument ', arg);
        return [];
      }
    } else if (styleArgs.length == 2) {
      return [{ name: styleArgs[0], value: styleArgs[1] }];
    } else {
      log.error('invalid style arguments', styleArgs);
      return [];
    }
  }

  hasClass(element, className) {
    const first = this.first(element);
    return first && first.classList && first.classList.contains(className);
  }

  addClass(elements, className) {
    if (util.isEmpty(className)) {
      return;
    }
    this.find(elements).forEach((element) => {
      if (!this.hasClass(element, className)) {
        element.classList.add(className);
      }
    });
  }

  removeClass(elements, className) {
    if (Array.isArray(className)) {
      className.forEach((cn) => {
        this.removeClass(elements, cn);
      });
      return;
    }
    this.find(elements).forEach((element) => {
      element.classList.remove(className);
    });
  }

  toggleClass(elements, className, isOn) {
    this.toElementArray(elements).forEach((element) => {
      if (typeof isOn == 'undefined') {
        isOn = !this.hasClass(element, className);
      }
      if (isOn) {
        this.addClass(element, className);
      } else {
        this.removeClass(element, className);
      }
    });
  }
  toggleClasses(elements, classA, classB) {
    this.toElementArray(elements).forEach((element) => {
      const isA = !this.hasClass(element, classA);
      if (isA) {
        this.addClass(element, classB);
        this.removeClass(element, classA);
      } else {
        this.addClass(element, classA);
        this.removeClass(element, classB);
      }
    });
  }

  contains(top, inner) {
    if (top == null || inner == null || !(inner instanceof HTMLElement)) {
      return false;
    }
    if (Array.isArray(top)) {
      return top.find((e) => this.contains(e, inner));
    } else {
      let walk = inner;
      while (walk != null && walk != top) {
        walk = walk.parentNode;
      }
      return walk == top;
    }
  }

  remove(sel) {
    this.toElementArray(sel).forEach((element) => {
      const parent = element.parentNode;
      if (parent != null) {
        try {
          parent.removeChild(element);
        } catch (ex) {
          log.warn(
            ex,
            'failed to remove child.  ok if remove called twice without refresh'
          );
        }
      } else {
        log.warn('dome.remove called on element that is not in dom');
      }
    });
  }

  append(parent, elements) {
    const children = [];
    parent = this.first(parent);
    this.toElementArray(elements).forEach((element) => {
      children.push(parent.appendChild(element));
    });
    if (Array.isArray(elements)) {
      return children;
    } else {
      return children[0];
    }
  }

  prepend(parent, elements) {
    const children = [];
    parent = this.first(parent);
    this.toElementArray(elements).forEach((element) => {
      children.push(parent.prepend(element));
    });
    if (Array.isArray(elements)) {
      return children;
    } else {
      return children[0];
    }
  }

  check(elements, checked = true) {
    this.find(elements).forEach((element) => {
      if (typeof element.checked == 'undefined' || element.checked != checked) {
        this.setProperty(element, 'checked', checked);
      }
    });
  }

  uncheck(elements) {
    this.check(elements, false);
  }

  getValue(sel) {
    let element = this.first(sel);
    if (element) {
      if (element.tagName == 'SELECT') {
        const opt = this.first(element, ':checked');
        if (opt.value == NO_SELECTION) {
          return null;
        }
        element = opt;
      }
      const dataValue = this.getProperty(element, 'dataValue');
      if (dataValue) {
        return dataValue;
      }
      const val = element.value || element.innerHTML;
      if (element.type == 'number') {
        return parseInt(val, 10);
      }
      return val;
    } else {
      return 0;
    }
  }

  getIntValue(sel) {
    const val = this.getValue(sel);
    return parseInt(val, 10);
  }

  setValue(selector, val) {
    this.find(selector).forEach((element) => {
      if (element.tagName == 'TEXTAREA') {
        element.value = val;
      } else if (element.tagName == 'SELECT') {
        let opt = this.first(element, `[value="${val}"]`);
        if (opt == null) {
          opt = this.first(element, 'option');
        }
        if (opt != null) {
          this.setProperty(opt, 'selected', true);
        }
      } else if (element.type == 'checkbox') {
        element.checked = val;
      } else {
        element.value = val;
      }
    });
  }

  parent(element) {
    if (typeof element == 'string') {
      element = this.first(element);
    }
    if (element == null) {
      return null;
    }
    const parent = element.parentElement;

    return parent;
  }

  closest(element, selector = null) {
    if (typeof element == 'string') {
      element = this.first(element);
    }
    if (element == null) {
      return null;
    }
    let parent = element.parentElement;
    if (selector == null) {
      return element.parentNode;
    }
    while (parent != null && !parent.matches(selector)) {
      parent = parent.parentElement;
    }
    return parent;
  }

  // return array of all parent elements up to selector or up to this.root if selector is null
  ancestors(element, selector = null) {
    const parentList = [];
    if (typeof element == 'string') {
      element = this.first(element);
    }
    if (selector == null) {
      selector = this.root;
    }
    let next = element.parentElement;
    while (next != null) {
      if (next == selector || this.matches(next, selector)) {
        parentList.push(next);
      }
      next = next.parentElement;
    }

    return parentList;
  }

  setOptions(selector, options, defaultLabel = null) {
    this.find(selector).forEach((sel) => {
      sel.innerHTML = '';
      if (defaultLabel) {
        this.addOption(sel, { name: defaultLabel, value: NO_SELECTION });
      }
      options.forEach((opt) => {
        this.addOption(sel, opt);
      });
    });
  }

  addOption(element, opt) {
    this.find(element).forEach((sel) => {
      const val = util.firstNotEmpty([opt.getValue, opt, value, op]);

      const label = util.firstNotEmpty([opt.getName, opt.name, opt]);
      const disabled = util.firstNotEmpty([
        opt.isDisabled,
        opt.disabled,
        false
      ]);
      const optElement = this.createElement('option', {
        '@value': val,
        innerHTML: label
      });
      if (opt.dataValue) {
        this.setProperty(optElement, 'dataValue', opt.dataValue);
      }
      this.setProperty(optElement, 'disabled', disabled);
      sel.appendChild(optElement);
    });
  }

  createElement(tagName, values = null) {
    if (tagName == null || tagName.length == 0) {
      return null;
    }
    let element = null;
    tagName = tagName.trim();
    if (tagName[0] == '<') {
      const div = document.createElement('div');
      div.innerHTML = tagName;
      element = div.firstChild;
    } else {
      element = document.createElement(tagName);
    }
    if (values == null) {
      return element;
    }
    if (typeof values == 'string') {
      element.innerHTML = values;
      return element;
    }
    Object.getOwnPropertyNames(values).forEach((prop) => {
      const val = values[prop];
      if (prop[0] == '@') {
        const attr = prop.substring(1);
        element.setAttribute(attr, val);
      } else if (prop == 'innerHTML' || prop == 'text' || prop == 'html') {
        element.innerHTML = val;
      } else {
        element.setAttribute(prop, val);
      }
    });
    return element;
  }

  createElementNS(tagName, values = null) {
    const element = document.createElementNS(svgns, tagName);
    if (values == null) {
      return element;
    }
    if (typeof values == 'string') {
      element.innerHTML = values;
      return element;
    }
    Object.getOwnPropertyNames(values).forEach((prop) => {
      const val = values[prop];
      if (prop[0] == '@') {
        const attr = prop.substr(1);
        element.setAttribute(attr, val);
      } else if (prop == 'innerHTML' || prop == 'text' || prop == 'html') {
        element.innerHTML = val;
      } else {
        element[prop] = val;
      }
    });
    return element;
  }

  removeChildren(selector) {
    this.toElementArray(selector).forEach((element) => {
      while (element.firstChild) {
        element.removeChild(element.firstChild);
      }
    });
  }

  toElementArray(item) {
    if (typeof item == 'string') {
      item = this.find(item);
    }
    const array = util.toArray(item);
    const elements = array.map((e) => {
      return this.first(e);
    });
    return elements.filter(
      (item) => item instanceof HTMLElement || item instanceof SVGElement
    );
  }

  isEmpty(...opts) {
    const element = this.first(...opts);
    if (element == null) {
      return true;
    }
    return element.childNodes.length == 0;
  }

  addListener(selector, typeName, handler, options = null) {
    this.toElementArray(selector).forEach((element) => {
      element.addEventListener(typeName, handler, options);
    });
  }

  removeListener(selector, typeName, handler, options = null) {
    this.toElementArray(selector).forEach((element) => {
      element.removeEventListener(typeName, handler, options);
    });
  }

  setInnerHTML(selector, html) {
    this.toElementArray(selector).forEach((element) => {
      element.innerHTML = `${html ?? ''}`;
    });
  }
  setInnerText(selector, text) {
    this.toElementArray(selector).forEach((element) => {
      element.innerText = `${text}`;
    });
  }

  getInnerHTML(selector) {
    const element = this.first(selector);
    if (element) {
      return element.innerHTML;
    }
    return null;
  }

  getInnerText(selector) {
    const element = this.first(selector);
    if (element) {
      return element.innerText;
    }
    return null;
  }

  isElementIn(element, selectors) {
    if (
      element == null ||
      selectors == null ||
      !(element instanceof HTMLElement)
    ) {
      return false;
    }
    const e = this.first(element);
    const match = util.toArray(selectors).find((sel) => {
      if (typeof sel == 'string') {
        return e != null && e.matches(sel);
      } else {
        return e == sel;
      }
    });
    if (match == null) {
      return this.isElementIn(e.parentNode, selectors);
    }
    return match != null;
  }

  getPageOffset(...args) {
    const el = this.first(...args);
    let x = 0;
    let y = 0;
    let width = 0;
    let height = 0;
    if (el != null) {
      const rect = el.getBoundingClientRect();
      const scrollLeft =
        window.pageXOffset || document.documentElement.scrollLeft;
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
      y = rect.top + scrollTop;
      x = rect.left + scrollLeft;
      height = el.clientHeight;
      width = el.clientWidth;
    }
    return {
      x,
      y,
      width,
      height,
      left: x,
      top: y,
      right: x + width,
      bottom: y + height
    };
  }

  getWidth(element = null) {
    if (element === null) {
      return this.root.offsetWidth;
    }
    const first = this.first(element);
    return first ? first.offsetWidth : 0;
  }
  getHeight(element) {
    const first = this.first(element);
    return first ? first.offsetHeight : 0;
  }

  setWidth(sel, width) {
    let val = width;
    if (width == null) {
      val = 'unset';
    } else if (typeof width == 'number') {
      val = `${width}px`;
    }
    this.toElementArray(sel).forEach((element) => {
      element.style.width = val;
    });
  }
  setHeight(sel, height) {
    let val = height;
    if (height == null) {
      val = 'unset';
    } else if (typeof height == 'number') {
      val = `${height}px`;
    }
    this.toElementArray(sel).forEach((element) => {
      element.style.height = val;
    });
  }

  setFocus(...args) {
    const e = this.first(...args);
    if (e) {
      e.focus();
    }
  }

  getFocus() {
    return document.activeElement;
  }
  blur(...args) {
    const element = this.first(...args);
    if (element) {
      //log.always("blur ", element);
      element.blur();
    }
  }

  /*
   * simple value collector.  doesn't handle unnamed inputs or
   * multiple inputs with same name
   */
  getFormValues(form) {
    const inputs = this.find(form, ['input', 'select', 'textarea']);
    const values = {};
    inputs.forEach((input) => {
      if (!util.isEmpty(input.name)) {
        values[input.name] = input.value;
      }
    });
    return values;
  }
}

const dom = new DOMUtils();
export { dom, dom as DOM };

// window.drjs shouldn't be needed any more.  usefule without modules
window.drjs = window.drjs || {};
window.drjs.dom = dom;
export default dom;
