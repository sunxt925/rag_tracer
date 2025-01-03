const { defineConfig } = require('@vue/cli-service');

module.exports = defineConfig({
  transpileDependencies: [
    'vuetify'
  ],
  devServer: {
    allowedHosts: [
      'xyz.rag-tool.ke.com',
      '.ke.com'
    ],
    proxy: {
      '/api': {
        target: 'http://xyz.rag-workflow.test.ke.com',
        changeOrigin: true,
        pathRewrite: { '^/api': '/api' },
      },
    },
  },
});