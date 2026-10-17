import convict from 'convict';
import validator from 'convict-format-with-validator';

convict.addFormats(validator);

type RestSchema = {
  PORT: number;
  DB_HOST: string;
  SALT: string;
  DB_USER: string;
  DB_PASSWORD: string;
  DB_PORT: number;
  DB_NAME: string;
};
export default RestSchema;

export const configRestSchema = convict<RestSchema>({
  DB_USER: {
    doc: 'Пользователь MongoDB',
    format: String,
    env: 'DB_USER',
    default: null,
  },
  DB_PASSWORD: {
    doc: 'Пароль пользователя MongoDB',
    format: String,
    env: 'DB_PASSWORD',
    default: null,
  },
  DB_PORT: {
    doc: 'Порт MongoDB',
    format: 'port',
    env: 'DB_PORT',
    default: null,
  },
  DB_NAME: {
    doc: 'Название базы данных',
    format: String,
    env: 'DB_NAME',
    default: null,
  },
  PORT: {
    doc: 'Порт приложения',
    format: 'port',
    env: 'PORT',
    default: null,
  },
  DB_HOST: {
    doc: 'IP-адрес сервера базы данных',
    format: 'ipaddress',
    env: 'DB_HOST',
    default: null,
  },
  SALT: {
    doc: 'Соль для хеширования паролей',
    format: (value: unknown) => {
      if (typeof value !== 'string' || !value.trim()) {
        throw new Error('SALT должна быть непустой строкой.');
      }
    },
    env: 'SALT',
    default: null,
  }
});
