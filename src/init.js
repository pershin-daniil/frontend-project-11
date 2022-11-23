// Import our custom CSS
import './scss/styles.scss';
import i18next from 'i18next';
import initView from './view.js';

export default () => {
  const initialState = {
    feeds: [],
    posts: [],
    form: {
      error: null,
    },
    uiState: {
      seenPosts: new Set(),
      activePostId: null,
    },
  };

  const i18n = new Promise((resolve, reject) => {
    i18next.createInstance({
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
    }, (error, t) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(t);
    });
  });
  return i18n
    .then(
      //  i18n.then((t) => console.log(t('form.valid')));
      initView(initialState, i18n),
    );
};
