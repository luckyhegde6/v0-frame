import 'dotenv/config';
import { defineConfig } from 'prisma/config';

const isLocal = process.env.ENVIRONMENT === 'local';
const dbUrl = isLocal
    ? (process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/frame?schema=public")
    : process.env.POSTGRES_PRISMA_URL;

export default defineConfig({
    datasource: {
        url: dbUrl,
    },
    migrations: {
        seed: 'npx tsx --env-file=.env prisma/seed.ts',
    },
});
