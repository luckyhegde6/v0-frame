// Prisma v7 configuration
// In preview/test environments without a database, provide a placeholder URL
const dbUrl = process.env.POSTGRES_PRISMA_URL || 
              process.env.DATABASE_URL || 
              'postgresql://user:password@localhost:5432/placeholder';

export default {
    datasource: {
        url: dbUrl,
        directUrl: process.env.POSTGRES_URL_NON_POOLING || dbUrl,
    },
};
