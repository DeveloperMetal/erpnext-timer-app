import 'modern-normalize'
import $ from 'jquery';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import React from 'react'
import { render } from 'react-dom'
import 'styles/app.less';
import { AppContainer, hot, setConfig } from 'react-hot-loader';
import App from "./components/App";

import { ipcRenderer } from "electron";

const RenderApp = Component => {
  render(<AppContainer><Component /></AppContainer>, document.querySelector('#root'));
}

RenderApp(App);

if ( module.hot ) {
  module.hot.accept("./components/App", () => { 
    let errorBox = document.querySelector('.react-hot-loader-error-overlay');
    console.log("Cleanup...", errorBox);
    if ( errorBox ) {
      errorBox.parentNode.removeChild(errorBox);
    }
    RenderApp(App);
  });
}

ipcRenderer.on("message", (e, txt) => {
  console.log(txt);
});