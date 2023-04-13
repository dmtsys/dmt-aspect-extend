import fs from 'fs';
import path from 'path';
import stripAnsi from 'strip-ansi';

import { log, colors, program } from 'dmt/common';

export function loadApps(appList) {
  const promises = [];
  const appNames = [];
  const appDirs = [];
  const appEntries = [];

  appList.forEach(({ appDir }) => {
    const appEntryFilePath = path.join(appDir, 'index.js');
    const appEntrySubprogram = path.join(appDir, 'dmt/index.js');

    if (fs.existsSync(appEntryFilePath) || fs.existsSync(appEntrySubprogram)) {
      const appName = path.basename(appDir);

      if (fs.existsSync(appEntryFilePath)) {
        appNames.push(appName);
        appDirs.push(appDir);
        appEntries.push(appEntryFilePath);
        promises.push(tryLoadApp(appEntryFilePath, appName));
      }

      if (fs.existsSync(appEntrySubprogram)) {
        appNames.push(appName);
        appDirs.push(appDir);
        appEntries.push(appEntrySubprogram);
        promises.push(tryLoadApp(appEntrySubprogram, appName));
      }
    }
  });

  return new Promise((success, reject) => {
    const appDefinitions = [];

    Promise.all(promises).then(returnObjects => {
      returnObjects.forEach((result, i) => {
        if (result) {
          const appName = appNames[i];
          const appDir = appDirs[i];
          const appEntry = appEntries[i];

          const { handler, expressAppSetup } = result;

          let hasSSRHandler = false;

          if (handler) {
            hasSSRHandler = true;
          }

          appDefinitions.push({ appName, appDir, appEntry, hasSSRHandler, ssrHandler: handler, expressAppSetup });
        }
      });

      success(appDefinitions);
    });
  });
}

// async tryLoadSSRHandler(program, ssrHandlerFilePath, appName) {
//   return new Promise((success, reject) => {
//     import(ssrHandlerFilePath).then(mod => {
//       if (mod.handler) {
//         success({ ssrHandler: mod.handler });
//       } else {
//         log.yellow(`⚠️ ${ssrHandlerFilePath} is not exporting { handler: ... }, ignoring ...`);
//         success({});
//       }
//     });
//   });
// }

async function tryLoadApp(appEntryFilePath, appName) {
  // todo: also show icons for isDeviceApp, isUserApp here
  log.white(`🤖 Loading ${colors.magenta(appName)} subprogram`);

  return new Promise((success, reject) => {
    loadApp(appEntryFilePath)
      .then(success)
      .catch(e => {
        const msg = `🪲 ⚠️  Problem loading ${colors.cyan(appName)} app — ${colors.red(e)}`;
        log.red(msg);

        program.exceptionNotify(stripAnsi(msg));

        log.magenta(`↳ ${colors.cyan('dmt-proc')} will continue without this app`);

        success(); // we reported the problem and now we treat this as a success (so that Promise.all does not fail)
      });
  });
}

// import app index.js file and call the exposed init() function,
async function loadApp(appEntryFilePath) {
  return new Promise((success, reject) => {
    importComplex(appEntryFilePath).then(success).catch(reject);
  });
}

export function importComplex(appEntryFilePath) {
  return new Promise((success, reject) => {
    // quite simple loading procedure but seems convoluted because of all error handling
    // and especially because mid init function can be async
    // and we have to distinguish these two cases (async and normal init function) for proper error handling
    import(`${appEntryFilePath}?${Math.random()}`) // ⚠️ do we still need this random here??? probably not
      .then(mod => {
        let promiseOrData;
        let isPromise;

        if (mod.init) {
          try {
            promiseOrData = mod.init(program);
            isPromise = promiseOrData instanceof Promise;
          } catch (e) {
            reject(e);
            return;
          }

          if (isPromise) {
            const promise = promiseOrData;
            // async init function
            promise
              .then(returnObject => {
                //success({ initData: returnObject, handler: returnObject?.handler });
                // ⚠️ expressAppSetup --> LEGACY, remove... or improve in case it could be useful for something later
                success({ expressAppSetup: returnObject?.expressAppSetup, handler: returnObject?.handler });
              })
              .catch(reject);
          } else {
            // data returned from app init function
            //success({ initData: promiseOrData, handler: promiseOrData?.handler });
            // ⚠️ expressAppSetup --> LEGACY, remove... or improve in case it could be useful for something later
            success({ expressAppSetup: promiseOrData?.expressAppSetup, handler: promiseOrData?.handler });
          }
        } else {
          log.yellow(`⚠️ ${appEntryFilePath} is not exporting { init: ... }, ignoring ...`);
          success({}); // nothing ... it was invalid entry point -- missing init function
        }
      })
      .catch(reject);
  });
}
