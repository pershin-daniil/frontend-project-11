// Import our custom CSS
import './scss/styles.scss';
import i18next from 'i18next';
import initView from './view.js';

// Import all of Bootstrap's JS
// import * as bootstrap from 'bootstrap';

export default () => {
  const initialState = {
    feeds: [],
    form: {
      valid: Boolean,
      error: '',
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
                notValidUrl: 'Ссылка должна быть валидным URL',
                networkFail: 'Ошибка сети. Попробуйте еще раз.',
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
  //  i18n.then((t) => console.log(t('form.valid')));
  initView(initialState, i18n);
};
