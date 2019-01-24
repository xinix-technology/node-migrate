# @xinix/migrate

```sh
npm i @xinix/migrate
```

Create a migration file inside `migrations` directory of your project.

```js
module.exports = {
  async up () {
    // do something async here
  }

  async down () {
    // do something async here
  }
};
```

## Configuration

Create file with name `.migraterc.js` and export umzug options. Example,

```sh
module.exports = {
  storage: 'json', // new require('@xinix/migrate/storages/norm')({ manager }),
  storageOptions: {
    path: 'the-umzug-file.json',
  },
};
```

Migration files will be sorted by its name.

## Status

Show current status of migration.

```sh
migrate status
```

## Up

Migrate up to specified file, or to the latest state.

```sh
migrate up [<migrate-file>]
```

## Down

Migrate down to specified file, or to earliest state.

```sh
migrate down [<migrate-file>]
```

## Next

Migrate to next state.

```sh
migrate next
```

## Prev

Migrate to previous state.

```sh
migrate prev
```
