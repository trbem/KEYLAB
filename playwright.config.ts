import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';
const chrome='C:/Program Files/Google/Chrome/Application/chrome.exe';
export default defineConfig({testDir:'tests/e2e',use:{baseURL:'http://localhost:3000',...devices['Desktop Chrome'],launchOptions:{...(existsSync(chrome)?{executablePath:chrome}:{}),args:['--enable-unsafe-swiftshader']}},webServer:{command:'pnpm dev',url:'http://localhost:3000',reuseExistingServer:true,timeout:120000}});
