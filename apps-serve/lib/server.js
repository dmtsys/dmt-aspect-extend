import { log, colors, determineGUIPort } from 'dmt/common';

import express from 'express';

const ssrMiddlewares = new Map();
class Server {
  constructor(program) {
    this.program = program;

    this.app = express();
  }

  setupRoutes(expressAppSetup) {
    expressAppSetup(this.app);
  }

  useDynamicSSR(route, callback, reload = false) {
    if (typeof callback != "function") return;
    const hasMiddleware = !!ssrMiddlewares.get(route);
    ssrMiddlewares.set(route, callback);

    // what do you think of program.emit code below
    if (reload & !hasMiddleware) {
      log.green('dmt new ssr app: ' + appName);
      // this.program.emit('new_ssr_app', route);
    } else if (reload) {
      log.green('dmt ssr app reload: ' + appName);
      // this.program.emit('reload_ssr_app', route);
    }

    if (hasMiddleware) return;

    this.app.use(`/_${route}`, function (req, res, next) {
      const callback = ssrMiddlewares.get(route);
      if (callback) {
        return callback(req, res, next);
      }
      next();
    })
      .use(route, ssrProxy(route));
  }

  listen() {
    //const name = 'dmt-server';
    //const description = '🌐 DMT-SERVER';

    const port = determineGUIPort();

    if (!port) {
      throw new Error('Gui port is not properly specified! Please specify in services.def');
    }

    this.app.get('/__dmt__reload', (req, res) => {
      const appDir = req.query.app;
      if (fs.existsSync(appDir)) {
        loadApps([{ appDir }]).then(appDefinations => {
          for (const appName in appDefinations) {
            const ssrHandler = appDefinations[appName]?.ssrHandler;
            if (ssrHandler) {
              this.useDynamicSSR(appName, ssrHandler, true);
            }
          }
          res.end('success');
        }).catch((err) => {
          log.red(err.message || err);
          res.end('rejected');
        })
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
