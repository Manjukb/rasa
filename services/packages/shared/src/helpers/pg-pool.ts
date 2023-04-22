import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const config = {
    host: process.env.postgres_host,
    user: process.env.postgres_user,
    password: process.env.postgres_password,
    database: process.env.postgres_table,
    port: 5432,
};

const PgPool = new Pool(config);
export { PgPool };
