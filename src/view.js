import onChange from 'on-change';
import ADD_FEED_STATE from './constants.js';
import { getFeed, isValid, updatePosts } from './service.js';

const createElement = (element, classList) => {
  const newElement = document.createElement(element);
  newElement.classList.add(...classList);
  return newElement;
};

const renderFeeds = (feeds, i18n, elements) => {
  elements.feeds.innerHTML = '';
  const cardElement = createElement('div', ['card', 'border-0']);
  elements.feeds.appendChild(cardElement);
  const cardBodyElement = document.createElement('div');
  cardBodyElement.classList.add('card-body');
  cardElement.appendChild(cardBodyElement);
  const cardTitleElement = document.createElement('h2');
  cardTitleElement.classList.add('card-title', 'h4');
  cardTitleElement.innerText = i18n('feeds');
  cardBodyElement.appendChild(cardTitleElement);

  const listElement = document.createElement('ul');
  listElement.classList.add('list-group', 'border-0', 'rounded-0');
  listElement.setAttribute('id', 'feed-list');
  cardElement.appendChild(listElement);
  feeds.forEach(({ title, description }) => {
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
  cardTitleElement.innerText = i18n('posts');
  cardBodyElement.appendChild(cardTitleElement);

  const listElement = document.createElement('ul');
  listElement.classList.add('list-group', 'border-0', 'rounded-0');
  listElement.setAttribute('id', 'posts-list');
  cardElement.appendChild(listElement);
  state.posts.forEach(({
    id, link, title,
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
    button.innerText = i18n('button');
    liElement.appendChild(button);
    document.querySelector('#posts-list').appendChild(liElement);
    return true;
  });
};
const addFeed = (url, state, schema) => {
  const existUrls = state.feeds.map((feed) => feed.url);
  isValid(url, existUrls, schema)
    .then(() => {
      state.addFeedProcess.error = null;
      state.addFeedProcess.validationState = ADD_FEED_STATE.VALID;
      state.addFeedProcess.state = ADD_FEED_STATE.PROCESSING;
      return getFeed(url, state);
    })
    .then((response) => {
      if (response.message === 'ParserError') {
        throw new Error('form.errors.notValidRSS');
      }
      if (response.name === 'AxiosError') {
        throw new Error('form.errors.networkFail');
      }
      const { feed, posts } = response;
      state.feeds = [feed, ...state.feeds];
      state.posts = [...posts, ...state.posts];
      state.addFeedProcess.state = ADD_FEED_STATE.PROCESSED;
    })
    .catch((e) => {
      // console.log(e.message);
      if (e.message === 'form.errors.networkFail') {
        state.addFeedProcess.error = e.message;
        state.addFeedProcess.state = ADD_FEED_STATE.FAILED;
      }
      if (e.message === 'form.errors.rssFeedExist') {
        state.addFeedProcess.error = e.message;
        state.addFeedProcess.validationState = ADD_FEED_STATE.INVALID;
      }
      if (e.message === 'form.errors.notValidURL') {
        state.addFeedProcess.error = e.message;
        state.addFeedProcess.validationState = ADD_FEED_STATE.INVALID;
      }
      if (e.message === 'form.errors.notValidRSS') {
        state.addFeedProcess.error = e.message;
        state.addFeedProcess.state = ADD_FEED_STATE.FAILED;
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
const clearError = (elements) => {
  elements.feedback.innerHTML = '';
  elements.feedback.classList.remove('text-success', 'text-danger');
  elements.urlInput.classList.remove('is-invalid');
};
export default (state, i18n, schema) => {
  const elements = {
    feedback: document.querySelector('.feedback'),
    urlInput: document.querySelector('#url-input'),
    form: document.querySelector('.rss-form'),
    feeds: document.querySelector('.feeds'),
    posts: document.querySelector('.posts'),
    modal: document.getElementById('modal'),
    submitBtn: document.querySelector('.rss-form button[type="submit"]'),
  };

  const watchedState = onChange(state, (path, value) => {
    // console.log(path);
    // console.log(value);
    if (path === 'addFeedProcess.error' && value) {
      elements.urlInput.classList.add('is-invalid');
      elements.feedback.classList.add('text-danger');
      elements.feedback.innerText = i18n(value);
    }
    if (path === 'feeds' && value.length) {
      renderFeeds(value, i18n, elements);
    }
    if (path === 'posts' && value.length) {
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
    if (path === 'updating' && value) {
      console.log(value);
      updatePosts(watchedState);
    }
    if (path === 'addFeedProcess.state') {
      if (value === ADD_FEED_STATE.PROCESSING) {
        clearError(elements);
        elements.submitBtn.disabled = true;
        elements.urlInput.setAttribute('readonly', true);
      }
      if (value === ADD_FEED_STATE.PROCESSED) {
        clearError(elements);
        elements.urlInput.value = '';
        elements.urlInput.removeAttribute('readonly');
        elements.urlInput.focus();
        elements.submitBtn.disabled = false;
        elements.feedback.classList.add('text-success');
        elements.feedback.innerText = i18n('form.valid');
      }
      if (value === ADD_FEED_STATE.FAILED) {
        elements.submitBtn.disabled = false;
        elements.urlInput.removeAttribute('readonly');
      }
    }
  });

  elements.form.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const url = formData.get('url').trim().toLowerCase();
    addFeed(url, watchedState, schema);
    watchedState.updating = true;
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
