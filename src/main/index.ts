import { app, shell, BrowserWindow, dialog } from 'electron'
import { writeFile } from 'node:fs/promises'
import { join } from 'path'
import { pathToFileURL } from 'url'
import { config as loadDotenv } from 'dotenv'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { closeDatabase, initDatabase, type AppDatabase } from './db'
import { SessionService } from './auth/session.service'
import { runUploadCrashChild } from './collaboration/upload-smoke'
import { ActivityLogRepository } from './repositories/activity-log.repository'
import { EventsRepository } from './repositories/events.repository'
import { GradesRepository } from './repositories/grades.repository'
import { GroupActivityRepository } from './repositories/group-activity.repository'
import { GroupCommentsRepository } from './repositories/group-comments.repository'
import { GroupEventsRepository } from './repositories/group-events.repository'
import { GroupNotesRepository } from './repositories/group-notes.repository'
import { GroupTasksRepository } from './repositories/group-tasks.repository'
import { GroupUnitOfWork } from './repositories/group-transaction'
import { GroupsRepository } from './repositories/groups.repository'
import { StudyProgramsRepository } from './repositories/study-programs.repository'
import { TimetableRepository } from './repositories/timetable.repository'
import { UsersRepository } from './repositories/users.repository'
import { AuthService } from './services/auth.service'
import { DashboardService } from './services/dashboard.service'
import { EventsService } from './services/events.service'
import { GradesService } from './services/grades.service'
import { GroupAccessService } from './services/group-access.service'
import { GroupCommentsService } from './services/group-comments.service'
import { GroupEventsService } from './services/group-events.service'
import { GroupNotesService } from './services/group-notes.service'
import { GroupTasksService } from './services/group-tasks.service'
import { GroupsService } from './services/groups.service'
import { StudyProgramsService } from './services/study-programs.service'
import { TimetableService } from './services/timetable.service'
import { createAuthHandlers } from './ipc/handlers/auth.handlers'
import { createDashboardHandlers } from './ipc/handlers/dashboard.handlers'
import { createEventsHandlers } from './ipc/handlers/events.handlers'
import { createGradesHandlers } from './ipc/handlers/grades.handlers'
import { createGroupCommentsHandlers } from './ipc/handlers/group-comments.handlers'
import { createGroupEventsHandlers } from './ipc/handlers/group-events.handlers'
import { createGroupNotesHandlers } from './ipc/handlers/group-notes.handlers'
import { createGroupTasksHandlers } from './ipc/handlers/group-tasks.handlers'
import { createGroupHandlers } from './ipc/handlers/groups.handlers'
import { createStudyProgramsHandlers } from './ipc/handlers/study-programs.handlers'
import { createTimetableHandlers } from './ipc/handlers/timetable.handlers'
import { NativeCsvFilePicker } from './files/native-csv-file-picker'
import { NativeIcalFilePicker } from './files/native-ical-file-picker'
import {
  createWindowSenderPolicy,
  definePartialApiHandlers,
  registerApiDispatcher
} from './ipc/api-dispatcher'
import type { PowerSyncSpikeRuntime } from './spikes/powersync'
import { runElectronPowerSyncSpikeChecks, startPowerSyncSpike } from './spikes/powersync'
import {
  runElectronPowerSyncDrizzleChecks,
  runElectronPowerSyncDrizzleCloudChecks
} from './spikes/powersync-drizzle'
import {
  CollaborationRuntime,
  registerCollaborationIpc,
  runElectronCollaborationChecks,
  runElectronCollaborationCloudChecks
} from './collaboration'

const senderPolicy = createWindowSenderPolicy()
let powerSyncSpike: PowerSyncSpikeRuntime | undefined
let collaborationRuntime: CollaborationRuntime | undefined

async function writePowerSyncSpikeReport(report: unknown): Promise<void> {
  const argument = process.argv.find((value) => value.startsWith('--powersync-spike-report='))
  const reportPath = argument?.slice('--powersync-spike-report='.length)
  if (!reportPath) return
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
}

