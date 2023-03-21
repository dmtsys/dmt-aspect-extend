import { log, colors, determineGUIPort } from 'dmt/common';

import express from 'express';

class Server {
  constructor(program) {
    this.program = program;

    this.app = express();
  }

  setupRoutes(expressAppSetup) {
    expressAppSetup(this.app);
  }

  listen() {
    //const name = 'dmt-server';
    //const description = '🌐 DMT-SERVER';

    const port = determineGUIPort();

    if (!port) {
      throw new Error('Gui port is not properly specified! Please specify in services.def');
    }

    this.app
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
