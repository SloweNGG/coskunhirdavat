import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

const paytrConfigured =
  !!process.env.PAYTR_MERCHANT_ID &&
  !!process.env.PAYTR_MERCHANT_KEY &&
  !!process.env.PAYTR_MERCHANT_SALT

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET,
    }
  },
  modules: [
    {
      resolve: '@medusajs/medusa/payment',
      options: {
        providers: paytrConfigured
          ? [
              {
                resolve: './src/modules/paytr',
                id: 'paytr',
                options: {
                  merchantId: process.env.PAYTR_MERCHANT_ID,
                  merchantKey: process.env.PAYTR_MERCHANT_KEY,
                  merchantSalt: process.env.PAYTR_MERCHANT_SALT,
                  storefrontUrl:
                    process.env.PAYTR_STOREFRONT_URL || 'http://localhost:8000',
                  testMode: process.env.PAYTR_TEST_MODE !== 'false',
                  debug: process.env.PAYTR_DEBUG === 'true',
                  maxInstallment: Number(process.env.PAYTR_MAX_INSTALLMENT || 0),
                  noInstallment: process.env.PAYTR_NO_INSTALLMENT === 'true',
                  apiBaseUrl: process.env.PAYTR_API_BASE_URL || undefined,
                },
              },
            ]
          : [],
      },
    },
  ],
})
