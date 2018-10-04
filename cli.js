const path = require('path');
const Migrate = require('./');
const migrate = new Migrate();

function logMigrateEvent (eventName) {
  return function (name, migration) {
    console.info(`${name} ${eventName}`);
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

  const current = executed.length > 0 ? executed[0].file : '<NO_MIGRATIONS>';
  return {
    current: current,
    executed: executed.map(m => m.file),
    pending: pending.map(m => m.file),
  };
}

async function cmdStatus () {
  const status = await getStatus();

  console.info(JSON.stringify(status, null, 2));
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
  const next = pending[0].name;
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
  const prev = executed[executed.length - 1].name;
  return migrate.down({ to: prev });
}

(async () => {
  const cmd = (process.argv[2] || '').trim();
  try {
    switch (cmd) {
      case 'status':
        await cmdStatus();
        break;

      case 'up':
        await cmdUp(process.argv[3]);
        break;

      case 'next':
        await cmdNext();
        break;

      case 'down':
        await cmdDown(process.argv[3]);
        break;

      case 'prev':
        await cmdPrev();
        break;

      default:
        console.info(`Invalid cmd: ${cmd}`);
        console.info(`Usage: migrate [status|up|down|next|prev]`);
        process.exit(1);
    }

    console.info('OK');
  } catch (err) {
    console.error(`ERR cmd:${cmd.toUpperCase()}`);
    console.error(err);
  }
})();
