import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Cloudy',
    description: 'Send selected text to Cloudy hub',
    version: '0.1.0',
    host_permissions: ['<all_urls>'],
    permissions: ['storage', 'activeTab', 'contextMenus'],
  },
});
