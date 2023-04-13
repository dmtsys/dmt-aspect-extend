import fs from 'fs';
import path from 'path';

import { log, program } from 'dmt/common';

import { loadApps, importComplex } from './loadApps.js';
import { appFrontendList, appsDir, allApps } from './appFrontendList.js';

// TODO -- (not critical) -- what if things change... some apps no longer have
// ssr handlers or some get a new ssr handler...
let _initialAppDefinitions;

// SSR handlers cannot have state, timeouts etc.
function reloadSSRHandler({ server, appDir }) {
  return new Promise((success, reject) => {
    const match = _initialAppDefinitions.find(a => a.appDir == appDir && a.hasSSRHandler);

    if (match) {
      //⚠️ there shuld not be any other things with state in that index.js
      // just handler export!
      // should be stateless without timers or anything that should not get loaded multiple times!!
      // (on each ssr handler reload)
      const appEntryFilePath = path.join(appDir, 'index.js');

      importComplex(appEntryFilePath)
        .then(({ handler }) => {
          server.useDynamicSSR(match.appName, handler, true); // reload option is not really used now (last argument -- true)
          success();
        })
        .catch(e => {
          program.exceptionNotify(e, `Error while reloading ${appDir} ssr handler, check log`);
          reject(e);
        });
    }
  });
}

function reloadAllSSRHandlers({ server }) {
  return new Promise((success, reject) => {
    //⚠️ DO SOME MORE WORK-- what if there is no more ssrHandlers!! ??
    for (const { appDir, hasSSRHandler } of _initialAppDefinitions) {
      if (hasSSRHandler) {
        // no strictly needed, just for clarity, because we check inside reloadSSRHandler again
        reloadSSRHandler({ server, appDir }).catch(reject);
      }
    }
  });
}

async function init(program) {
  program.slot('appList').set(appFrontendList());

  // SETUP BACKEND

  if (!fs.existsSync(appsDir)) {
    log.gray("Apps directory doesn't exist");
  }

  loadApps(allApps)
    .then(appDefinitions => {
      _initialAppDefinitions = JSON.parse(JSON.stringify(appDefinitions));

      program.emit('apps_loaded', appDefinitions);
    })
    .catch(e => {
      log.red('Problem loading apps');
      log.red(e);
    });
}

export { init, appFrontendList, reloadSSRHandler, reloadAllSSRHandlers };
