#!/usr/bin/env node

const path = require('path');
const Migrate = require('./');
const { sprintf } = require('sprintf-js');

let opts;
try {
  opts = require(path.join(process.cwd(), '.migraterc.js'));
} catch (err) {
  console.error('Invalid .migraterc.js');
  console.error(err);
  process.exit(1);
}

const migrate = new Migrate(opts);

let startT = Date.now();

function logMigrateEvent (eventName) {
  return function (name) {
    let delta = (Date.now() - startT) / 1000;
    console.info(sprintf('%06.3f | %9s | %s', delta, eventName, name));
    if (eventName === 'migrated' || eventName === 'reverted') {
      console.info('');
    }
  };
}
migrate.on('migrating', logMigrateEvent('migrating'));
migrate.on('migrated', logMigrateEvent('migrated'));
migrate.on('reverting', logMigrateEvent('reverting'));
migrate.on('reverted', logMigrateEvent('reverted'));

async function getStatus () {
  let executed = (await migrate.executed()).map(m => {
    m.name = path.basename(m.file, '.js');
    return m;
  });
  let pending = (await migrate.pending()).map(m => {
    m.name = path.basename(m.file, '.js');
    return m;
  });

  const current = executed.length > 0 ? path.basename(executed[0].file, '.js') : '';
  return {
    current: current,
    executed: executed.map(m => path.basename(m.file, '.js')),
    pending: pending.map(m => path.basename(m.file, '.js')),
  };
}

async function cmdStatus () {
  const { current, executed, pending } = await getStatus();

  console.info('Current:');
  console.info(' ', current || '(none)');
  console.info('');
  console.info('Executed:');
  if (executed.length) {
    executed.forEach(step => console.info(' ', step));
  } else {
    console.info('  (none)');
  }
  console.info('');
  console.info('Pending:');
  if (pending.length) {
    pending.forEach(step => console.info(' ', step));
  } else {
    console.info('  (none)');
  }
  console.info('');
}

function cmdUp (to) {
  if (to) {
    return migrate.up({ to });
  }

  return migrate.up();
}

async function cmdNext () {
  let { pending } = await getStatus();
  if (pending.length === 0) {
    throw new Error('No pending migrations');
  }
  const next = pending[0];
  return migrate.up({ to: next });
}

function cmdDown (to) {
  if (to) {
    return migrate.down({ to });
  }

  return migrate.down({ to: 0 });
}

async function cmdPrev () {
  let { executed } = await getStatus();
  if (executed.length === 0) {
    throw new Error('Already at initial state');
  }
  const prev = executed[executed.length - 1];
  return migrate.down({ to: prev });
}

(async () => {
  const cmd = (process.argv[2] || '').trim();
  try {
    console.info('');

    switch (cmd) {
      case 'status':
        await cmdStatus();
        break;

      case 'up':
        await cmdUp(process.argv[3]);
        break;

      case 'next':
        await cmdNext();
        process.exit();

      case 'down':
        await cmdDown(process.argv[3]);
        break;

      case 'prev':
        await cmdPrev();
        break;

      default:
        console.error(`Invalid cmd: ${cmd}`);
        console.error('');
        console.error(`Usage: migrate [status|up|down|next|prev]`);
        console.error('');
        console.error(':(');
        console.error('');
        process.exit(1);
    }

    console.info(':)');
    console.info('');
  } catch (err) {
    console.error(`Caught error at command: ${cmd}`);
    console.error(err);
    console.error(':(');
    console.error('');
    process.exit(1);
  }
})();
