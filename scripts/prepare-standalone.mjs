import { cpSync, existsSync, mkdirSync } from 'node:fs';
if (!existsSync('.next/standalone/server.js')) throw new Error('Standalone build missing');
mkdirSync('.next/standalone/.next', { recursive: true });
cpSync('.next/static', '.next/standalone/.next/static', { recursive: true });
cpSync('public', '.next/standalone/public', { recursive: true });
