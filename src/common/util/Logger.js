import { format } from './Helpers';

class Logger {
  debug = (...args) => {
    console.log('[DEBUG]: ' + format(...args));
  }

  error = (...args) => {
    console.error(format(...args));
  }

  log = (...args) => {
    console.log(format(...args));
  }
}

export const logger = new Logger();
