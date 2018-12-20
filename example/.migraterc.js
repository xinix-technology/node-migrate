const NormStorage = require('../storages/norm');

let connection = {
  adapter: require('node-norm/adapters/disk'),
};

let connections = [ connection ];

module.exports = {
  storage: new NormStorage({ connections }),
};
