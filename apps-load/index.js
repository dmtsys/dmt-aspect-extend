import express from 'express';

import fs from 'fs';

import { log, colors } from 'dmt/common';

import loadApps from './loadApps.js';
import { appFrontendList, appsDir, allApps } from './appFrontendList.js';

/* Short and Sweet middleware ! */

async function init(program) {
  program.slot('appList').set(appFrontendList());

  // SETUP BACKEND

  if (!fs.existsSync(appsDir)) {
    log.gray("Apps directory doesn't exist");
  }

  loadApps(allApps)
    .then(appDefinitions => {
      // // [[appName1, result1], [appName1, result1] ...]
      program.emit('apps_loaded', appDefinitions);
    })
    .catch(e => {
      log.red('Problem loading apps');
      log.red(e);
    });
}

export { init, appFrontendList };
