import { LOG_LEVEL, Logger } from '../logger.js';

const log = Logger.create('Tack', LOG_LEVEL.INFO);

export class CancelToken {
  constructor(id = null) {
    this.id = id;
    this.canceled = false;
  }
  cancel() {
    if (this.id != null) {
      clearTimeout(this.id);
    }
    this.canceled = true;
  }
  setTimeoutId(id) {
    this.id = id;
  }
  isCanceled() {
    return this.canceled;
  }
}

export class Task {
  static Delay(msecs, func) {
    let task = new Task();
    task.run(func, msecs);
    return task;
  }
  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
    this.cancelToken = new CancelToken();
  }

  cancel() {
    this.cancelToken.cancel();
    this.resolve(new Error('cancelled'));
  }
  async wait() {
    return await this.promise;
  }
  isComplete() {
    return this.cancelToken.isCanceled() || this.promise.isResolved();
  }
  run(task, delay = 0) {
    let timeoutId = setTimeout(() => {
      this.resolve(task());
    }, delay);
    this.cancelToken.setTimeoutId(timeoutId);
  }
}

export class IntervalTask extends Task {
  constructor(interval) {
    super();
    this.interval = interval;
  }
  run(func) {
    let count = 0;
    this.cancelToken.setTimeoutId(
      setInterval(() => {
        if (!this.cancelToken.isCanceled()) {
          func();
          count++;
        } else {
          this.promise.resolve(count);
        }
      }, this.interval)
    );
    return this;
  }
}

export const BackgroundTask = {
  each: function (list, func) {
    const items = [...list];
    const processor = func;
    let pos = 0;
    let task = new IntervalTask(0);
    task.run(() => {
      if (pos < items.length) {
        func(items[pos++]);
      } else {
        task.cancel();
      }
    });
    return task;
  },
  batch: function (batchSize, list, func) {
    const items = [...list];
    const processor = func;
    let pos = 0;
    let task = new IntervalTask(0);
    task.run(() => {
      let cnt = 0;
      while (pos < items.length && cnt++ < batchSize) {
        func(items[pos++]);
      }
      if (pos + 1 >= items.length) {
        task.cancel();
      }
    });
    return task;
  }
};

export default {
  Background: BackgroundTask,
  Task,
  IntervalTask,
  CancelToken
};
