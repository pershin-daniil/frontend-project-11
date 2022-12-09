import onChange from 'on-change';
import ADD_FEED_STATE from './constants.js';
import { getFeed, isValid, updatePosts } from './service.js';

const createElement = (element, classList) => {
  const newElement = document.createElement(element);
  newElement.classList.add(...classList);
  return newElement;
};
const createWrapper = (element, i18n) => {
  const cardElement = createElement('div', ['card', 'border-0']);
  const cardBodyElement = createElement('div', ['card-body']);
  cardElement.appendChild(cardBodyElement);
  const cardTitleElement = createElement('h2', ['card-title', 'h4']);
  cardTitleElement.innerText = i18n(element);
  cardBodyElement.appendChild(cardTitleElement);
  const listElement = createElement('ul', ['list-group', 'border-0', 'rounded-0']);
  listElement.setAttribute('id', `${element}-list`);
  cardElement.appendChild(listElement);
  return cardElement;
};
const renderFeeds = (feeds, i18n, elements) => {
  elements.feeds.innerHTML = '';
  const cardElement = createWrapper('feeds', i18n);
  elements.feeds.appendChild(cardElement);

  feeds.forEach(({ title, description }) => {
    const liElement = createElement('li', ['list-group-item', 'border-0', 'border-end-0']);
    document.querySelector('#feeds-list').appendChild(liElement);
    const h3Element = createElement('h3', ['h6', 'm-0']);
    h3Element.innerText = title;
    liElement.appendChild(h3Element);
    const pElement = createElement('p', ['small', 'm-0', 'text-black-50']);
    pElement.innerText = description;
    liElement.appendChild(pElement);
  });
};

const renderPosts = (state, i18n, elements) => {
  elements.posts.innerHTML = '';
  const cardElement = createWrapper('posts', i18n);
  elements.posts.appendChild(cardElement);

  state.posts.forEach(({
    id, link, title,
  }) => {
    const liElement = createElement('li', [
      'list-group-item', 'border-0', 'border-end-0', 'd-flex', 'justify-content-between', 'align-item-start',
    ]);

    const isSeenPost = state.uiState.seenPosts.has(id);
    const className = isSeenPost ? 'fw-normal' : 'fw-bold';

    const aElement = createElement('a', [className]);
    aElement.setAttribute('href', link);
    aElement.setAttribute('data-id', id);
    aElement.setAttribute('target', '_blank');
    aElement.setAttribute('rel', 'noopener noreferrer');
    aElement.innerText = title;
    liElement.appendChild(aElement);

    const button = createElement('button', ['btn', 'btn-outline-primary', 'btn-sm']);
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
const addFeed = async (url, state, schema) => {
  try {
    const existUrls = state.feeds.map((feed) => feed.url);
    await isValid(url, existUrls, schema);
    state.addFeedProcess.error = '';
    state.addFeedProcess.validationState = ADD_FEED_STATE.VALID;
    state.addFeedProcess.state = ADD_FEED_STATE.PROCESSING;
    const { feed, posts } = await getFeed(url, state);
    state.feeds = [feed, ...state.feeds];
    state.posts = [...posts, ...state.posts];
    state.addFeedProcess.state = ADD_FEED_STATE.PROCESSED;
  } catch (e) {
    switch (e.message) {
      case 'form.errors.networkFail':
        state.addFeedProcess.error = e.message;
        state.addFeedProcess.state = ADD_FEED_STATE.FAILED;
        break;
      case 'form.errors.rssFeedExist':
        state.addFeedProcess.error = e.message;
        state.addFeedProcess.validationState = ADD_FEED_STATE.INVALID;
        break;
      case 'form.errors.notValidURL':
        state.addFeedProcess.error = e.message;
        state.addFeedProcess.validationState = ADD_FEED_STATE.INVALID;
        break;
      case 'form.errors.notValidRSS':
        state.addFeedProcess.error = e.message;
        state.addFeedProcess.state = ADD_FEED_STATE.FAILED;
        break;
      default:
        console.log(e);
    }
  }
};
const previewPost = (postId, state) => {
  state.uiState.activePostId = postId;
  state.uiState.seenPosts.add(postId);
};
const clearActivePost = (state) => {
  state.uiState.activePostId = '';
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
