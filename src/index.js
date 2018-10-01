import 'modern-normalize'
import $ from 'jquery';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import React from 'react'
import { render } from 'react-dom'
import 'styles/app.less';

import App from 'components2/App'

render(<App />, document.querySelector('#root'))
