import * as BunyanLogger from 'bunyan';

import { LoggingBunyan } from '@google-cloud/logging-bunyan';
import { env } from './';

export class Logger {
    public static logger(): BunyanLogger {
        const loggingBunyan = new LoggingBunyan();
        return BunyanLogger.createLogger({
            name: 'Negobot-Logger',
            src: true,
            streams:
                env.ENVIRONMENT === 'local'
                    ? [{ stream: process.stdout, level: 'info' }]
                    : [{ stream: process.stdout, level: 'info' }, loggingBunyan.stream('info')],
        });
    }

    static log = Logger.logger();
}
