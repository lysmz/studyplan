# studyplan

An Electron application with React and TypeScript

See the [architecture diagrams](docs/architecture.md) for the component layout and request/data flow.

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## Project Setup

### Install

```bash
$ npm install
```

### Development

```bash
$ npm run dev
```

### Database migrations

The application stores its SQLite database in Electron's per-user `userData/data` directory.
It uses `studyplan-dev.db` during development and `studyplan.db` in packaged builds. Pending
migrations run automatically before the application window opens.

After changing a file in `src/main/db/schema`, generate and commit a migration:

```bash
$ npm run db:generate -- --name=describe-the-change
$ npm run db:check
```

Migration files in `drizzle/` are packaged as application resources. Do not edit an existing
migration after it has shipped; add a new migration instead.

### Build

```bash
# For windows
$ npm run build:win

# For macOS
$ npm run build:mac

# For Linux
$ npm run build:linux
```
