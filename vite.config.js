import { defineConfig } from 'vite';
export default defineConfig({base:process.env.DEPLOY_BASE || '/',server:{proxy:{'/ollama':{target:'http://127.0.0.1:11434',rewrite:p=>p.replace(/^\/ollama/,'')}}}});
