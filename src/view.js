import * as yup from 'yup';
import onChange from 'on-change';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import parser from './parser.js';

yup.setLocale({
  string: {
    url: 'notValidURL',
  },
  mixed: {
    notOneOf: 'rssFeedExist',
  },
});

const schema = yup.string()
  .required()
  .url();

const isValid = (url, state) => {
  const urls = state.feeds.map((feed) => feed.url);
  return schema.notOneOf(urls).validate(url)
    .then(() => {
      state.form.error = null;
      return true;
    })
    .catch((e) => e.errors[0]);
};

const proxy = {
  get: (url) => `https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(url)}`,
};

const getFeed = (url) => axios.get(proxy.get(url))
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

    return { feed, posts: normalizedPosts };
  })
  .catch((e) => e);

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
  i18n.then((t) => { cardTitleElement.innerText = t('feeds'); });
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

const renderPosts = (state, i18n, elements) => {
  elements.posts.innerHTML = '';
  const cardElement = document.createElement('div');
  cardElement.classList.add('card', 'border-0');
  elements.posts.appendChild(cardElement);
  const cardBodyElement = document.createElement('div');
  cardBodyElement.classList.add('card-body');
  cardElement.appendChild(cardBodyElement);
  const cardTitleElement = document.createElement('h2');
  cardTitleElement.classList.add('card-title', 'h4');
  i18n.then((t) => { cardTitleElement.innerText = t('posts'); });
  cardBodyElement.appendChild(cardTitleElement);

  const listElement = document.createElement('ul');
  listElement.classList.add('list-group', 'border-0', 'rounded-0');
  listElement.setAttribute('id', 'posts-list');
  cardElement.appendChild(listElement);
  state.posts.map(({
    /* description, feedId, */ id, link, title,
  }) => {
    const liElement = document.createElement('li');
    liElement.classList.add('list-group-item', 'border-0', 'border-end-0', 'd-flex', 'justify-content-between', 'align-item-start');
    const aElement = document.createElement('a');

    const isSeenPost = state.uiState.seenPosts.has(id);
    const className = isSeenPost ? 'fw-normal' : 'fw-bold';
    aElement.classList.add(className);
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
    button.dataset.bsToggle = 'modal';
    button.dataset.bsTarget = '#modal';
    i18n.then((t) => { button.innerText = t('button'); });
    liElement.appendChild(button);
    document.querySelector('#posts-list').appendChild(liElement);
    return true;
  });
};
const updatePosts = (state) => {
  const fetchFeeds = () => {
    const feedResponse = state.feeds.map((feed) => getFeed(feed.url));
    const postURLs = state.posts.map((post) => post.link);
    const hasNotInState = (post) => !postURLs.includes(post.link);
    Promise.all(feedResponse)
      .then((feeds) => feeds.flatMap((feed) => feed.posts))
      .then((posts) => posts.filter(hasNotInState))
      .then((posts) => { state.posts = [...posts, ...state.posts]; })
      .finally(() => updatePosts(state));
  };
  setTimeout(fetchFeeds, 5000);
};

const addFeed = (url, state) => {
  isValid(url, state).then((response) => {
    if (response === 'notValidURL') {
      throw new Error('form.errors.notValidURL');
    }
    if (response === 'rssFeedExist') {
      throw new Error('form.errors.rssFeedExist');
    }
    return getFeed(url, state);
  })
    .then((response) => {
      console.log(response.name);
      if (response.message === 'ParserError') {
        throw new Error('form.errors.notValidRSS');
      }
      if (response.name === 'AxiosError') {
        throw new Error('form.errors.networkFail');
      }
      return response;
    })
    .then(({ feed, posts }) => {
      state.feeds = [feed, ...state.feeds];
      state.posts = [...posts, ...state.posts];
      state.form.error = '';
    })
    .catch((e) => {
      // console.log(e.message);
      if (e.message === 'form.errors.networkFail') {
        state.form.error = e.message;
      }
      if (e.message === 'form.errors.rssFeedExist') {
        state.form.error = e.message;
      }
      if (e.message === 'form.errors.notValidURL') {
        state.form.error = e.message;
      }
      if (e.message === 'form.errors.notValidRSS') {
        state.form.error = e.message;
      }
    });
};
const previewPost = (postId, state) => {
  state.uiState.activePostId = postId;
  state.uiState.seenPosts.add(postId);
};
const clearActivePost = (state) => {
  state.uiState.activePostId = null;
};
export default (state, i18n) => {
  const elements = {
    feedback: document.querySelector('.feedback'),
    urlInput: document.querySelector('#url-input'),
    form: document.querySelector('.rss-form'),
    feeds: document.querySelector('.feeds'),
    posts: document.querySelector('.posts'),
    modal: document.getElementById('modal'),
  };

  const watchedState = onChange(state, (path, value) => {
    // console.log(path);
    // console.log(value);
    if (path === 'form.error' && state.form.error) {
      elements.urlInput.classList.add('is-invalid');
      elements.feedback.classList.add('text-danger');
      i18n.then((t) => { elements.feedback.innerText = t(value.toString()); });
    }
    if (path === 'feeds' && !state.form.error) {
      renderFeeds(value, i18n, elements);
      elements.urlInput.classList.remove('is-invalid');
      elements.feedback.classList.remove('text-danger');
      elements.feedback.classList.add('text-success');
      i18n.then((t) => { elements.feedback.innerText = t('form.valid'); });
      elements.urlInput.value = '';
      elements.urlInput.removeAttribute('readonly');
      elements.urlInput.focus();
    }
    if (path === 'posts' && !state.form.error) {
      renderPosts(state, i18n, elements);
    }
    if (path === 'uiState.activePostId') {
      const postId = state.uiState.activePostId;
      const activePost = state.posts.find((post) => post.id === postId);
      const { title, description, link } = activePost;
      elements.modal.querySelector('.modal-title').textContent = title;
      elements.modal.querySelector('.modal-body').textContent = description;
      elements.modal.querySelector('.full-article').setAttribute('href', link);
    }
    if (path === 'uiState.seenPosts') {
      renderPosts(state, i18n, elements);
    }
  });

  elements.form.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const url = formData.get('url').trim().toLowerCase();
    addFeed(url, watchedState);
    updatePosts(watchedState);
  });

  elements.posts.addEventListener('click', (event) => {
    if (!event.target.dataset.id) return;
    const postId = event.target.dataset.id;
    previewPost(postId, watchedState);
  });

  elements.modal.addEventListener('hidden.bs.modal', () => {
    clearActivePost(watchedState);
  });

  return watchedState;
};
