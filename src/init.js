// Import our custom CSS
import * as yup from 'yup';
import './scss/styles.scss';
import i18next from 'i18next';
import initView from './view.js';

export default async () => {
  const initialState = {
    feeds: [],
    posts: [],
    addFeedProcess: {
      state: 'initialization',
      validationState: null,
      error: null,
    },
    uiState: {
      seenPosts: new Set(),
      activePostId: null,
    },
    updating: false,
  };

  await i18next.init({
    lng: 'ru',
    debug: true,
    resources: {
      ru: {
        translation: {
          form: {
            valid: 'RSS успешно загружен',
            errors: {
              rssFeedExist: 'RSS уже существует',
              notValidURL: 'Ссылка должна быть валидным URL',
              networkFail: 'Ошибка сети',
              notValidRSS: 'Ресурс не содержит валидный RSS',
            },
          },
          feeds: 'Фиды',
          posts: 'Посты',
          button: 'Просмотр',
        },
      },
    },
  });

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
  return initView(initialState, i18next.t, schema);
};
