const Hapi = require('hapi');
const Wreck = require('wreck');

const repos = require('./repos.json');

function getAccessTokenFromCode(code) {
  return new Promise((resolve, reject) => {
    Wreck.post('https://github.com/login/oauth/access_token', {
      headers: {
        'Accept': 'application/json'
      },
      json: true,
      payload: {
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        code
      }
    }, (err, res, payload) => {
      if (err) {
        reject();
      }
      resolve(payload);
    });
  });
}


function handleOauth(request, reply) {
    getAccessTokenFromCode(request.query.code)
      .then(({access_token}) => {
        reply('success')
          .state('token', access_token)
          .redirect('/');
      });
}

// Create a server with a host and port
const server = new Hapi.Server();

server.connection({ 
    host: '0.0.0.0', 
    port: 8000 
});

server.register(require('vision'), (err) => {
  if (err) {
    throw err;
  }
  server.views({
    engines: {
      html: require('ejs')
    },
    relativeTo: __dirname,
    path: 'templates'
  });
});

server.register(require('inert'), (err) => {
  if (err) {
    throw err;
  }

  server.state('token', {
    ttl: 365 * 24 * 60 * 60 * 1000, // expires a year from today
    encoding: 'none',
    isSecure: false,
    isHttpOnly: false,
    clearInvalid: false,
    strictHeader: true
  })

  server.route([{
    method: 'GET',
    path: '/{param*}',
    handler: {
        directory: {
            path: 'public',
            listing: true,
            index: true,
        }
    }
  }, {
    method: 'GET',
    path: '/oauth',
    handler: handleOauth
  }, {
    method: 'GET',
    path: '/',
    handler: function(req, reply) {
      reply.view('index', { repos: JSON.stringify(repos) });
    }
  }]);

  server.start((err) => {
    if (err) {
        throw err;
    }
    console.log('Server running at:', server.info.uri);
  });
});
