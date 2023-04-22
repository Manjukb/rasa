// eslint-disable-next-line @typescript-eslint/no-var-requires
const dotenv = require('dotenv');
dotenv.config();
module.exports = {
    type: 'postgres',
    host: process.env.postgres_host,
    username: process.env.postgres_user,
    password: process.env.postgres_password,
    database: process.env.postgres_table,
    port: process.env.postgres_port || 5432,
    synchronize: false,
    logging: process.env.postgres_logging && process.env.postgres_logging.toLowerCase() === 'true' ? true : false,
    entities: ['../shared/dist/database/models/**/*.js'],
    migrations: ['../shared/dist/database/migrations/**/*.js'],
    cli: {
        entitiesDir: '../shared/src/database/models',
        migrationsDir: '../shared/src/database/migrations',
    },
    extra: { poolSize: 10 },
    migrationsTransactionMode: 'each',
};