import { defineConfig } from 'drizzle-kit'
import path from 'path'

export default defineConfig({
  schema: path.join(__dirname, './index.ts'),
  dialect: 'sqlite',
  dbCredentials: {
    url: path.join(__dirname, 'databasefile.db')
  }
})
