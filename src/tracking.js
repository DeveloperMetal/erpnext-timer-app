export function trackError(err) {
  let event = new CustomEvent("track-error", { detail: err});
  document.body.dispatchEvent(event);
}

export function trackUser(user) {
  let event = new CustomEvent("track-user", { detail: user });
  document.body.dispatchEvent(event);
}

export function trackExtra(data) {
  let event = new CustomEvent("track-extra", { detail: data });
  document.body.dispatchEvent(event);
}

export function trackMsg(text) {
  let event = new CustomEvent("track-message", { detail: text });
  document.body.dispatchEvent(event);
}