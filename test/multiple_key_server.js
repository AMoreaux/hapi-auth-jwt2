const Hapi = require('hapi');
const Boom = require('boom');

// for debug options see: http://hapijs.com/tutorials/logging
const server = new Hapi.Server({ debug: false });

const multiTenantSecretKeys = {
  dunderMifflin: ['michaelscott', 'jimhalpert'],
  wernhamHogg: ['davidbrent', 'garethkeenan']
};

const db = {
  "123": { allowed: true,  "name": "Charlie"   },
  "321": { allowed: false, "name": "Old Gregg" }
};

const keyFunc = function (decoded) {
  if (decoded.tenant) {
    const keys = multiTenantSecretKeys[decoded.tenant];

    if (keys) {
      return {key: keys, additional: 'something extra here if needed' };
    }
    else {
      throw Boom.unauthorized('Key not found');
    }
  }
  else {
    throw Boom.badRequest('Tenant was not specified in token payload');
  }
};

// defining our own validate function lets us do something
// useful/custom with the decodedToken before reply(ing)
const validate = function (decoded, request) {
  if (db[decoded.id].allowed) {
    const credentials = decoded;

    if (request.plugins['hapi-auth-jwt2']) {
      credentials.extraInfo = request.plugins['hapi-auth-jwt2'].extraInfo;
    }

    return {valid: true, credentials};
  }
  else {
    return {valid:false};
  }
};

const home = function(req, h) {
  return 'Hai!';
};

const privado = function(req, h) {
  const data = (req.auth.credentials.extraInfo) ? req.auth.credentials.extraInfo : null;

  return {
    message: 'success',
    data: data
  };
};
const init = async() => {
  await server.register(require('../'));

  server.auth.strategy('jwt', 'jwt', { key: keyFunc, validate });

  server.route([
    { method: 'GET',  path: '/', handler: home, config: { auth: false } },
    { method: 'POST', path: '/privado', handler: privado, config: { auth: 'jwt' } }
  ]);

};

init();

module.exports = server;