function isSafeExternalUrl(value: string): boolean {
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  const rendererUrl =
    is.dev && process.env['ELECTRON_RENDERER_URL']
      ? process.env['ELECTRON_RENDERER_URL']
      : pathToFileURL(join(__dirname, '../renderer/index.html')).href
  const expectedRendererUrl = new URL(rendererUrl)
  const isRendererUrlAllowed = (value: string): boolean => {
    try {
      const candidate = new URL(value)
      if (expectedRendererUrl.protocol === 'file:') {
        return candidate.protocol === 'file:' && candidate.pathname === expectedRendererUrl.pathname
      }
      return candidate.origin === expectedRendererUrl.origin
    } catch {
      return false
    }
  }

  const isPermissionAllowed = (
    webContents: Electron.WebContents | null,
    permission: string
  ): boolean =>
    webContents === mainWindow.webContents &&
    permission === 'clipboard-sanitized-write' &&
    isRendererUrlAllowed(webContents.getURL())

  mainWindow.webContents.session.setPermissionCheckHandler((webContents, permission) =>
    isPermissionAllowed(webContents, permission)
  )
  mainWindow.webContents.session.setPermissionRequestHandler(
    (webContents, permission, callback) => {
      callback(isPermissionAllowed(webContents, permission))
    }
  )

  senderPolicy.allow(mainWindow.webContents, isRendererUrlAllowed)
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!isRendererUrlAllowed(url)) event.preventDefault()
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    if (isSafeExternalUrl(details.url)) void shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  mainWindow.loadURL(rendererUrl)
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  const crashArgument = process.argv.find((value) => value.startsWith('--powersync-upload-crash='))
  if (crashArgument) {
    try {
      await runUploadCrashChild(
        crashArgument.slice('--powersync-upload-crash='.length),
        app.getPath('temp')
      )
    } catch {
      app.exit(1)
    }
    return
  }
  if (process.argv.includes('--powersync-groups-cloud-test')) {
    try {
      loadDotenv({ path: join(process.cwd(), '.env.powersync-groups.local'), quiet: true })
      const checks = await runElectronCollaborationCloudChecks(app.getPath('temp'))
      const report = { result: 'pass', checks }
      console.log(JSON.stringify(report, null, 2))
      await writePowerSyncSpikeReport(report)
      app.exit(0)
    } catch (error) {
      console.error('[PowerSync groups cloud] Electron checks failed:', error)
      await writePowerSyncSpikeReport({
        result: 'fail',
        error: error instanceof Error ? error.stack : String(error)
      })
      app.exit(1)
    }
    return
  }

  if (process.argv.includes('--powersync-groups-test')) {
    try {
      const checks = await runElectronCollaborationChecks(app.getPath('temp'))
      const report = { result: 'pass', checks }
      console.log(JSON.stringify(report, null, 2))
      await writePowerSyncSpikeReport(report)
      app.exit(0)
    } catch (error) {
      console.error('[PowerSync groups] Electron checks failed:', error)
      await writePowerSyncSpikeReport({
        result: 'fail',
        error: error instanceof Error ? error.stack : String(error)
      })
      app.exit(1)
    }
    return
  }

  if (process.argv.includes('--powersync-drizzle-cloud-test')) {
    try {
      const checks = await runElectronPowerSyncDrizzleCloudChecks(app.getPath('temp'))
      const report = { result: 'pass', checks }
      console.log(JSON.stringify(report, null, 2))
      await writePowerSyncSpikeReport(report)
      app.exit(0)
    } catch (error) {
      console.error('[PowerSync Drizzle cloud spike] Electron checks failed:', error)
      await writePowerSyncSpikeReport({
        result: 'fail',
        error: error instanceof Error ? error.stack : String(error)
      })
      app.exit(1)
    }
    return
  }

  if (process.argv.includes('--powersync-drizzle-spike-test')) {
    try {
      const checks = await runElectronPowerSyncDrizzleChecks(app.getPath('temp'))
      const report = { result: 'pass', checks }
      console.log(JSON.stringify(report, null, 2))
      await writePowerSyncSpikeReport(report)
      app.exit(0)
    } catch (error) {
      console.error('[PowerSync Drizzle spike] Electron checks failed:', error)
      await writePowerSyncSpikeReport({
        result: 'fail',
        error: error instanceof Error ? error.stack : String(error)
      })
      app.exit(1)
    }
    return
  }

  if (process.argv.includes('--powersync-spike-test')) {
    try {
      const checks = await runElectronPowerSyncSpikeChecks(app.getPath('temp'))
      const report = { result: 'pass', checks }
      console.log(JSON.stringify(report, null, 2))
      await writePowerSyncSpikeReport(report)
      app.exit(0)
    } catch (error) {
      console.error('[PowerSync spike] Electron checks failed:', error)
      await writePowerSyncSpikeReport({
        result: 'fail',
        error: error instanceof Error ? error.stack : String(error)
      })
      app.exit(1)
    }
    return
  }

  // Connect and initialize database
  let database: AppDatabase
  try {
    database = await initDatabase()
  } catch (error) {
    console.error('[DB] Failed to initialize the database at startup:', error)
    dialog.showErrorBox(
      'Database initialization failed',
      'Studyplan could not prepare its local database. The application will now close.'
    )
    app.quit()
    return
  }

  if (process.env.POWERSYNC_SPIKE_ENABLED === 'true') {
    try {
      powerSyncSpike = await startPowerSyncSpike(app.getPath('userData'))
    } catch (error) {
      console.error('[PowerSync spike] Startup failed:', error)
    }
  }

  loadDotenv({ path: join(process.cwd(), '.env.powersync-groups.local'), quiet: true })
  collaborationRuntime = new CollaborationRuntime(app.getPath('userData'))

  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  const usersRepository = new UsersRepository(database)
  const activityLogRepository = new ActivityLogRepository(database)
  const eventsRepository = new EventsRepository(database)
  const gradesRepository = new GradesRepository(database)
  const groupActivityRepository = new GroupActivityRepository(database)
  const groupCommentsRepository = new GroupCommentsRepository(database)
  const groupEventsRepository = new GroupEventsRepository(database)
  const groupNotesRepository = new GroupNotesRepository(database)
  const groupTasksRepository = new GroupTasksRepository(database)
  const groupUnitOfWork = new GroupUnitOfWork(database)
  const groupsRepository = new GroupsRepository(database)
  const studyProgramsRepository = new StudyProgramsRepository(database)
  const timetableRepository = new TimetableRepository(database)
  const sessionService = new SessionService()
  const authService = new AuthService(usersRepository, sessionService)
  const dashboardService = new DashboardService(
    gradesRepository,
    eventsRepository,
    activityLogRepository
  )
  const eventsService = new EventsService(eventsRepository, activityLogRepository)
  const gradesService = new GradesService(gradesRepository, activityLogRepository)
  const groupAccessService = new GroupAccessService(groupsRepository)
  const groupEventsService = new GroupEventsService(
    groupAccessService,
    groupEventsRepository,
    groupActivityRepository,
    groupUnitOfWork
  )
  const groupNotesService = new GroupNotesService(
    groupAccessService,
    groupNotesRepository,
    groupActivityRepository,
    groupUnitOfWork
  )
  const groupTasksService = new GroupTasksService(
    groupAccessService,
    groupTasksRepository,
    groupActivityRepository,
    groupUnitOfWork
  )
  const groupCommentsService = new GroupCommentsService(
    groupAccessService,
    groupEventsRepository,
    groupTasksRepository,
    groupCommentsRepository
  )
  const groupsService = new GroupsService(groupsRepository)
  const studyProgramsService = new StudyProgramsService(studyProgramsRepository)
  const timetableService = new TimetableService(timetableRepository)
  const csvFilePicker = new NativeCsvFilePicker()
  const icalFilePicker = new NativeIcalFilePicker()
  const apiHandlers = definePartialApiHandlers({
    ...createAuthHandlers(authService),
    ...createDashboardHandlers(dashboardService, sessionService),
    ...createEventsHandlers(eventsService, sessionService, icalFilePicker),
    ...createGradesHandlers(gradesService, sessionService, csvFilePicker),
    ...createGroupEventsHandlers(groupEventsService, groupCommentsService, sessionService),
    ...createGroupNotesHandlers(groupNotesService, sessionService),
    ...createGroupTasksHandlers(groupTasksService, groupCommentsService, sessionService),
    ...createGroupCommentsHandlers(groupCommentsService, sessionService),
    ...createGroupHandlers(groupsService, sessionService),
    ...createStudyProgramsHandlers(studyProgramsService, sessionService),
    ...createTimetableHandlers(timetableService, sessionService)
  })

  registerApiDispatcher({
    handlers: apiHandlers,
    isSenderAllowed: senderPolicy.isAllowed,
    onError: (error, context) => console.error('[API]', context, error)
  })
  registerCollaborationIpc(collaborationRuntime, senderPolicy.isAllowed, sessionService)

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('will-quit', () => {
  closeDatabase()
  void powerSyncSpike?.close()
  void collaborationRuntime?.close()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
