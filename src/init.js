// Import our custom CSS
import './scss/styles.scss';
import initView from './view.js';

// Import all of Bootstrap's JS
// import * as bootstrap from 'bootstrap';

export default () => {
  const state = {
    feeds: [],
    addFeedProcess: {
      validationState: '',
    },
  };
  initView(state);
};
