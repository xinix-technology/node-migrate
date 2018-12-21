const { Manager } = require('node-norm');

class NormStorage {
  constructor ({ manager, connections }) {
    if (!this.manager) {
      manager = new Manager({ connections });
    }

    this.manager = manager;
  }

  async prepareNorm () {
    await this.manager.runSession(async session => {
      let con = await session.acquire();

      // TODO: prepare new table should be generic
      if (con.constructor.name.toLowerCase() === 'mysql') {
        con.dbQuery(`
          CREATE TABLE IF NOT EXISTS node_migrate (
            id INT PRIMARY KEY AUTO_INCREMENT,
            name VARCHAR(255)
          )
        `);
      }
    });
  }

  async executed () {
    await this.prepareNorm();

    return this.manager.runSession(async session => {
      let rows = await session.factory('node_migrate').all();
      return rows.map(row => row.name);
    });
  }

  async logMigration (name) {
    await this.prepareNorm();

    return this.manager.runSession(async session => {
      await session.factory('node_migrate')
        .insert({ name })
        .save();
    });
  }

  async unlogMigration (name) {
    await this.prepareNorm();

    return this.manager.runSession(async session => {
      await session.factory('node_migrate', { name }).delete();
    });
  }
}

module.exports = NormStorage;
