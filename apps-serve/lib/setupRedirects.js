import { device } from 'dmt/common';

export default function setupRedirects({ app }) {
  // this won't be taken into account for now because legacy gui also sets up redirect from / to /home
  // and it gets added last so it has precedence... but after legacy gui is removed this will work:
  // todo: remove this comment after legacy gui remove
  const redirects = { '/': '/dmt' };
  //const redirects = { '/': '/home' };

  // will be useful soon
  //if (dmt.device().id == 'theta' || dmt.isDevMachine()) {
  if (device().serverMode) {
    redirects['/'] = '/dmt-search';
  }

  for (const [source, target] of Object.entries(redirects)) {
    app.get(source, (req, res) => {
      //console.log(req.host);
      //⚠️ only supports redirects from '/' (l) ...
      // is that all we need?
      // if not we have to parse a bit more complex
      res.redirect(`${target}${req.originalUrl}`); // we do this to keep query params etc.
    });
  }
}
