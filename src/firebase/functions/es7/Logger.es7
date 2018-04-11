import { format } from './Helpers';

class Logger {
  debug = (...args) => {
    console.log('[DEBUG]: ' + format(...args));
  }

  error = (...args) => {
    console.log('[ERROR]: ' + format(...args));
  }

  log = (...args) => {
    console.log('[INFO]: ' + format(...args));
  }
}

export const logger = new Logger();
