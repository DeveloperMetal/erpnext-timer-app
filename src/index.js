import 'modern-normalize'
import $ from 'jquery';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import React from 'react'
import { render } from 'react-dom'
import 'styles/app.less';
import { AppContainer } from 'react-hot-loader';
import App from "./components2/App";

const RenderApp = Component => {
  render(<AppContainer><Component /></AppContainer>, document.querySelector('#root'));    
}

RenderApp(App);

if ( module.hot ) {
  module.hot.accept("./components2/App", () => { RenderApp(App) });
}