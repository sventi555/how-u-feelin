import { createLogger, format, transports } from 'winston';
const { combine, timestamp, json, colorize, simple } = format;

const logger = createLogger({
    level: 'info',
    transports: [
    //
    // - Write all logs with level `error` and below to `error.log`
    // - Write all logs with level `info` and below to `combined.log`
    // - Log to the `console` with the format: `${info.level}: ${info.message} JSON.stringify({ ...rest })`
        new transports.File({ filename: 'error.log', level: 'error', format: combine(timestamp(), json()) }),
        new transports.File({ filename: 'combined.log', format: combine(timestamp(), json()) }),
        new transports.Console({ format: combine(colorize(), simple()) })
    ],
});

export default logger;
