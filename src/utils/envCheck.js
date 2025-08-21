// Environment check utility for Koyeb deployment
export const checkPuppeteerEnvironment = () => {
  const envInfo = {
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    isKoyeb: !!process.env.KOYEB_SERVICE_ID,
    memoryLimit: process.env.MEMORY_LIMIT || 'unknown',
    runtime: process.env.NODE_ENV || 'unknown',
    chromiumVersion: getChromiumVersion()
  };
  
  console.log('Environment Info:', JSON.stringify(envInfo, null, 2));
  return envInfo;
};

const getChromiumVersion = () => {
  try {
    const chromium = require('@sparticuz/chromium');
    return chromium.version || 'unknown';
  } catch (error) {
    return `error: ${error.message}`;
  }
};

export const logPuppeteerStatus = (stage, details = {}) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Puppeteer ${stage}:`, JSON.stringify(details, null, 2));
};

export const testChromiumInstallation = async () => {
  try {
    const chromium = await import('@sparticuz/chromium');
    const executablePath = await chromium.default.executablePath();
    console.log('Chromium installation test successful:', executablePath);
    return { success: true, path: executablePath };
  } catch (error) {
    console.error('Chromium installation test failed:', error.message);
    return { success: false, error: error.message };
  }
};
