import * as dotenv from 'dotenv';
dotenv.config();
import { PlaywrightTestConfig, TraceMode } from '@playwright/test';
const { devices } = require('@playwright/test');

//Report Portal configurations
  export const RPconfig = {
  apiKey: '4debfd27-9504-461f-86e4-b1cb91e65dd0',
  endpoint: 'http://hypertestxcenterreportportal:4444/api/v1',
  project: 'GUIDEWIRE',
  launch: "Sample_Run",
  enabled: false,
  attributes: [
    {
      key: 'key',
      value: 'value',
    },
    {
      value: 'value',
    },
  ],
  description: "Playwright_Js_Run",
};

const reporters: any[] = [
  ['html', { open: 'never' }],
  ['allure-playwright', { 
    detail: false,
    clean: true,
    logLevel: 'DEBUG',
    attachments: { enabled: false },
  }],
];


// 👉 Add ReportPortal reporter only when enabled = true
if (RPconfig.enabled) {
  reporters.push(['@reportportal/agent-js-playwright', RPconfig]);
}

const config: PlaywrightTestConfig = {
    timeout: 1 * 300 * 1000,
    expect: {
      timeout: 300*1000,
    },
    retries: 0,
    fullyParallel: true,
    forbidOnly: false,
    workers: 10,
    use: {
      
      headless: false,
      screenshot: 'on',
      video: 'on',
      actionTimeout: 60*1000,
      navigationTimeout: 100*1000,
      trace: process.env.TRACE_VIEWER as TraceMode,
    },   
    projects: [
        {
            name: 'chrome:latest:Windows 11@lambdatest',
            use: {
              viewport: { width: 1280, height: 720 }
            }
            },
            {
                name: 'chrome',
                use: {
                  ...devices['Desktop Chrome'], channel: 'chrome',
                  fullscreen: true,
                }
              },
        ],
        reporter: reporters,
        
        
      //   [['html',{ open: 'never' }]
      //   ,['@reportportal/agent-js-playwright', RPconfig]
      //   ,["allure-playwright", { detail: false ,"clean": true,"logLevel": "DEBUG","attachments": {
      //     "enabled": false
      // }}]],
      //   testDir: './tests',
};

export default config;