import { log, colors, determineGUIPort } from 'dmt/common';

import express from 'express';
import fs from 'fs';

//import loadApps from '../../apps-load/loadApps.js';
import { reloadSSRHandler, reloadAllSSRHandlers } from '../../apps-load/index.js';

import ssrProxy from './ssrProxy.js';

const ssrMiddlewares = new Map();
class Server {
  constructor(program) {
    this.program = program;

    this.app = express();

    // ⚠️
    // program gui reload event (happens on "dmt copy" for example)
    // it reloads all SSR handlers
    // next possible update: only reload those handlers that changed (symlink is different)
    // save built_target did in initial load into _initialAppDefinitions
    // this update is not critical for now....
    program.on('gui:reload', () => {
      log.yellow('Gui reload event received — reloading all ssr handlers');
      reloadAllSSRHandlers({ server: this }).catch(e => {
        log.red('Error reloading some ssr handlers, should have received individual notifications and log entries');
        log.red(e);
        // let the program continue
      });
    });
  }

  setupRoutes(expressAppSetup) {
    expressAppSetup(this.app);
  }

  // reload option is not really used now
  useDynamicSSR(appName, callback, reload = false) {
    if (typeof callback != 'function') return;
    const hasMiddleware = !!ssrMiddlewares.get(appName);
    ssrMiddlewares.set(appName, callback);

    // what do you think of program.emit code below
    if (reload && !hasMiddleware) {
      log.green(`💡 New SSR handler loaded: ${colors.magenta(appName)}`);
      // this.program.emit('new_ssr_app', appName);
    } else if (reload) {
      log.cyan(`🔄 SSR handler reload — ${colors.magenta(appName)}`);
      // this.program.emit('reload_ssr_app', appName);
    }

    if (hasMiddleware) return;

    this.app
      .use(`/_${appName}`, (req, res, next) => {
        const callback = ssrMiddlewares.get(appName);
        if (callback) {
          return callback(req, res, next);
        }
        next();
      })
      .use(`/${appName}`, ssrProxy(appName));
  }

  listen() {
    //const name = 'dmt-server';
    //const description = '🌐 DMT-SERVER';

    const port = determineGUIPort();

    if (!port) {
      throw new Error('Gui port is not properly specified! Please specify in services.def');
    }

    this.app
      .get('/__dmt__reload', (req, res) => {
        const appDir = req.query.app;

        if (fs.existsSync(appDir)) {
          //log.red(`__dmt__reload called for app: ${appDir}`);
          reloadSSRHandler({ server: this, appDir })
            .then(() => {
              res.end('success');
            })
            .catch(() => {
              // will report error elsewhere
              res.end('rejected');
            });
        } else {
          log.red(`__dmt__reload appdir do not exist: ${appDir}`);
          res.end('rejected');
        }
      })
      .listen(port, () => {
        //log.green('%s listening at http://%s:%s', description || 'Server', 'localhost', port);

        // TODO: if dmt-gui is disabled we shouldn't show this!
        // we have to test if middleware is loaded or not...
        // not ok: //if (dmt.device().try('service[gui].disable') != 'true') {
        log.cyan('--------------------------------------------------');
        log.cyan(`💡🚀🎸 OPEN DMT IN BROWSER → ${colors.magenta(`http://localhost:${port}`)}`);
        log.cyan('--------------------------------------------------');

        // todo: rename actualGuiPort to actualDmtServer port ... this is not only about gui anymore
        this.program.slot('device').update({ actualGuiPort: port }, { announce: false });
      })
      .on('error', () => {
        //log.gray(`%s ${colors.red('✖')} failed to listen at http://%s:%s -- %s`, description || 'Server', 'localhost', port, e.message);
        throw new Error(`Failed to listen at gui port ${port}`);
      });
  }
}

export default Server;
