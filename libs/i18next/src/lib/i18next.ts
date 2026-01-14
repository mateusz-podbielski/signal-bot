import { join } from 'path';
import { readdirSync, lstatSync } from 'fs';
import i18next from 'i18next';
import Backend  from 'i18next-fs-backend';

export const i18n = i18next
  .use(Backend)
  .init({
    initImmediate: false,
    fallbackLng: 'pl',
    lng: 'pl',
    preload: readdirSync(join(__dirname, './assets/locales')).filter((fileName) => {
      const joinedPath = join(join(__dirname, './assets/locales'), fileName);
      return lstatSync(joinedPath).isDirectory();
    }),
    backend: {
      loadPath: join(__dirname, './assets/locales/{{ns}}/{{lng}}.json')
    }
  })
