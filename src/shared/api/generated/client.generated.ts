/**
 * GENERATED FILE - DO NOT EDIT.
 * Source: api/openapi.yaml
 * Run `npm run api:generate` to regenerate.
 */
import type {
  ApiInput,
  ApiOperationId,
  ApiOutput,
  OperationHealthCheckInput,
  OperationHealthCheckOutput,
  OperationRegisterInput,
  OperationRegisterOutput,
  OperationLoginInput,
  OperationLoginOutput,
  OperationLogoutInput,
  OperationLogoutOutput,
  OperationGetMeInput,
  OperationGetMeOutput,
  OperationGetDashboardStatsInput,
  OperationGetDashboardStatsOutput,
  OperationGetDashboardUpcomingInput,
  OperationGetDashboardUpcomingOutput,
  OperationGetDashboardActivityInput,
  OperationGetDashboardActivityOutput,
  OperationListEventsInput,
  OperationListEventsOutput,
  OperationCreateEventInput,
  OperationCreateEventOutput,
  OperationGetEventInput,
  OperationGetEventOutput,
  OperationUpdateEventInput,
  OperationUpdateEventOutput,
  OperationDeleteEventInput,
  OperationDeleteEventOutput,
  OperationListGradesInput,
  OperationListGradesOutput,
  OperationCreateGradeInput,
  OperationCreateGradeOutput,
  OperationImportGradesCsvInput,
  OperationImportGradesCsvOutput,
  OperationGetGradeStatsInput,
  OperationGetGradeStatsOutput,
  OperationUpdateGradeInput,
  OperationUpdateGradeOutput,
  OperationDeleteGradeInput,
  OperationDeleteGradeOutput,
  OperationListTimetableEntriesInput,
  OperationListTimetableEntriesOutput,
  OperationAddTimetableEntryInput,
  OperationAddTimetableEntryOutput,
  OperationRemoveTimetableEntryInput,
  OperationRemoveTimetableEntryOutput,
  OperationClearTimetableInput,
  OperationClearTimetableOutput,
  OperationListTimetablePresetsInput,
  OperationListTimetablePresetsOutput,
  OperationGetTimetablePresetEntriesInput,
  OperationGetTimetablePresetEntriesOutput,
  OperationListStudyProgramsInput,
  OperationListStudyProgramsOutput,
  OperationListStudyProgramCoursesInput,
  OperationListStudyProgramCoursesOutput,
  OperationListGroupsInput,
  OperationListGroupsOutput,
  OperationCreateGroupInput,
  OperationCreateGroupOutput,
  OperationGetGroupsActivityInput,
  OperationGetGroupsActivityOutput,
  OperationListAllGroupEventsInput,
  OperationListAllGroupEventsOutput,
  OperationGetGroupInput,
  OperationGetGroupOutput,
  OperationUpdateGroupInput,
  OperationUpdateGroupOutput,
  OperationDeleteGroupInput,
  OperationDeleteGroupOutput,
  OperationCreateGroupInviteInput,
  OperationCreateGroupInviteOutput,
  OperationLeaveGroupInput,
  OperationLeaveGroupOutput,
  OperationListGroupMembersInput,
  OperationListGroupMembersOutput,
  OperationRemoveGroupMemberInput,
  OperationRemoveGroupMemberOutput,
  OperationListGroupEventsInput,
  OperationListGroupEventsOutput,
  OperationCreateGroupEventInput,
  OperationCreateGroupEventOutput,
  OperationUpdateGroupEventInput,
  OperationUpdateGroupEventOutput,
  OperationDeleteGroupEventInput,
  OperationDeleteGroupEventOutput,
  OperationListEventCommentsInput,
  OperationListEventCommentsOutput,
  OperationAddEventCommentInput,
  OperationAddEventCommentOutput,
  OperationListGroupTasksInput,
  OperationListGroupTasksOutput,
  OperationCreateGroupTaskInput,
  OperationCreateGroupTaskOutput,
  OperationUpdateGroupTaskInput,
  OperationUpdateGroupTaskOutput,
  OperationDeleteGroupTaskInput,
  OperationDeleteGroupTaskOutput,
  OperationListTaskCommentsInput,
  OperationListTaskCommentsOutput,
  OperationAddTaskCommentInput,
  OperationAddTaskCommentOutput,
  OperationListGroupNotesInput,
  OperationListGroupNotesOutput,
  OperationCreateGroupNoteInput,
  OperationCreateGroupNoteOutput,
  OperationUpdateGroupNoteInput,
  OperationUpdateGroupNoteOutput,
  OperationDeleteGroupNoteInput,
  OperationDeleteGroupNoteOutput,
  OperationDeleteCommentInput,
  OperationDeleteCommentOutput,
  OperationGetGroupInviteInput,
  OperationGetGroupInviteOutput,
  OperationJoinGroupInput,
  OperationJoinGroupOutput
} from './contract.generated'
import { ApiClientError, type ApiTransport } from '../ipc'

