import * as yup from 'yup';
import onChange from 'on-change';
import ADD_FEED_STATE from './constants.js';

const schema = yup.string()
  .required('addFeedProcess.errors.required')
  .url('addFeedProcess.errors.notValidUrl');

const validate = (url, state) => {
  const urls = state.feeds.map((feed) => feed.url);
  schema.notOneOf(urls, 'addFeedProcess.errors.rssFeedExists').validate(url)
    .then(() => {
      state.addFeedProcess.validationState = ADD_FEED_STATE.VALID;
      state.feeds = [...state.feeds, { url: [url] }];
    })
    .catch((e) => {
      if (e.errors[0].includes('notValidUrl')) state.addFeedProcess.validationState = ADD_FEED_STATE.INVALID;
      if (e.errors[0].includes('rssFeedExists')) state.addFeedProcess.validationState = ADD_FEED_STATE.EXISTS;
      console.log(e.errors);
    });
};

export default (state) => {
  const elements = {
    feedback: document.querySelector('.feedback'),
    urlInput: document.querySelector('#url-input'),
    form: document.querySelector('.rss-form'),
  };

  const watchedState = onChange(state, (path, value) => {
    if (value === ADD_FEED_STATE.EXISTS) {
      elements.urlInput.classList.add('is-invalid');
      elements.feedback.classList.add('text-danger');
      elements.feedback.innerText = 'RSS уже существует';
    }
    if (value === ADD_FEED_STATE.INVALID) {
      elements.urlInput.classList.add('is-invalid');
      elements.feedback.classList.add('text-danger');
      elements.feedback.innerText = 'Ссылка должна быть валидным URL';
    }

    if (value === ADD_FEED_STATE.VALID) {
      elements.urlInput.classList.remove('is-invalid');
      elements.feedback.classList.remove('text-danger');
      elements.feedback.classList.add('text-success');
      elements.feedback.innerText = 'RSS успешно загружен';
      elements.urlInput.value = '';
    }
  });

  elements.form.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = { url: formData.get('url').trim().toLowerCase() };
    validate(data.url, watchedState);
  });
};
