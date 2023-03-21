// path: ~/.dmt/core/node/frontend/lib/ssrProxy.js
import { log, determineGUIPort } from 'dmt/common';
import { createProxyMiddleware } from 'http-proxy-middleware';

// proxy middleware options
export default (pathName = '', logger = true) => {
  const requestLogger = (proxyServer, options) => {
    proxyServer.on('proxyReq', (proxyReq, req, res) => {
      log.cyan(`${pathName}::[HPM] [${req.method}] ${req.url}`); // outputs: [HPM] GET /users
    });
  };
  /** @type {import('http-proxy-middleware/dist/types').Options} */
  const options = {
    // can also probably use actualGuiPort from state 'gui' ?
    target: `http://127.0.0.1:${determineGUIPort()}/`, // target host with the same base path
    // changeOrigin: true, // needed for virtual hosted sites
    plugins: logger && [requestLogger],
    pathRewrite: path => path.replace(`/${pathName}`, `/_${pathName}/${pathName}`)
  };

  // create the proxy
  return createProxyMiddleware(options);
};
