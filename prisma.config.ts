export default {
    datasource: {
        url: process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL,
        directUrl: process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL,
    },
};
