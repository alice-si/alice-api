let Config = Object.assign({
  logLevel: 'debug',
  emailRequiresAuthStatusCode: 403,
  defaultTimeout: 2000, // ms
  timeout3DS: 300000 // ms
}, __CONFIG__);

export default Config;
