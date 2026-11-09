// Express 4 does not catch rejected promises from async route handlers: a
// failed database query leaves the request hanging and never reaches the
// error handler in server/index.js. This wraps every async handler on a
// router so rejections are forwarded to next(err).
function asyncRoutes(router) {
  for (const layer of router.stack) {
    if (!layer.route) continue;
    for (const routeLayer of layer.route.stack) {
      const fn = routeLayer.handle;
      if (fn.constructor.name === "AsyncFunction") {
        routeLayer.handle = (req, res, next) => fn(req, res, next).catch(next);
      }
    }
  }
  return router;
}

module.exports = { asyncRoutes };
