import * as yup from 'yup';
import onChange from 'on-change';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import parser from './parser.js';

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

const isValid = (url, state) => {
  const urls = state.feeds.map((feed) => feed.url);
  return schema.notOneOf(urls).validate(url)
    .then(() => {
      state.form.error = '';
      state.form.valid = true;
      return true;
    })
    .catch((e) => {
      state.form.error = e.errors;
      state.form.valid = false;
      return false;
    });
};

const proxy = {
  get: (url) => `https://allorigins.hexlet.app/get?disableCashe=true&url=${encodeURIComponent(url)}`,
};

const getFeed = (url, state) => axios.get(proxy.get(url))
  .then((response) => parser(response.data.contents))
  .then(({ title, description, posts }) => {
    const feed = {
      id: uuidv4(),
      url,
      title,
      description,
    };

    const normalizedPosts = posts.map((post) => ({
      id: uuidv4(),
      feedId: feed.id,
      ...post,
    }));

    // state.feeds = [{ feed, posts: normalizedPosts }, ...state.feeds];
    return { feed, posts: normalizedPosts };
  })
  .catch(() => {
    state.form.error = 'form.errors.networkFail';
  });

const renderFeeds = (feeds, i18n, elements) => {
  elements.feeds.innerHTML = '';
  const cardElement = document.createElement('div');
  cardElement.classList.add('card', 'border-0');
  elements.feeds.appendChild(cardElement);
  const cardBodyElement = document.createElement('div');
  cardBodyElement.classList.add('card-body');
  cardElement.appendChild(cardBodyElement);
  const cardTitleElement = document.createElement('h2');
  cardTitleElement.classList.add('card-title', 'h4');
  i18n.then((t) => cardTitleElement.innerText = t('feeds'));
  cardBodyElement.appendChild(cardTitleElement);

  const listElement = document.createElement('ul');
  listElement.classList.add('list-group', 'border-0', 'rounded-0');
  listElement.setAttribute('id', 'feed-list');
  cardElement.appendChild(listElement);
  feeds.map(({ title, description }) => {
    const liElement = document.createElement('li');
    liElement.classList.add('list-group-item', 'border-0', 'border-end-0');
    document.querySelector('#feed-list').appendChild(liElement);
    const h3Element = document.createElement('h3');
    h3Element.classList.add('h6', 'm-0');
    h3Element.innerText = title;
    liElement.appendChild(h3Element);
    const pElement = document.createElement('p');
    pElement.classList.add('small', 'm-0', 'text-black-50');
    pElement.innerText = description;
    liElement.appendChild(pElement);
    return true;
  });
};

const renderPosts = (posts, i18n, elements) => {
  elements.posts.innerHTML = '';
  const cardElement = document.createElement('div');
  cardElement.classList.add('card', 'border-0');
  elements.posts.appendChild(cardElement);
  const cardBodyElement = document.createElement('div');
  cardBodyElement.classList.add('card-body');
  cardElement.appendChild(cardBodyElement);
  const cardTitleElement = document.createElement('h2');
  cardTitleElement.classList.add('card-title', 'h4');
  i18n.then((t) => cardTitleElement.innerText = t('posts'));
  cardBodyElement.appendChild(cardTitleElement);

  const listElement = document.createElement('ul');
  listElement.classList.add('list-group', 'border-0', 'rounded-0');
  listElement.setAttribute('id', 'posts-list');
  cardElement.appendChild(listElement);
  posts.map(({
    /* description, feedId, */ id, link, title,
  }) => {
    const liElement = document.createElement('li');
    liElement.classList.add('list-group-item', 'border-0', 'border-end-0', 'd-flex', 'justify-content-between', 'align-item-start');
    const aElement = document.createElement('a');
    aElement.classList.add('fw-bold');
    aElement.setAttribute('href', link);
    aElement.setAttribute('data-id', id);
    aElement.setAttribute('target', '_blank');
    aElement.setAttribute('rel', 'noopener noreferrer');
    aElement.innerText = title;
    liElement.appendChild(aElement);
    const button = document.createElement('button');
    button.classList.add('btn', 'btn-outline-primary', 'btn-sm');
    button.setAttribute('type', 'button');
    button.setAttribute('data-id', id);
    button.setAttribute('data-bs-toggle', 'modal');
    button.setAttribute('data-bs-target', '#modal');
    i18n.then((t) => button.innerText = t('button'));
    liElement.appendChild(button);
    document.querySelector('#posts-list').appendChild(liElement);
    return true;
  });
};

const addFeed = (url, state) => {
  isValid(url, state).then((valid) => (valid ? getFeed(url, state) : null))
    .then(({ feed, posts }) => {
      state.feeds = [feed, ...state.feeds];
      state.posts = [...posts, ...state.posts];
      state.form.error = '';
    });
};

export default (state, i18n) => {
  const elements = {
    feedback: document.querySelector('.feedback'),
    urlInput: document.querySelector('#url-input'),
    form: document.querySelector('.rss-form'),
    feeds: document.querySelector('.feeds'),
    posts: document.querySelector('.posts'),
  };

  const watchedState = onChange(state, (path, value) => {
    // console.log(path);
    console.log(value);
    if (path === 'form.error' && state.form.error) {
      elements.urlInput.classList.add('is-invalid');
      elements.feedback.classList.add('text-danger');
      i18n.then((t) => elements.feedback.innerText = t(value.toString()));
    }
    if (path === 'feeds' && !state.form.error) {
      renderFeeds(value, i18n, elements);
      elements.urlInput.classList.remove('is-invalid');
      elements.feedback.classList.remove('text-danger');
      elements.feedback.classList.add('text-success');
      i18n.then((t) => elements.feedback.innerText = t('form.valid'));
      elements.urlInput.value = '';
    }
    if (path === 'posts' && !state.form.error) {
      renderPosts(value, i18n, elements);
    }
  });

  elements.form.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const url = formData.get('url').trim().toLowerCase();
    addFeed(url, watchedState);
  });
  return watchedState;
};
