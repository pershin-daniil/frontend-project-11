import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import parser from './parser.js';

export const isValid = async (url, urls, schema) => {
  try {
    const result = await schema.notOneOf(urls).validate(url);
    return result;
  } catch (e) {
    const response = e.errors[0];
    if (response === 'notValidURL') {
      throw new Error('form.errors.notValidURL');
    }
    if (response === 'rssFeedExist') {
      throw new Error('form.errors.rssFeedExist');
    }
    throw e;
  }
};

const proxy = {
  get: (url) => `https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(url)}`,
};

export const getFeed = async (url) => {
  try {
    const response = await axios.get(proxy.get(url));
    const { title, description, posts } = parser(response.data.contents);

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
  } catch (e) {
    if (e.message === 'ParserError') {
      throw new Error('form.errors.notValidRSS');
    }
    if (e.name === 'AxiosError') {
      throw new Error('form.errors.networkFail');
    }
    throw e;
  }
};

export const updatePosts = (state) => {
  const fetchFeeds = () => {
    const feedResponse = state.feeds.map((feed) => getFeed(feed.url));
    const postURLs = state.posts.map((post) => post.link);
    const hasNotInState = (post) => !postURLs.includes(post.link);
    Promise.all(feedResponse)
      .then((feeds) => {
        const posts = feeds
          .flatMap((feed) => feed.posts)
          .filter(hasNotInState);
        state.posts = [...posts, ...state.posts];
      })
      .finally(() => updatePosts(state));
  };
  setTimeout(fetchFeeds, 5000);
};
