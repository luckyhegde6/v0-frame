export default {
    datasource: {
        url: process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL,
    },
};
