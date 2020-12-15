import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';

import { IntlProvider } from 'react-intl';
import messages_en from './translations/en.json';
const messages = {
  'en': messages_en
};

ReactDOM.render(
  <React.StrictMode>
    <IntlProvider messages={messages['en']} locale="en" defaultLocale="en">
      <App />
    </IntlProvider>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
