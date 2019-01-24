const { Manager } = require('node-norm');

class NormStorage {
  constructor ({
    manager,
    connections,
    schema = 'node_migrate',
    prepareCallback,
  }) {
    if (!this.manager) {
      manager = new Manager({ connections });
    }

    this.manager = manager;
    this.schema = schema;
    this.prepareCallback = prepareCallback || (async storage => {
      await storage.manager.runSession(async session => {
        let con = await session.acquire();

        if (con.constructor.name.toLowerCase() === 'mysql') {
          await con.rawQuery(`
            CREATE TABLE IF NOT EXISTS \`${storage.schema}\` (
              id INT PRIMARY KEY AUTO_INCREMENT,
              name VARCHAR(255)
            )
          `);
        }
      });
    });
  }

  async prepareNorm () {
    await this.prepareCallback(this);
  }

  async executed () {
    await this.prepareNorm();

    return this.manager.runSession(async session => {
      let rows = await session.factory(this.schema).all();
      return rows.map(row => row.name);
    });
  }

  async logMigration (name) {
    await this.prepareNorm();

    return this.manager.runSession(async session => {
      await session.factory(this.schema)
        .insert({ name })
        .save();
    });
  }

  async unlogMigration (name) {
    await this.prepareNorm();

    return this.manager.runSession(async session => {
      await session.factory(this.schema, { name }).delete();
    });
  }
}

module.exports = NormStorage;