export interface ApiClient {
  health: {
    healthCheck(input?: OperationHealthCheckInput): Promise<OperationHealthCheckOutput>
  }
  auth: {
    register(input: OperationRegisterInput): Promise<OperationRegisterOutput>
    login(input: OperationLoginInput): Promise<OperationLoginOutput>
    logout(input?: OperationLogoutInput): Promise<OperationLogoutOutput>
    getMe(input?: OperationGetMeInput): Promise<OperationGetMeOutput>
  }
  dashboard: {
    getDashboardStats(
      input?: OperationGetDashboardStatsInput
    ): Promise<OperationGetDashboardStatsOutput>
    getDashboardUpcoming(
      input?: OperationGetDashboardUpcomingInput
    ): Promise<OperationGetDashboardUpcomingOutput>
    getDashboardActivity(
      input?: OperationGetDashboardActivityInput
    ): Promise<OperationGetDashboardActivityOutput>
  }
  events: {
    listEvents(input?: OperationListEventsInput): Promise<OperationListEventsOutput>
    createEvent(input: OperationCreateEventInput): Promise<OperationCreateEventOutput>
    getEvent(input: OperationGetEventInput): Promise<OperationGetEventOutput>
    updateEvent(input: OperationUpdateEventInput): Promise<OperationUpdateEventOutput>
    deleteEvent(input: OperationDeleteEventInput): Promise<OperationDeleteEventOutput>
  }
  grades: {
    listGrades(input?: OperationListGradesInput): Promise<OperationListGradesOutput>
    createGrade(input: OperationCreateGradeInput): Promise<OperationCreateGradeOutput>
    importGradesCsv(input?: OperationImportGradesCsvInput): Promise<OperationImportGradesCsvOutput>
    getGradeStats(input?: OperationGetGradeStatsInput): Promise<OperationGetGradeStatsOutput>
    updateGrade(input: OperationUpdateGradeInput): Promise<OperationUpdateGradeOutput>
    deleteGrade(input: OperationDeleteGradeInput): Promise<OperationDeleteGradeOutput>
  }
  timetable: {
    listTimetableEntries(
      input?: OperationListTimetableEntriesInput
    ): Promise<OperationListTimetableEntriesOutput>
    addTimetableEntry(
      input: OperationAddTimetableEntryInput
    ): Promise<OperationAddTimetableEntryOutput>
    removeTimetableEntry(
      input: OperationRemoveTimetableEntryInput
    ): Promise<OperationRemoveTimetableEntryOutput>
    clearTimetable(input?: OperationClearTimetableInput): Promise<OperationClearTimetableOutput>
    listTimetablePresets(
      input?: OperationListTimetablePresetsInput
    ): Promise<OperationListTimetablePresetsOutput>
    getTimetablePresetEntries(
      input: OperationGetTimetablePresetEntriesInput
    ): Promise<OperationGetTimetablePresetEntriesOutput>
  }
  studyPrograms: {
    listStudyPrograms(
      input?: OperationListStudyProgramsInput
    ): Promise<OperationListStudyProgramsOutput>
    listStudyProgramCourses(
      input: OperationListStudyProgramCoursesInput
    ): Promise<OperationListStudyProgramCoursesOutput>
  }
  groups: {
    listGroups(input?: OperationListGroupsInput): Promise<OperationListGroupsOutput>
    createGroup(input: OperationCreateGroupInput): Promise<OperationCreateGroupOutput>
    getGroupsActivity(
      input?: OperationGetGroupsActivityInput
    ): Promise<OperationGetGroupsActivityOutput>
    listAllGroupEvents(
      input?: OperationListAllGroupEventsInput
    ): Promise<OperationListAllGroupEventsOutput>
    getGroup(input: OperationGetGroupInput): Promise<OperationGetGroupOutput>
    updateGroup(input: OperationUpdateGroupInput): Promise<OperationUpdateGroupOutput>
    deleteGroup(input: OperationDeleteGroupInput): Promise<OperationDeleteGroupOutput>
    createGroupInvite(
      input: OperationCreateGroupInviteInput
    ): Promise<OperationCreateGroupInviteOutput>
    leaveGroup(input: OperationLeaveGroupInput): Promise<OperationLeaveGroupOutput>
    listGroupMembers(
      input: OperationListGroupMembersInput
    ): Promise<OperationListGroupMembersOutput>
    removeGroupMember(
      input: OperationRemoveGroupMemberInput
    ): Promise<OperationRemoveGroupMemberOutput>
    listGroupEvents(input: OperationListGroupEventsInput): Promise<OperationListGroupEventsOutput>
    createGroupEvent(
      input: OperationCreateGroupEventInput
    ): Promise<OperationCreateGroupEventOutput>
    updateGroupEvent(
      input: OperationUpdateGroupEventInput
    ): Promise<OperationUpdateGroupEventOutput>
    deleteGroupEvent(
      input: OperationDeleteGroupEventInput
    ): Promise<OperationDeleteGroupEventOutput>
    listEventComments(
      input: OperationListEventCommentsInput
    ): Promise<OperationListEventCommentsOutput>
    addEventComment(input: OperationAddEventCommentInput): Promise<OperationAddEventCommentOutput>
    listGroupTasks(input: OperationListGroupTasksInput): Promise<OperationListGroupTasksOutput>
    createGroupTask(input: OperationCreateGroupTaskInput): Promise<OperationCreateGroupTaskOutput>
    updateGroupTask(input: OperationUpdateGroupTaskInput): Promise<OperationUpdateGroupTaskOutput>
    deleteGroupTask(input: OperationDeleteGroupTaskInput): Promise<OperationDeleteGroupTaskOutput>
    listTaskComments(
      input: OperationListTaskCommentsInput
    ): Promise<OperationListTaskCommentsOutput>
    addTaskComment(input: OperationAddTaskCommentInput): Promise<OperationAddTaskCommentOutput>
    listGroupNotes(input: OperationListGroupNotesInput): Promise<OperationListGroupNotesOutput>
    createGroupNote(input: OperationCreateGroupNoteInput): Promise<OperationCreateGroupNoteOutput>
    updateGroupNote(input: OperationUpdateGroupNoteInput): Promise<OperationUpdateGroupNoteOutput>
    deleteGroupNote(input: OperationDeleteGroupNoteInput): Promise<OperationDeleteGroupNoteOutput>
    deleteComment(input: OperationDeleteCommentInput): Promise<OperationDeleteCommentOutput>
  }
  invite: {
    getGroupInvite(input: OperationGetGroupInviteInput): Promise<OperationGetGroupInviteOutput>
    joinGroup(input: OperationJoinGroupInput): Promise<OperationJoinGroupOutput>
  }
}

