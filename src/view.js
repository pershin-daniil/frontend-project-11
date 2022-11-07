import * as yup from 'yup';
import onChange from 'on-change';

yup.setLocale({
  string: {
    url: 'form.errors.notValidUrl',
  },
  mixed: {
    notOneOf: 'form.errors.rssFeedExist',
  },
});

const schema = yup.string()
  .required()
  .url();

const validate = (url, state) => {
  const urls = state.feeds.map((feed) => feed.url);
  schema.notOneOf(urls).validate(url)
    .then(() => {
      state.form.valid = true;
      state.feeds = [...state.feeds, { url: [url] }];
    })
    .catch((e) => {
      [state.form.error] = e.errors;
      state.form.valid = false;
    });
};

export default (state, i18n) => {
  const elements = {
    feedback: document.querySelector('.feedback'),
    urlInput: document.querySelector('#url-input'),
    form: document.querySelector('.rss-form'),
  };

  const watchedState = onChange(state, (path, value) => {
    if (path === 'form.error') {
      elements.urlInput.classList.add('is-invalid');
      elements.feedback.classList.add('text-danger');
      i18n.then((t) => elements.feedback.innerText = t(value));
    }
    if (value === true && path === 'form.valid') {
      elements.urlInput.classList.remove('is-invalid');
      elements.feedback.classList.remove('text-danger');
      elements.feedback.classList.add('text-success');
      i18n.then((t) => elements.feedback.innerText = t('form.valid'));
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
