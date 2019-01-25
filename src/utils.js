
import { ipcRenderer } from "electron";


let reply_counter = 0;
/**
 * Simple promise wrapper to ipcRenderer send/receive async api calls to the main process.
 * @param {string} api 
 * @param  {...any} args 
 */
export function mainProcessAPI(api, ...args) {
  reply_counter++;

  return new Promise((resolve, reject) => {
    // The api in the main process is required to take in
    // a response and error channels so that we can hook our
    // renderer process events here and emit our promise.
    let params = {
      response_channel: `response:${api}/${reply_counter}`,
      error_channel: `error:${api}/${reply_counter}`,
      args
    };

    const responseFn = function(e, result) {
      ipcRenderer.removeAllListeners(params.error_channel);
      resolve(result);
    }
    const errorFn = function(e, result) {
      ipcRenderer.removeAllListeners(params.response_channel);
      reject(result);
    }

    console.log("Calling: ", api, args, params);

    ipcRenderer.once(params.response_channel, responseFn);
    ipcRenderer.once(params.error_channel, errorFn);
    ipcRenderer.send(`api:${api}`, ...params);
  })
}

export const repeat = (char, length) => {
  return Array(Math.max(0, length + 1)).join(char);
}

export const padLeft = (char, txt, size) => {
  if ( txt === undefined ) { txt = ""; }
  txt = txt.toString();
  return repeat(char, size - txt.length) + txt;
}

export const padRight = (char, txt, size) => {
  if (txt === undefined) { txt = ""; }
  txt = txt.toString();
  return txt + repeat(char, size - txt.length);
}

export function makeCancelable(promise) {
  let hasCanceled = false;
  const cancelablePromise = new Promise((resolve, reject) => {
    promise.then(
      val => hasCanceled?reject({isCanceled: hasCanceled}) : resolve(val),
      error => hasCanceled?reject({isCanceled: hasCanceled}) : reject(error)
    )
  });

  return {
    promise: cancelablePromise,
    cancel() {
      hasCanceled = true;
    }
  }
}

export function promiseFinally(promise, fn) {
  return promise.then(fn).catch(fn);
}

export function throttle(gen, delay, onStep) {

  let api = {
    done: false,
    value: undefined,
    whenDone: undefined,
    _resolve: undefined,
    _reject: undefined,

    init(resolve, reject) {
      this._resolve = resolve;
      this._reject = reject;
    },

    _intervalID: setInterval(function() {
      try {
        let result = gen.next();

        if ( typeof result.value !== undefined ) {
          api.value = result.value;

          if (typeof onStep === 'function' ) {
            onStep(api.value);
          }  
        }

        if ( result.done ) {
          api.stop(true, undefined, 'success');
        }
      } catch (err) {
        console.error(err);
        api.stop(false, 'error', err);
      }
    }, delay),

    stop(done, reason = 'user', err = undefined) {
      this.done = done;
      this.doneReason = reason;
      gen.return();

      if ( this._intervalID ) {
        clearInterval(this._intervalID);
        this._intervalID = null;
      }

      if ( done ) {
        this._resolve(api.value);
      } else if ( err ) {
        this._reject(err);
      }
    }
  }

  api.whenDone = new Promise((resolve, reject) => {
    api.init(resolve, reject);
  });

  return api;
}

export function decodeHTML(html) {
  let el = document.createElement("textarea");
  el.innerHTML = html;
  return el.value;
}