export function createApiClient(transport: ApiTransport): ApiClient {
  const invoke = async <K extends ApiOperationId>(
    operationId: K,
    input: ApiInput<K>
  ): Promise<ApiOutput<K>> => {
    const result = await transport(operationId, input)
    if (!result.ok) throw new ApiClientError(result.error)
    return result.data
  }

  return {
    health: {
      healthCheck: (input = {}) => invoke('healthCheck', input as OperationHealthCheckInput)
    },
    auth: {
      register: (input) => invoke('register', input as OperationRegisterInput),
      login: (input) => invoke('login', input as OperationLoginInput),
      logout: (input = {}) => invoke('logout', input as OperationLogoutInput),
      getMe: (input = {}) => invoke('getMe', input as OperationGetMeInput)
    },
    dashboard: {
      getDashboardStats: (input = {}) =>
        invoke('getDashboardStats', input as OperationGetDashboardStatsInput),
      getDashboardUpcoming: (input = {}) =>
        invoke('getDashboardUpcoming', input as OperationGetDashboardUpcomingInput),
      getDashboardActivity: (input = {}) =>
        invoke('getDashboardActivity', input as OperationGetDashboardActivityInput)
    },
    events: {
      listEvents: (input = {}) => invoke('listEvents', input as OperationListEventsInput),
      createEvent: (input) => invoke('createEvent', input as OperationCreateEventInput),
      getEvent: (input) => invoke('getEvent', input as OperationGetEventInput),
      updateEvent: (input) => invoke('updateEvent', input as OperationUpdateEventInput),
      deleteEvent: (input) => invoke('deleteEvent', input as OperationDeleteEventInput)
    },
    grades: {
      listGrades: (input = {}) => invoke('listGrades', input as OperationListGradesInput),
      createGrade: (input) => invoke('createGrade', input as OperationCreateGradeInput),
      importGradesCsv: (input = {}) =>
        invoke('importGradesCsv', input as OperationImportGradesCsvInput),
      getGradeStats: (input = {}) => invoke('getGradeStats', input as OperationGetGradeStatsInput),
      updateGrade: (input) => invoke('updateGrade', input as OperationUpdateGradeInput),
      deleteGrade: (input) => invoke('deleteGrade', input as OperationDeleteGradeInput)
    },
    timetable: {
      listTimetableEntries: (input = {}) =>
        invoke('listTimetableEntries', input as OperationListTimetableEntriesInput),
      addTimetableEntry: (input) =>
        invoke('addTimetableEntry', input as OperationAddTimetableEntryInput),
      removeTimetableEntry: (input) =>
        invoke('removeTimetableEntry', input as OperationRemoveTimetableEntryInput),
      clearTimetable: (input = {}) =>
        invoke('clearTimetable', input as OperationClearTimetableInput),
      listTimetablePresets: (input = {}) =>
        invoke('listTimetablePresets', input as OperationListTimetablePresetsInput),
      getTimetablePresetEntries: (input) =>
        invoke('getTimetablePresetEntries', input as OperationGetTimetablePresetEntriesInput)
    },
    studyPrograms: {
      listStudyPrograms: (input = {}) =>
        invoke('listStudyPrograms', input as OperationListStudyProgramsInput),
      listStudyProgramCourses: (input) =>
        invoke('listStudyProgramCourses', input as OperationListStudyProgramCoursesInput)
    },
    groups: {
      listGroups: (input = {}) => invoke('listGroups', input as OperationListGroupsInput),
      createGroup: (input) => invoke('createGroup', input as OperationCreateGroupInput),
      getGroupsActivity: (input = {}) =>
        invoke('getGroupsActivity', input as OperationGetGroupsActivityInput),
      listAllGroupEvents: (input = {}) =>
        invoke('listAllGroupEvents', input as OperationListAllGroupEventsInput),
      getGroup: (input) => invoke('getGroup', input as OperationGetGroupInput),
      updateGroup: (input) => invoke('updateGroup', input as OperationUpdateGroupInput),
      deleteGroup: (input) => invoke('deleteGroup', input as OperationDeleteGroupInput),
      createGroupInvite: (input) =>
        invoke('createGroupInvite', input as OperationCreateGroupInviteInput),
      leaveGroup: (input) => invoke('leaveGroup', input as OperationLeaveGroupInput),
      listGroupMembers: (input) =>
        invoke('listGroupMembers', input as OperationListGroupMembersInput),
      removeGroupMember: (input) =>
        invoke('removeGroupMember', input as OperationRemoveGroupMemberInput),
      listGroupEvents: (input) => invoke('listGroupEvents', input as OperationListGroupEventsInput),
      createGroupEvent: (input) =>
        invoke('createGroupEvent', input as OperationCreateGroupEventInput),
      updateGroupEvent: (input) =>
        invoke('updateGroupEvent', input as OperationUpdateGroupEventInput),
      deleteGroupEvent: (input) =>
        invoke('deleteGroupEvent', input as OperationDeleteGroupEventInput),
      listEventComments: (input) =>
        invoke('listEventComments', input as OperationListEventCommentsInput),
      addEventComment: (input) => invoke('addEventComment', input as OperationAddEventCommentInput),
      listGroupTasks: (input) => invoke('listGroupTasks', input as OperationListGroupTasksInput),
      createGroupTask: (input) => invoke('createGroupTask', input as OperationCreateGroupTaskInput),
      updateGroupTask: (input) => invoke('updateGroupTask', input as OperationUpdateGroupTaskInput),
      deleteGroupTask: (input) => invoke('deleteGroupTask', input as OperationDeleteGroupTaskInput),
      listTaskComments: (input) =>
        invoke('listTaskComments', input as OperationListTaskCommentsInput),
      addTaskComment: (input) => invoke('addTaskComment', input as OperationAddTaskCommentInput),
      listGroupNotes: (input) => invoke('listGroupNotes', input as OperationListGroupNotesInput),
      createGroupNote: (input) => invoke('createGroupNote', input as OperationCreateGroupNoteInput),
      updateGroupNote: (input) => invoke('updateGroupNote', input as OperationUpdateGroupNoteInput),
      deleteGroupNote: (input) => invoke('deleteGroupNote', input as OperationDeleteGroupNoteInput),
      deleteComment: (input) => invoke('deleteComment', input as OperationDeleteCommentInput)
    },
    invite: {
      getGroupInvite: (input) => invoke('getGroupInvite', input as OperationGetGroupInviteInput),
      joinGroup: (input) => invoke('joinGroup', input as OperationJoinGroupInput)
    }
  }
}
