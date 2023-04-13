import express from 'express';

import { log, colors } from 'dmt/common';

import { contentServer } from 'dmt/connectome-next';
import { appFrontendList } from 'dmt/apps-load';

import Server from './lib/server.js';
import setupRedirects from './lib/setupRedirects.js';

// do this for SSR handlers and subprograms as well!
function getSymbol({ isDeviceApp, isUserApp }) {
  if (isUserApp) {
    return '👤';
  }
  if (isDeviceApp) {
    return '💻';
  }
}

function mountApps(appDefinitions, server) {
  // remove second parameter (server) after legacy gui is removed
  return app => {
    //⚠️ HACK
    // todo: entire confusion with user apps overloading system apps...
    // now we might take into account the wrong app
    const ssrApps = [];

    // todo: also show icons for isDeviceApp, isUserApp here
    for (const { appName, expressAppSetup, ssrHandler } of appDefinitions) {
      if (ssrHandler) {
        server.useDynamicSSR(appName, ssrHandler);
        ssrApps.push(appName);
        // } else if (initData?.express) {
        //   // TODO: reconsider
        log.cyan(`📐 Loading SRR app code for ${colors.magenta(appName)} at ${colors.gray(`/${appName}`)}`);
        //   app.use(`/${appName}`, initData.express);
        //   ssrApps.push(appName);
      } else if (expressAppSetup) {
        // ⚠️⚠️⚠️ LEGACY -- remove after GUI legacy is removed
        server.setupRoutes(expressAppSetup);
      }
    }

    // mount static
    appFrontendList().forEach(({ appName, publicDir, isDeviceApp, isUserApp }) => {
      const symbol = getSymbol({ isDeviceApp, isUserApp }) || '📃';
      //it will only work with dmt and dmt-search ...
      if (!ssrApps.includes(appName)) {
        log.cyan(`${symbol} Loading static frontend for ${colors.magenta(appName)} at ${colors.gray(`/${appName}`)}`);
        app.use(`/${appName}`, express.static(publicDir));
      }
    });

    setupRedirects({ app });
  };
}

function init(program) {
  const server = new Server(program);

  program.on('apps_loaded', appDefinitions => {
    // ⚠️ remove second argument (server) after legacy gui remove
    server.setupRoutes(mountApps(appDefinitions, server));

    // todo: perhaps move elsewhere
    server.setupRoutes(app => contentServer({ app }));

    server.listen();
  });
}

export { init };
