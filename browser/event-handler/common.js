import { LOG_LEVEL, Logger } from '../../logger.js';
const log = Logger.create('Event.Common', LOG_LEVEL.WARN);

class Continuation {
  static get StopAll() {
    return new Continuation(true, true, true);
  }
  static get StopPropagation() {
    return new Continuation(true, false, false);
  }
  static get StopPropagationImmediate() {
    return new Continuation(true, false, true);
  }
  static get PreventDefault() {
    return new Continuation(false, true, false);
  }
  static get Continue() {
    return new Continuation(false, false, false);
  }

  constructor(
    stopPropagation = false,
    preventDefault = false,
    immediate = false
  ) {
    this.stopEventPropagation = stopPropagation;
    this.preventEventDefault = preventDefault;
    this.immediate = immediate;
  }

  clone() {
    return new Continuation(
      this.stopEventPropagation,
      this.preventEventDefault,
      this.immediate
    );
  }

  get PreventDefault() {
    return this.preventEventDefault;
  }
  set PreventDefault(prevent = true) {
    this.preventEventDefault = prevent;
  }
  get StopPropagation() {
    return this.stopEventPropagation;
  }
  set StopPropagation(stop = true) {
    this.stopEventPropagation = stop;
    this.immediate = true;
  }
  get StopPropagationImmediate() {
    return this.immediate;
  }
  set StopPropagationImmediate(stop = true) {
    this.immediate = stop;
  }
  combine(other = null) {
    /*
     * initially, the results were the OR of stop.
     * but that doesn't allow a handler to change
     * to false, so just replacing if another Continuation is passed
     */
    this.replace(other);
  }

  combineOrStop(other) {
    /*
     * if other is an Continuation, use the most restrictive handling
     * if other is not an EventHandlerResponse, stop & prevent
     */
    if (other == null || !(other instanceof Continuation)) {
      this.stopEventPropagation = true;
      this.preventEventDefault = true;
      this.immediate = true;
      return;
    }
    this.stopEventPropagation =
      this.stopEventPropagation || other.stopEventPropagation;
    this.preventEventDefault =
      this.preventEventDefault || other.preventEventDefault;
    this.immediate = this.immediate || other.immediate;
  }

  replace(other) {
    /*
     * if other is not null, replace this response values with the other
     * do nothing if other is null
     */
    if (other == null || !(other instanceof Continuation)) {
      return;
    }
    this.stopEventPropagation = other.stopEventPropagation;
    this.preventEventDefault = other.preventEventDefault;
    this.immediate = other.immediate;
  }

  notImmediate() {
    this.immediate = false;
  }

  finishEvent(event) {
    if (this.stopEventPropagation) {
      if (this.immediate) {
        event.stopImmediatePropagation();
      } else {
        event.stopPropagation();
      }
    }
    if (this.preventEventDefault) {
      event.preventDefault();
    }
  }
}

function DoNothing() {
  return false;
}

class MousePosition {
  constructor(event = null) {
    this.event = event;
    this.x = 0;
    this.y = 0;
    this.pctX = 0;
    this.pctY = 0;
    this.update(event);
  }

  update(event) {
    // todo: use the EventHandler target for position
    this.event = event;
    if (event != null) {
      const target = event.currentTarget;
      this.width = target.clientWidth;
      this.height = target.clientHeight;
      this.x = event.offsetX;
      this.y = event.offsetY;
      this.pctX = this.width > 0 ? Number(this.x) / this.width : 0;
      this.pctY = this.height > 0 ? Number(this.y) / this.height : 0;
    }
  }

  /*
   * pctX and pctY are [0...1].
   * xPercent() and yPercent() are integers [0...100]
   */
  xPercent() {
    return Math.floor(this.pctX * 100);
  }
  yPercent() {
    return Math.floor(this.pctY * 100);
  }
}

class ObjectEventType {
  constructor(name) {
    this.name = name;
  }

  get Name() {
    return this.name;
  }
  getName() {
    return this.name;
  }
}

class HandlerMethod {
  static get None() {
    return new HandlerMethod(null, null, null);
  }
  static Of(...args) {
    if (args[0] instanceof HandlerMethod) {
      return args[0];
    }
    return new HandlerMethod(...args);
  }
  constructor(object, method, defaultMethod) {
    if (typeof object == 'function') {
      this.handlerObject = null;
      this.handlerFunction = object;
      return;
    }
    this.handlerObject = object;
    let meth = method ?? defaultMethod;
    if (typeof meth == 'string' && object != null) {
      meth = object[meth];
    }
    if (typeof meth == 'function') {
      this.handlerFunction = meth;
    } else {
      this.handlerFunction = null;
    }
  }

  get IsValid() {
    return this.handlerFunction != null;
  }

  call(handler, event, ...args) {
    const continuation = handler.DefaultContinuation;
    try {
      const target = handler.getEventTarget(event);
      if (this.handlerFunction) {
        if (handler.dataSource) {
          let data = handler.dataSource;
          if (handler.dataSource instanceof HandlerMethod) {
            data = handler.dataSource.call(target, event, handler);
          } else if (typeof this.dataSource == 'function') {
            data = this.dataSource(event);
          }
          continuation.combine(
            this.handlerFunction.call(
              this.handlerObject,
              data,
              ...args,
              target,
              event,
              handler
            )
          );
        } else {
          continuation.combine(
            this.handlerFunction.call(
              this.handlerObject,
              ...args,
              target,
              event,
              handler
            )
          );
        }
      }
    } catch (ex) {
      log.error(ex, 'error in event handler');
    }
    return continuation;
  }
}

class DataHandlerMethod extends HandlerMethod {
  constructor(...args) {
    super(...args);
  }

  call(target, event, handler) {
    return this.handlerFunction.call(
      this.handlerObject,
      target,
      event,
      handler
    );
  }
}

export {
  DoNothing,
  MousePosition,
  HandlerMethod,
  DataHandlerMethod,
  ObjectEventType,
  Continuation
};
