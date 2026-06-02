import { Pool } from 'pg';

export const pool = new Pool({

  user: 'postgres',

  host: '172.24.98.30',

  database: 'postgres',

  password: 'Aspire@123',

  port: 5432,
});