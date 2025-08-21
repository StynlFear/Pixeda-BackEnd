// Environment check utility for Koyeb deployment
export const checkPuppeteerEnvironment = () => {
  const envInfo = {
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    isKoyeb: !!process.env.KOYEB_SERVICE_ID,
    memoryLimit: process.env.MEMORY_LIMIT || 'unknown',
    runtime: process.env.NODE_ENV || 'unknown'
  };
  
  console.log('Environment Info:', JSON.stringify(envInfo, null, 2));
  return envInfo;
};

export const logPuppeteerStatus = (stage, details = {}) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Puppeteer ${stage}:`, JSON.stringify(details, null, 2));
};
