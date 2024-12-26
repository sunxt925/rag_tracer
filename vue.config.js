const { defineConfig } = require('@vue/cli-service');

module.exports = defineConfig({
  transpileDependencies: [
    'vuetify'
  ],
  devServer: {
    proxy: {
      '/api': {
        target: 'http://101.42.184.25:8095',
        // target: 'http://xyz.rag-workflow.test.ke.com',
        changeOrigin: true,
        pathRewrite: { '^/api': '/api' },
      },
    },
  },
});