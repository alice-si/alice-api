import Config from './config/config';
import Winston from 'winston';

const logger = Winston.createLogger({
  format: Winston.format.prettyPrint(),
  transports: [
    new Winston.transports.Console()
  ],
  level: Config.logLevel,
});

export default logger;