/**
 * GENERATED FILE - DO NOT EDIT.
 * Source: api/openapi.yaml
 * Run `npm run api:generate` to regenerate.
 */
import { z } from 'zod'

export const HealthStatusSchema = z
  .object({
    status: z.string()
  })
  .passthrough()
export type HealthStatus = z.infer<typeof HealthStatusSchema>

export const ErrorResponseSchema = z
  .object({
    error: z.string()
  })
  .passthrough()
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>

export const RegisterInputSchema = z
  .object({
    username: z.string().min(3),
    password: z.string().min(6),
    displayName: z.string().min(1),
    studyProgramId: z.number().int().nullable().optional()
  })
  .passthrough()
export type RegisterInput = z.infer<typeof RegisterInputSchema>

export const LoginInputSchema = z
  .object({
    username: z.string(),
    password: z.string()
  })
  .passthrough()
export type LoginInput = z.infer<typeof LoginInputSchema>

export const AuthUserSchema = z
  .object({
    id: z.number().int(),
    username: z.string(),
    displayName: z.string(),
    studyProgramId: z.number().int().nullable().optional()
  })
  .passthrough()
export type AuthUser = z.infer<typeof AuthUserSchema>

export const DashboardStatsSchema = z
  .object({
    gpa: z.number().nullable(),
    totalEcts: z.number(),
    upcomingDeadlinesCount: z.number().int(),
    gradesCount: z.number().int()
  })
  .passthrough()
export type DashboardStats = z.infer<typeof DashboardStatsSchema>

export const ActivityItemSchema = z
  .object({
    id: z.number().int(),
    type: z.enum(['grade_added', 'grade_updated', 'event_added', 'event_deleted']),
    description: z.string(),
    createdAt: z.date()
  })
  .passthrough()
export type ActivityItem = z.infer<typeof ActivityItemSchema>

export const EventTypeSchema = z.enum(['exam', 'deadline', 'registration', 'lecture', 'other'])
export type EventType = z.infer<typeof EventTypeSchema>

export const ImportanceSchema = z.enum(['high', 'medium', 'low'])
export type Importance = z.infer<typeof ImportanceSchema>

export const EventSchema = z
  .object({
    id: z.number().int(),
    title: z.string(),
    description: z.string().nullable().optional(),
    startDate: z.date(),
    endDate: z.date(),
    type: EventTypeSchema,
    importance: ImportanceSchema,
    isMultiDay: z.boolean(),
    location: z.string().nullable().optional(),
    userId: z.number().int()
  })
  .passthrough()
export type Event = z.infer<typeof EventSchema>

export const EventInputSchema = z
  .object({
    title: z.string().min(1),
    description: z.string().optional(),
    startDate: z.date(),
    endDate: z.date(),
    type: EventTypeSchema,
    importance: ImportanceSchema,
    location: z.string().optional()
  })
  .passthrough()
export type EventInput = z.infer<typeof EventInputSchema>

export const EventUpdateSchema = z
  .object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    startDate: z.date().optional(),
    endDate: z.date().optional(),
    type: EventTypeSchema.optional(),
    importance: ImportanceSchema.optional(),
    location: z.string().optional()
  })
  .passthrough()
export type EventUpdate = z.infer<typeof EventUpdateSchema>

export const GradeSchema = z
  .object({
    id: z.number().int(),
    courseName: z.string(),
    grade: z.number().nullable().optional(),
    ects: z.number(),
    semester: z.string(),
    passed: z.boolean(),
    notes: z.string().nullable().optional(),
    userId: z.number().int(),
    courseId: z.number().int().nullable().optional()
  })
  .passthrough()
export type Grade = z.infer<typeof GradeSchema>

export const GradeInputSchema = z
  .object({
    courseName: z.string().min(1),
    grade: z.number().min(1).max(5).optional(),
    ects: z.number().min(0),
    semester: z.string().min(1),
    passed: z.boolean(),
    notes: z.string().optional(),
    courseId: z.number().int().optional()
  })
  .passthrough()
export type GradeInput = z.infer<typeof GradeInputSchema>

export const GradeUpdateSchema = z
  .object({
    courseName: z.string().min(1).optional(),
    grade: z.number().nullable().optional(),
    ects: z.number().min(0).optional(),
    semester: z.string().optional(),
    passed: z.boolean().optional(),
    notes: z.string().nullable().optional(),
    courseId: z.number().int().nullable().optional()
  })
  .passthrough()
export type GradeUpdate = z.infer<typeof GradeUpdateSchema>

export const SemesterStatsSchema = z
  .object({
    semester: z.string(),
    gpa: z.number().nullable(),
    ects: z.number(),
    count: z.number().int()
  })
  .passthrough()
export type SemesterStats = z.infer<typeof SemesterStatsSchema>

export const GradeStatsSchema = z
  .object({
    overallGpa: z.number().nullable(),
    totalEcts: z.number(),
    bySemester: z.array(SemesterStatsSchema)
  })
  .passthrough()
export type GradeStats = z.infer<typeof GradeStatsSchema>

export const WeekDaySchema = z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday'])
export type WeekDay = z.infer<typeof WeekDaySchema>

export const TimeSlotSchema = z.enum(['slot1', 'slot2', 'slot3', 'slot4', 'slot5', 'slot6'])
export type TimeSlot = z.infer<typeof TimeSlotSchema>

export const TimetableEntrySchema = z
  .object({
    id: z.number().int(),
    courseName: z.string(),
    weekDay: WeekDaySchema,
    timeSlot: TimeSlotSchema,
    room: z.string().nullable().optional(),
    professor: z.string().nullable().optional(),
    isCustom: z.boolean(),
    color: z.string().nullable().optional(),
    userId: z.number().int()
  })
  .passthrough()
export type TimetableEntry = z.infer<typeof TimetableEntrySchema>

export const TimetableEntryInputSchema = z
  .object({
    courseName: z.string().min(1),
    weekDay: WeekDaySchema,
    timeSlot: TimeSlotSchema,
    room: z.string().optional(),
    professor: z.string().optional(),
    isCustom: z.boolean(),
    color: z.string().optional()
  })
  .passthrough()
export type TimetableEntryInput = z.infer<typeof TimetableEntryInputSchema>

export const TimetablePresetSchema = z
  .object({
    id: z.number().int(),
    name: z.string(),
    description: z.string(),
    faculty: z.string()
  })
  .passthrough()
export type TimetablePreset = z.infer<typeof TimetablePresetSchema>

export const PresetEntrySchema = z
  .object({
    id: z.number().int(),
    presetId: z.number().int(),
    courseName: z.string(),
    weekDay: WeekDaySchema,
    timeSlot: TimeSlotSchema,
    room: z.string().nullable().optional(),
    professor: z.string().nullable().optional()
  })
  .passthrough()
export type PresetEntry = z.infer<typeof PresetEntrySchema>

export const StudyProgramSchema = z
  .object({
    id: z.number().int(),
    name: z.string(),
    faculty: z.string(),
    totalEcts: z.number().int()
  })
  .passthrough()
export type StudyProgram = z.infer<typeof StudyProgramSchema>

export const CourseSchema = z
  .object({
    id: z.number().int(),
    name: z.string(),
    ects: z.number(),
    semester: z.string(),
    studyProgramId: z.number().int(),
    isRequired: z.boolean().optional()
  })
  .passthrough()
export type Course = z.infer<typeof CourseSchema>

export const GroupRoleSchema = z.enum(['owner', 'member'])
export type GroupRole = z.infer<typeof GroupRoleSchema>

export const StudyGroupSchema = z
  .object({
    id: z.number().int(),
    name: z.string(),
    description: z.string().nullable().optional(),
    createdBy: z.number().int(),
    createdAt: z.date(),
    myRole: GroupRoleSchema,
    memberCount: z.number().int(),
    inviteToken: z.string().nullable().optional()
  })
  .passthrough()
export type StudyGroup = z.infer<typeof StudyGroupSchema>

export const StudyGroupInputSchema = z
  .object({
    name: z.string().min(1),
    description: z.string().optional()
  })
  .passthrough()
export type StudyGroupInput = z.infer<typeof StudyGroupInputSchema>

export const StudyGroupUpdateSchema = z
  .object({
    name: z.string().min(1).optional(),
    description: z.string().nullable().optional()
  })
  .passthrough()
export type StudyGroupUpdate = z.infer<typeof StudyGroupUpdateSchema>

export const GroupMemberSchema = z
  .object({
    userId: z.number().int(),
    username: z.string(),
    displayName: z.string(),
    role: GroupRoleSchema,
    joinedAt: z.date()
  })
  .passthrough()
export type GroupMember = z.infer<typeof GroupMemberSchema>

export const GroupInviteLinkSchema = z
  .object({
    token: z.string()
  })
  .passthrough()
export type GroupInviteLink = z.infer<typeof GroupInviteLinkSchema>

export const GroupInviteInfoSchema = z
  .object({
    groupId: z.number().int(),
    groupName: z.string(),
    memberCount: z.number().int(),
    description: z.string().nullable().optional()
  })
  .passthrough()
export type GroupInviteInfo = z.infer<typeof GroupInviteInfoSchema>

export const GroupActivityItemSchema = z
  .object({
    id: z.number().int(),
    groupId: z.number().int(),
    groupName: z.string(),
    type: z.enum([
      'event_created',
      'event_updated',
      'event_deleted',
      'task_created',
      'task_updated',
      'task_completed',
      'note_created',
      'member_joined',
      'member_left'
    ]),
    description: z.string(),
    actorName: z.string(),
    createdAt: z.date()
  })
  .passthrough()
export type GroupActivityItem = z.infer<typeof GroupActivityItemSchema>

export const GroupEventSchema = z
  .object({
    id: z.number().int(),
    groupId: z.number().int(),
    title: z.string(),
    description: z.string().nullable().optional(),
    startDate: z.date(),
    endDate: z.date(),
    type: EventTypeSchema,
    location: z.string().nullable().optional(),
    createdBy: z.number().int(),
    createdByName: z.string(),
    createdAt: z.date(),
    updatedAt: z.date()
  })
  .passthrough()
export type GroupEvent = z.infer<typeof GroupEventSchema>

export const GroupEventInputSchema = z
  .object({
    title: z.string().min(1),
    description: z.string().optional(),
    startDate: z.date(),
    endDate: z.date(),
    type: EventTypeSchema,
    location: z.string().optional()
  })
  .passthrough()
export type GroupEventInput = z.infer<typeof GroupEventInputSchema>

export const GroupEventUpdateSchema = z
  .object({
    title: z.string().min(1).optional(),
    description: z.string().nullable().optional(),
    startDate: z.date().optional(),
    endDate: z.date().optional(),
    type: EventTypeSchema.optional(),
    location: z.string().nullable().optional()
  })
  .passthrough()
export type GroupEventUpdate = z.infer<typeof GroupEventUpdateSchema>

export const TaskStatusSchema = z.enum(['open', 'done'])
export type TaskStatus = z.infer<typeof TaskStatusSchema>

export const GroupTaskSchema = z
  .object({
    id: z.number().int(),
    groupId: z.number().int(),
    title: z.string(),
    description: z.string().nullable().optional(),
    dueDate: z.date().nullable().optional(),
    assigneeId: z.number().int().nullable().optional(),
    assigneeName: z.string().nullable().optional(),
    status: TaskStatusSchema,
    createdBy: z.number().int(),
    createdByName: z.string(),
    createdAt: z.date(),
    updatedAt: z.date()
  })
  .passthrough()
export type GroupTask = z.infer<typeof GroupTaskSchema>

export const GroupTaskInputSchema = z
  .object({
    title: z.string().min(1),
    description: z.string().optional(),
    dueDate: z.date().optional(),
    assigneeId: z.number().int().optional()
  })
  .passthrough()
export type GroupTaskInput = z.infer<typeof GroupTaskInputSchema>

export const GroupTaskUpdateSchema = z
  .object({
    title: z.string().min(1).optional(),
    description: z.string().nullable().optional(),
    dueDate: z.date().nullable().optional(),
    assigneeId: z.number().int().nullable().optional(),
    status: TaskStatusSchema.optional()
  })
  .passthrough()
export type GroupTaskUpdate = z.infer<typeof GroupTaskUpdateSchema>

export const NoteTypeSchema = z.enum(['note', 'link'])
export type NoteType = z.infer<typeof NoteTypeSchema>

export const GroupNoteSchema = z
  .object({
    id: z.number().int(),
    groupId: z.number().int(),
    title: z.string(),
    content: z.string().nullable().optional(),
    url: z.string().nullable().optional(),
    type: NoteTypeSchema,
    createdBy: z.number().int(),
    createdByName: z.string(),
    createdAt: z.date(),
    updatedAt: z.date()
  })
  .passthrough()
export type GroupNote = z.infer<typeof GroupNoteSchema>

export const GroupNoteInputSchema = z
  .object({
    title: z.string().min(1),
    content: z.string().optional(),
    url: z.string().optional(),
    type: NoteTypeSchema
  })
  .passthrough()
export type GroupNoteInput = z.infer<typeof GroupNoteInputSchema>

export const GroupNoteUpdateSchema = z
  .object({
    title: z.string().min(1).optional(),
    content: z.string().nullable().optional(),
    url: z.string().nullable().optional(),
    type: NoteTypeSchema.optional()
  })
  .passthrough()
export type GroupNoteUpdate = z.infer<typeof GroupNoteUpdateSchema>

export const CommentSchema = z
  .object({
    id: z.number().int(),
    targetType: z.enum(['event', 'task']),
    targetId: z.number().int(),
    content: z.string(),
    createdBy: z.number().int(),
    createdByName: z.string(),
    createdAt: z.date()
  })
  .passthrough()
export type Comment = z.infer<typeof CommentSchema>

export const CommentInputSchema = z
  .object({
    content: z.string().min(1)
  })
  .passthrough()
export type CommentInput = z.infer<typeof CommentInputSchema>

export const OperationHealthCheckInputSchema = z.object({}).strict()
export type OperationHealthCheckInput = z.infer<typeof OperationHealthCheckInputSchema>
export const OperationHealthCheckOutputSchema = HealthStatusSchema
export type OperationHealthCheckOutput = z.infer<typeof OperationHealthCheckOutputSchema>
export const OperationHealthCheckErrorSchema = z.never()
export type OperationHealthCheckError = z.infer<typeof OperationHealthCheckErrorSchema>

export const OperationRegisterInputSchema = z
  .object({
    body: RegisterInputSchema
  })
  .strict()
export type OperationRegisterInput = z.infer<typeof OperationRegisterInputSchema>
export const OperationRegisterOutputSchema = AuthUserSchema
export type OperationRegisterOutput = z.infer<typeof OperationRegisterOutputSchema>
export const OperationRegisterErrorSchema = z.union([
  z.object({ status: z.literal(400), body: ErrorResponseSchema }),
  z.object({ status: z.literal(409), body: ErrorResponseSchema })
])
export type OperationRegisterError = z.infer<typeof OperationRegisterErrorSchema>

export const OperationLoginInputSchema = z
  .object({
    body: LoginInputSchema
  })
  .strict()
export type OperationLoginInput = z.infer<typeof OperationLoginInputSchema>
export const OperationLoginOutputSchema = AuthUserSchema
export type OperationLoginOutput = z.infer<typeof OperationLoginOutputSchema>
export const OperationLoginErrorSchema = z.object({
  status: z.literal(401),
  body: ErrorResponseSchema
})
export type OperationLoginError = z.infer<typeof OperationLoginErrorSchema>

export const OperationLogoutInputSchema = z.object({}).strict()
export type OperationLogoutInput = z.infer<typeof OperationLogoutInputSchema>
export const OperationLogoutOutputSchema = z.undefined()
export type OperationLogoutOutput = z.infer<typeof OperationLogoutOutputSchema>
export const OperationLogoutErrorSchema = z.never()
export type OperationLogoutError = z.infer<typeof OperationLogoutErrorSchema>

export const OperationGetMeInputSchema = z.object({}).strict()
export type OperationGetMeInput = z.infer<typeof OperationGetMeInputSchema>
export const OperationGetMeOutputSchema = AuthUserSchema
export type OperationGetMeOutput = z.infer<typeof OperationGetMeOutputSchema>
export const OperationGetMeErrorSchema = z.object({
  status: z.literal(401),
  body: ErrorResponseSchema
})
export type OperationGetMeError = z.infer<typeof OperationGetMeErrorSchema>

export const OperationGetDashboardStatsInputSchema = z.object({}).strict()
export type OperationGetDashboardStatsInput = z.infer<typeof OperationGetDashboardStatsInputSchema>
export const OperationGetDashboardStatsOutputSchema = DashboardStatsSchema
export type OperationGetDashboardStatsOutput = z.infer<
  typeof OperationGetDashboardStatsOutputSchema
>
export const OperationGetDashboardStatsErrorSchema = z.never()
export type OperationGetDashboardStatsError = z.infer<typeof OperationGetDashboardStatsErrorSchema>

export const OperationGetDashboardUpcomingInputSchema = z.object({}).strict()
export type OperationGetDashboardUpcomingInput = z.infer<
  typeof OperationGetDashboardUpcomingInputSchema
>
export const OperationGetDashboardUpcomingOutputSchema = z.array(EventSchema)
export type OperationGetDashboardUpcomingOutput = z.infer<
  typeof OperationGetDashboardUpcomingOutputSchema
>
export const OperationGetDashboardUpcomingErrorSchema = z.never()
export type OperationGetDashboardUpcomingError = z.infer<
  typeof OperationGetDashboardUpcomingErrorSchema
>

export const OperationGetDashboardActivityInputSchema = z.object({}).strict()
export type OperationGetDashboardActivityInput = z.infer<
  typeof OperationGetDashboardActivityInputSchema
>
export const OperationGetDashboardActivityOutputSchema = z.array(ActivityItemSchema)
export type OperationGetDashboardActivityOutput = z.infer<
  typeof OperationGetDashboardActivityOutputSchema
>
export const OperationGetDashboardActivityErrorSchema = z.never()
export type OperationGetDashboardActivityError = z.infer<
  typeof OperationGetDashboardActivityErrorSchema
>

export const OperationListEventsInputSchema = z
  .object({
    query: z
      .object({
        month: z.number().int().optional(),
        year: z.number().int().optional(),
        type: EventTypeSchema.optional(),
        importance: ImportanceSchema.optional()
      })
      .strict()
      .optional()
  })
  .strict()
export type OperationListEventsInput = z.infer<typeof OperationListEventsInputSchema>
export const OperationListEventsOutputSchema = z.array(EventSchema)
export type OperationListEventsOutput = z.infer<typeof OperationListEventsOutputSchema>
export const OperationListEventsErrorSchema = z.never()
export type OperationListEventsError = z.infer<typeof OperationListEventsErrorSchema>

export const OperationCreateEventInputSchema = z
  .object({
    body: EventInputSchema
  })
  .strict()
export type OperationCreateEventInput = z.infer<typeof OperationCreateEventInputSchema>
export const OperationCreateEventOutputSchema = EventSchema
export type OperationCreateEventOutput = z.infer<typeof OperationCreateEventOutputSchema>
export const OperationCreateEventErrorSchema = z.never()
export type OperationCreateEventError = z.infer<typeof OperationCreateEventErrorSchema>

export const OperationGetEventInputSchema = z
  .object({
    path: z
      .object({
        id: z.number().int()
      })
      .strict()
  })
  .strict()
export type OperationGetEventInput = z.infer<typeof OperationGetEventInputSchema>
export const OperationGetEventOutputSchema = EventSchema
export type OperationGetEventOutput = z.infer<typeof OperationGetEventOutputSchema>
export const OperationGetEventErrorSchema = z.object({
  status: z.literal(404),
  body: ErrorResponseSchema
})
export type OperationGetEventError = z.infer<typeof OperationGetEventErrorSchema>

export const OperationUpdateEventInputSchema = z
  .object({
    path: z
      .object({
        id: z.number().int()
      })
      .strict(),
    body: EventUpdateSchema
  })
  .strict()
export type OperationUpdateEventInput = z.infer<typeof OperationUpdateEventInputSchema>
export const OperationUpdateEventOutputSchema = EventSchema
export type OperationUpdateEventOutput = z.infer<typeof OperationUpdateEventOutputSchema>
export const OperationUpdateEventErrorSchema = z.object({
  status: z.literal(404),
  body: ErrorResponseSchema
})
export type OperationUpdateEventError = z.infer<typeof OperationUpdateEventErrorSchema>

export const OperationDeleteEventInputSchema = z
  .object({
    path: z
      .object({
        id: z.number().int()
      })
      .strict()
  })
  .strict()
export type OperationDeleteEventInput = z.infer<typeof OperationDeleteEventInputSchema>
export const OperationDeleteEventOutputSchema = z.undefined()
export type OperationDeleteEventOutput = z.infer<typeof OperationDeleteEventOutputSchema>
export const OperationDeleteEventErrorSchema = z.object({
  status: z.literal(404),
  body: ErrorResponseSchema
})
export type OperationDeleteEventError = z.infer<typeof OperationDeleteEventErrorSchema>

export const OperationListGradesInputSchema = z
  .object({
    query: z
      .object({
        semester: z.string().optional()
      })
      .strict()
      .optional()
  })
  .strict()
export type OperationListGradesInput = z.infer<typeof OperationListGradesInputSchema>
export const OperationListGradesOutputSchema = z.array(GradeSchema)
export type OperationListGradesOutput = z.infer<typeof OperationListGradesOutputSchema>
export const OperationListGradesErrorSchema = z.never()
export type OperationListGradesError = z.infer<typeof OperationListGradesErrorSchema>

export const OperationCreateGradeInputSchema = z
  .object({
    body: GradeInputSchema
  })
  .strict()
export type OperationCreateGradeInput = z.infer<typeof OperationCreateGradeInputSchema>
export const OperationCreateGradeOutputSchema = GradeSchema
export type OperationCreateGradeOutput = z.infer<typeof OperationCreateGradeOutputSchema>
export const OperationCreateGradeErrorSchema = z.never()
export type OperationCreateGradeError = z.infer<typeof OperationCreateGradeErrorSchema>

export const OperationGetGradeStatsInputSchema = z.object({}).strict()
export type OperationGetGradeStatsInput = z.infer<typeof OperationGetGradeStatsInputSchema>
export const OperationGetGradeStatsOutputSchema = GradeStatsSchema
export type OperationGetGradeStatsOutput = z.infer<typeof OperationGetGradeStatsOutputSchema>
export const OperationGetGradeStatsErrorSchema = z.never()
export type OperationGetGradeStatsError = z.infer<typeof OperationGetGradeStatsErrorSchema>

export const OperationUpdateGradeInputSchema = z
  .object({
    path: z
      .object({
        id: z.number().int()
      })
      .strict(),
    body: GradeUpdateSchema
  })
  .strict()
export type OperationUpdateGradeInput = z.infer<typeof OperationUpdateGradeInputSchema>
export const OperationUpdateGradeOutputSchema = GradeSchema
export type OperationUpdateGradeOutput = z.infer<typeof OperationUpdateGradeOutputSchema>
export const OperationUpdateGradeErrorSchema = z.object({
  status: z.literal(404),
  body: ErrorResponseSchema
})
export type OperationUpdateGradeError = z.infer<typeof OperationUpdateGradeErrorSchema>

export const OperationDeleteGradeInputSchema = z
  .object({
    path: z
      .object({
        id: z.number().int()
      })
      .strict()
  })
  .strict()
export type OperationDeleteGradeInput = z.infer<typeof OperationDeleteGradeInputSchema>
export const OperationDeleteGradeOutputSchema = z.undefined()
export type OperationDeleteGradeOutput = z.infer<typeof OperationDeleteGradeOutputSchema>
export const OperationDeleteGradeErrorSchema = z.object({
  status: z.literal(404),
  body: ErrorResponseSchema
})
export type OperationDeleteGradeError = z.infer<typeof OperationDeleteGradeErrorSchema>

export const OperationListTimetableEntriesInputSchema = z.object({}).strict()
export type OperationListTimetableEntriesInput = z.infer<
  typeof OperationListTimetableEntriesInputSchema
>
export const OperationListTimetableEntriesOutputSchema = z.array(TimetableEntrySchema)
export type OperationListTimetableEntriesOutput = z.infer<
  typeof OperationListTimetableEntriesOutputSchema
>
export const OperationListTimetableEntriesErrorSchema = z.never()
export type OperationListTimetableEntriesError = z.infer<
  typeof OperationListTimetableEntriesErrorSchema
>

export const OperationAddTimetableEntryInputSchema = z
  .object({
    body: TimetableEntryInputSchema
  })
  .strict()
export type OperationAddTimetableEntryInput = z.infer<typeof OperationAddTimetableEntryInputSchema>
export const OperationAddTimetableEntryOutputSchema = TimetableEntrySchema
export type OperationAddTimetableEntryOutput = z.infer<
  typeof OperationAddTimetableEntryOutputSchema
>
export const OperationAddTimetableEntryErrorSchema = z.never()
export type OperationAddTimetableEntryError = z.infer<typeof OperationAddTimetableEntryErrorSchema>

export const OperationRemoveTimetableEntryInputSchema = z
  .object({
    path: z
      .object({
        id: z.number().int()
      })
      .strict()
  })
  .strict()
export type OperationRemoveTimetableEntryInput = z.infer<
  typeof OperationRemoveTimetableEntryInputSchema
>
export const OperationRemoveTimetableEntryOutputSchema = z.undefined()
export type OperationRemoveTimetableEntryOutput = z.infer<
  typeof OperationRemoveTimetableEntryOutputSchema
>
export const OperationRemoveTimetableEntryErrorSchema = z.object({
  status: z.literal(404),
  body: ErrorResponseSchema
})
export type OperationRemoveTimetableEntryError = z.infer<
  typeof OperationRemoveTimetableEntryErrorSchema
>

export const OperationClearTimetableInputSchema = z.object({}).strict()
export type OperationClearTimetableInput = z.infer<typeof OperationClearTimetableInputSchema>
export const OperationClearTimetableOutputSchema = z.undefined()
export type OperationClearTimetableOutput = z.infer<typeof OperationClearTimetableOutputSchema>
export const OperationClearTimetableErrorSchema = z.never()
export type OperationClearTimetableError = z.infer<typeof OperationClearTimetableErrorSchema>

export const OperationListTimetablePresetsInputSchema = z.object({}).strict()
export type OperationListTimetablePresetsInput = z.infer<
  typeof OperationListTimetablePresetsInputSchema
>
export const OperationListTimetablePresetsOutputSchema = z.array(TimetablePresetSchema)
export type OperationListTimetablePresetsOutput = z.infer<
  typeof OperationListTimetablePresetsOutputSchema
>
export const OperationListTimetablePresetsErrorSchema = z.never()
export type OperationListTimetablePresetsError = z.infer<
  typeof OperationListTimetablePresetsErrorSchema
>

export const OperationGetTimetablePresetEntriesInputSchema = z
  .object({
    path: z
      .object({
        presetId: z.number().int()
      })
      .strict()
  })
  .strict()
export type OperationGetTimetablePresetEntriesInput = z.infer<
  typeof OperationGetTimetablePresetEntriesInputSchema
>
export const OperationGetTimetablePresetEntriesOutputSchema = z.array(PresetEntrySchema)
export type OperationGetTimetablePresetEntriesOutput = z.infer<
  typeof OperationGetTimetablePresetEntriesOutputSchema
>
export const OperationGetTimetablePresetEntriesErrorSchema = z.never()
export type OperationGetTimetablePresetEntriesError = z.infer<
  typeof OperationGetTimetablePresetEntriesErrorSchema
>

export const OperationListStudyProgramsInputSchema = z.object({}).strict()
export type OperationListStudyProgramsInput = z.infer<typeof OperationListStudyProgramsInputSchema>
export const OperationListStudyProgramsOutputSchema = z.array(StudyProgramSchema)
export type OperationListStudyProgramsOutput = z.infer<
  typeof OperationListStudyProgramsOutputSchema
>
export const OperationListStudyProgramsErrorSchema = z.never()
export type OperationListStudyProgramsError = z.infer<typeof OperationListStudyProgramsErrorSchema>

export const OperationListStudyProgramCoursesInputSchema = z
  .object({
    path: z
      .object({
        id: z.number().int()
      })
      .strict()
  })
  .strict()
export type OperationListStudyProgramCoursesInput = z.infer<
  typeof OperationListStudyProgramCoursesInputSchema
>
export const OperationListStudyProgramCoursesOutputSchema = z.array(CourseSchema)
export type OperationListStudyProgramCoursesOutput = z.infer<
  typeof OperationListStudyProgramCoursesOutputSchema
>
export const OperationListStudyProgramCoursesErrorSchema = z.never()
export type OperationListStudyProgramCoursesError = z.infer<
  typeof OperationListStudyProgramCoursesErrorSchema
>

export const OperationListGroupsInputSchema = z.object({}).strict()
export type OperationListGroupsInput = z.infer<typeof OperationListGroupsInputSchema>
export const OperationListGroupsOutputSchema = z.array(StudyGroupSchema)
export type OperationListGroupsOutput = z.infer<typeof OperationListGroupsOutputSchema>
export const OperationListGroupsErrorSchema = z.never()
export type OperationListGroupsError = z.infer<typeof OperationListGroupsErrorSchema>

export const OperationCreateGroupInputSchema = z
  .object({
    body: StudyGroupInputSchema
  })
  .strict()
export type OperationCreateGroupInput = z.infer<typeof OperationCreateGroupInputSchema>
export const OperationCreateGroupOutputSchema = StudyGroupSchema
export type OperationCreateGroupOutput = z.infer<typeof OperationCreateGroupOutputSchema>
export const OperationCreateGroupErrorSchema = z.never()
export type OperationCreateGroupError = z.infer<typeof OperationCreateGroupErrorSchema>

export const OperationGetGroupsActivityInputSchema = z.object({}).strict()
export type OperationGetGroupsActivityInput = z.infer<typeof OperationGetGroupsActivityInputSchema>
export const OperationGetGroupsActivityOutputSchema = z.array(GroupActivityItemSchema)
export type OperationGetGroupsActivityOutput = z.infer<
  typeof OperationGetGroupsActivityOutputSchema
>
export const OperationGetGroupsActivityErrorSchema = z.never()
export type OperationGetGroupsActivityError = z.infer<typeof OperationGetGroupsActivityErrorSchema>

export const OperationListAllGroupEventsInputSchema = z
  .object({
    query: z
      .object({
        from: z.date().optional(),
        to: z.date().optional()
      })
      .strict()
      .optional()
  })
  .strict()
export type OperationListAllGroupEventsInput = z.infer<
  typeof OperationListAllGroupEventsInputSchema
>
export const OperationListAllGroupEventsOutputSchema = z.array(GroupEventSchema)
export type OperationListAllGroupEventsOutput = z.infer<
  typeof OperationListAllGroupEventsOutputSchema
>
export const OperationListAllGroupEventsErrorSchema = z.never()
export type OperationListAllGroupEventsError = z.infer<
  typeof OperationListAllGroupEventsErrorSchema
>

export const OperationGetGroupInputSchema = z
  .object({
    path: z
      .object({
        id: z.number().int()
      })
      .strict()
  })
  .strict()
export type OperationGetGroupInput = z.infer<typeof OperationGetGroupInputSchema>
export const OperationGetGroupOutputSchema = StudyGroupSchema
export type OperationGetGroupOutput = z.infer<typeof OperationGetGroupOutputSchema>
export const OperationGetGroupErrorSchema = z.object({
  status: z.literal(404),
  body: ErrorResponseSchema
})
export type OperationGetGroupError = z.infer<typeof OperationGetGroupErrorSchema>

export const OperationUpdateGroupInputSchema = z
  .object({
    path: z
      .object({
        id: z.number().int()
      })
      .strict(),
    body: StudyGroupUpdateSchema
  })
  .strict()
export type OperationUpdateGroupInput = z.infer<typeof OperationUpdateGroupInputSchema>
export const OperationUpdateGroupOutputSchema = StudyGroupSchema
export type OperationUpdateGroupOutput = z.infer<typeof OperationUpdateGroupOutputSchema>
export const OperationUpdateGroupErrorSchema = z.object({
  status: z.literal(404),
  body: ErrorResponseSchema
})
export type OperationUpdateGroupError = z.infer<typeof OperationUpdateGroupErrorSchema>

export const OperationDeleteGroupInputSchema = z
  .object({
    path: z
      .object({
        id: z.number().int()
      })
      .strict()
  })
  .strict()
export type OperationDeleteGroupInput = z.infer<typeof OperationDeleteGroupInputSchema>
export const OperationDeleteGroupOutputSchema = z.undefined()
export type OperationDeleteGroupOutput = z.infer<typeof OperationDeleteGroupOutputSchema>
export const OperationDeleteGroupErrorSchema = z.object({
  status: z.literal(403),
  body: ErrorResponseSchema
})
export type OperationDeleteGroupError = z.infer<typeof OperationDeleteGroupErrorSchema>

export const OperationCreateGroupInviteInputSchema = z
  .object({
    path: z
      .object({
        id: z.number().int()
      })
      .strict()
  })
  .strict()
export type OperationCreateGroupInviteInput = z.infer<typeof OperationCreateGroupInviteInputSchema>
export const OperationCreateGroupInviteOutputSchema = GroupInviteLinkSchema
export type OperationCreateGroupInviteOutput = z.infer<
  typeof OperationCreateGroupInviteOutputSchema
>
export const OperationCreateGroupInviteErrorSchema = z.never()
export type OperationCreateGroupInviteError = z.infer<typeof OperationCreateGroupInviteErrorSchema>

export const OperationLeaveGroupInputSchema = z
  .object({
    path: z
      .object({
        id: z.number().int()
      })
      .strict()
  })
  .strict()
export type OperationLeaveGroupInput = z.infer<typeof OperationLeaveGroupInputSchema>
export const OperationLeaveGroupOutputSchema = z.undefined()
export type OperationLeaveGroupOutput = z.infer<typeof OperationLeaveGroupOutputSchema>
export const OperationLeaveGroupErrorSchema = z.never()
export type OperationLeaveGroupError = z.infer<typeof OperationLeaveGroupErrorSchema>

export const OperationListGroupMembersInputSchema = z
  .object({
    path: z
      .object({
        id: z.number().int()
      })
      .strict()
  })
  .strict()
export type OperationListGroupMembersInput = z.infer<typeof OperationListGroupMembersInputSchema>
export const OperationListGroupMembersOutputSchema = z.array(GroupMemberSchema)
export type OperationListGroupMembersOutput = z.infer<typeof OperationListGroupMembersOutputSchema>
export const OperationListGroupMembersErrorSchema = z.never()
export type OperationListGroupMembersError = z.infer<typeof OperationListGroupMembersErrorSchema>

export const OperationRemoveGroupMemberInputSchema = z
  .object({
    path: z
      .object({
        id: z.number().int(),
        userId: z.number().int()
      })
      .strict()
  })
  .strict()
export type OperationRemoveGroupMemberInput = z.infer<typeof OperationRemoveGroupMemberInputSchema>
export const OperationRemoveGroupMemberOutputSchema = z.undefined()
export type OperationRemoveGroupMemberOutput = z.infer<
  typeof OperationRemoveGroupMemberOutputSchema
>
export const OperationRemoveGroupMemberErrorSchema = z.object({
  status: z.literal(403),
  body: ErrorResponseSchema
})
export type OperationRemoveGroupMemberError = z.infer<typeof OperationRemoveGroupMemberErrorSchema>

export const OperationListGroupEventsInputSchema = z
  .object({
    path: z
      .object({
        id: z.number().int()
      })
      .strict()
  })
  .strict()
export type OperationListGroupEventsInput = z.infer<typeof OperationListGroupEventsInputSchema>
export const OperationListGroupEventsOutputSchema = z.array(GroupEventSchema)
export type OperationListGroupEventsOutput = z.infer<typeof OperationListGroupEventsOutputSchema>
export const OperationListGroupEventsErrorSchema = z.never()
export type OperationListGroupEventsError = z.infer<typeof OperationListGroupEventsErrorSchema>

export const OperationCreateGroupEventInputSchema = z
  .object({
    path: z
      .object({
        id: z.number().int()
      })
      .strict(),
    body: GroupEventInputSchema
  })
  .strict()
export type OperationCreateGroupEventInput = z.infer<typeof OperationCreateGroupEventInputSchema>
export const OperationCreateGroupEventOutputSchema = GroupEventSchema
export type OperationCreateGroupEventOutput = z.infer<typeof OperationCreateGroupEventOutputSchema>
export const OperationCreateGroupEventErrorSchema = z.never()
export type OperationCreateGroupEventError = z.infer<typeof OperationCreateGroupEventErrorSchema>

export const OperationUpdateGroupEventInputSchema = z
  .object({
    path: z
      .object({
        id: z.number().int(),
        eventId: z.number().int()
      })
      .strict(),
    body: GroupEventUpdateSchema
  })
  .strict()
export type OperationUpdateGroupEventInput = z.infer<typeof OperationUpdateGroupEventInputSchema>
export const OperationUpdateGroupEventOutputSchema = GroupEventSchema
export type OperationUpdateGroupEventOutput = z.infer<typeof OperationUpdateGroupEventOutputSchema>
export const OperationUpdateGroupEventErrorSchema = z.object({
  status: z.literal(404),
  body: ErrorResponseSchema
})
export type OperationUpdateGroupEventError = z.infer<typeof OperationUpdateGroupEventErrorSchema>

export const OperationDeleteGroupEventInputSchema = z
  .object({
    path: z
      .object({
        id: z.number().int(),
        eventId: z.number().int()
      })
      .strict()
  })
  .strict()
export type OperationDeleteGroupEventInput = z.infer<typeof OperationDeleteGroupEventInputSchema>
export const OperationDeleteGroupEventOutputSchema = z.undefined()
export type OperationDeleteGroupEventOutput = z.infer<typeof OperationDeleteGroupEventOutputSchema>
export const OperationDeleteGroupEventErrorSchema = z.object({
  status: z.literal(404),
  body: ErrorResponseSchema
})
export type OperationDeleteGroupEventError = z.infer<typeof OperationDeleteGroupEventErrorSchema>

export const OperationListEventCommentsInputSchema = z
  .object({
    path: z
      .object({
        id: z.number().int(),
        eventId: z.number().int()
      })
      .strict()
  })
  .strict()
export type OperationListEventCommentsInput = z.infer<typeof OperationListEventCommentsInputSchema>
export const OperationListEventCommentsOutputSchema = z.array(CommentSchema)
export type OperationListEventCommentsOutput = z.infer<
  typeof OperationListEventCommentsOutputSchema
>
export const OperationListEventCommentsErrorSchema = z.never()
export type OperationListEventCommentsError = z.infer<typeof OperationListEventCommentsErrorSchema>

export const OperationAddEventCommentInputSchema = z
  .object({
    path: z
      .object({
        id: z.number().int(),
        eventId: z.number().int()
      })
      .strict(),
    body: CommentInputSchema
  })
  .strict()
export type OperationAddEventCommentInput = z.infer<typeof OperationAddEventCommentInputSchema>
export const OperationAddEventCommentOutputSchema = CommentSchema
export type OperationAddEventCommentOutput = z.infer<typeof OperationAddEventCommentOutputSchema>
export const OperationAddEventCommentErrorSchema = z.never()
export type OperationAddEventCommentError = z.infer<typeof OperationAddEventCommentErrorSchema>

export const OperationListGroupTasksInputSchema = z
  .object({
    path: z
      .object({
        id: z.number().int()
      })
      .strict()
  })
  .strict()
export type OperationListGroupTasksInput = z.infer<typeof OperationListGroupTasksInputSchema>
export const OperationListGroupTasksOutputSchema = z.array(GroupTaskSchema)
export type OperationListGroupTasksOutput = z.infer<typeof OperationListGroupTasksOutputSchema>
export const OperationListGroupTasksErrorSchema = z.never()
export type OperationListGroupTasksError = z.infer<typeof OperationListGroupTasksErrorSchema>

export const OperationCreateGroupTaskInputSchema = z
  .object({
    path: z
      .object({
        id: z.number().int()
      })
      .strict(),
    body: GroupTaskInputSchema
  })
  .strict()
export type OperationCreateGroupTaskInput = z.infer<typeof OperationCreateGroupTaskInputSchema>
export const OperationCreateGroupTaskOutputSchema = GroupTaskSchema
export type OperationCreateGroupTaskOutput = z.infer<typeof OperationCreateGroupTaskOutputSchema>
export const OperationCreateGroupTaskErrorSchema = z.never()
export type OperationCreateGroupTaskError = z.infer<typeof OperationCreateGroupTaskErrorSchema>

export const OperationUpdateGroupTaskInputSchema = z
  .object({
    path: z
      .object({
        id: z.number().int(),
        taskId: z.number().int()
      })
      .strict(),
    body: GroupTaskUpdateSchema
  })
  .strict()
export type OperationUpdateGroupTaskInput = z.infer<typeof OperationUpdateGroupTaskInputSchema>
export const OperationUpdateGroupTaskOutputSchema = GroupTaskSchema
export type OperationUpdateGroupTaskOutput = z.infer<typeof OperationUpdateGroupTaskOutputSchema>
export const OperationUpdateGroupTaskErrorSchema = z.object({
  status: z.literal(404),
  body: ErrorResponseSchema
})
export type OperationUpdateGroupTaskError = z.infer<typeof OperationUpdateGroupTaskErrorSchema>

export const OperationDeleteGroupTaskInputSchema = z
  .object({
    path: z
      .object({
        id: z.number().int(),
        taskId: z.number().int()
      })
      .strict()
  })
  .strict()
export type OperationDeleteGroupTaskInput = z.infer<typeof OperationDeleteGroupTaskInputSchema>
export const OperationDeleteGroupTaskOutputSchema = z.undefined()
export type OperationDeleteGroupTaskOutput = z.infer<typeof OperationDeleteGroupTaskOutputSchema>
export const OperationDeleteGroupTaskErrorSchema = z.object({
  status: z.literal(404),
  body: ErrorResponseSchema
})
export type OperationDeleteGroupTaskError = z.infer<typeof OperationDeleteGroupTaskErrorSchema>

export const OperationListTaskCommentsInputSchema = z
  .object({
    path: z
      .object({
        id: z.number().int(),
        taskId: z.number().int()
      })
      .strict()
  })
  .strict()
export type OperationListTaskCommentsInput = z.infer<typeof OperationListTaskCommentsInputSchema>
export const OperationListTaskCommentsOutputSchema = z.array(CommentSchema)
export type OperationListTaskCommentsOutput = z.infer<typeof OperationListTaskCommentsOutputSchema>
export const OperationListTaskCommentsErrorSchema = z.never()
export type OperationListTaskCommentsError = z.infer<typeof OperationListTaskCommentsErrorSchema>

export const OperationAddTaskCommentInputSchema = z
  .object({
    path: z
      .object({
        id: z.number().int(),
        taskId: z.number().int()
      })
      .strict(),
    body: CommentInputSchema
  })
  .strict()
export type OperationAddTaskCommentInput = z.infer<typeof OperationAddTaskCommentInputSchema>
export const OperationAddTaskCommentOutputSchema = CommentSchema
export type OperationAddTaskCommentOutput = z.infer<typeof OperationAddTaskCommentOutputSchema>
export const OperationAddTaskCommentErrorSchema = z.never()
export type OperationAddTaskCommentError = z.infer<typeof OperationAddTaskCommentErrorSchema>

export const OperationListGroupNotesInputSchema = z
  .object({
    path: z
      .object({
        id: z.number().int()
      })
      .strict()
  })
  .strict()
export type OperationListGroupNotesInput = z.infer<typeof OperationListGroupNotesInputSchema>
export const OperationListGroupNotesOutputSchema = z.array(GroupNoteSchema)
export type OperationListGroupNotesOutput = z.infer<typeof OperationListGroupNotesOutputSchema>
export const OperationListGroupNotesErrorSchema = z.never()
export type OperationListGroupNotesError = z.infer<typeof OperationListGroupNotesErrorSchema>

export const OperationCreateGroupNoteInputSchema = z
  .object({
    path: z
      .object({
        id: z.number().int()
      })
      .strict(),
    body: GroupNoteInputSchema
  })
  .strict()
export type OperationCreateGroupNoteInput = z.infer<typeof OperationCreateGroupNoteInputSchema>
export const OperationCreateGroupNoteOutputSchema = GroupNoteSchema
export type OperationCreateGroupNoteOutput = z.infer<typeof OperationCreateGroupNoteOutputSchema>
export const OperationCreateGroupNoteErrorSchema = z.never()
export type OperationCreateGroupNoteError = z.infer<typeof OperationCreateGroupNoteErrorSchema>

export const OperationUpdateGroupNoteInputSchema = z
  .object({
    path: z
      .object({
        id: z.number().int(),
        noteId: z.number().int()
      })
      .strict(),
    body: GroupNoteUpdateSchema
  })
  .strict()
export type OperationUpdateGroupNoteInput = z.infer<typeof OperationUpdateGroupNoteInputSchema>
export const OperationUpdateGroupNoteOutputSchema = GroupNoteSchema
export type OperationUpdateGroupNoteOutput = z.infer<typeof OperationUpdateGroupNoteOutputSchema>
export const OperationUpdateGroupNoteErrorSchema = z.object({
  status: z.literal(404),
  body: ErrorResponseSchema
})
export type OperationUpdateGroupNoteError = z.infer<typeof OperationUpdateGroupNoteErrorSchema>

export const OperationDeleteGroupNoteInputSchema = z
  .object({
    path: z
      .object({
        id: z.number().int(),
        noteId: z.number().int()
      })
      .strict()
  })
  .strict()
export type OperationDeleteGroupNoteInput = z.infer<typeof OperationDeleteGroupNoteInputSchema>
export const OperationDeleteGroupNoteOutputSchema = z.undefined()
export type OperationDeleteGroupNoteOutput = z.infer<typeof OperationDeleteGroupNoteOutputSchema>
export const OperationDeleteGroupNoteErrorSchema = z.object({
  status: z.literal(404),
  body: ErrorResponseSchema
})
export type OperationDeleteGroupNoteError = z.infer<typeof OperationDeleteGroupNoteErrorSchema>

export const OperationDeleteCommentInputSchema = z
  .object({
    path: z
      .object({
        id: z.number().int()
      })
      .strict()
  })
  .strict()
export type OperationDeleteCommentInput = z.infer<typeof OperationDeleteCommentInputSchema>
export const OperationDeleteCommentOutputSchema = z.undefined()
export type OperationDeleteCommentOutput = z.infer<typeof OperationDeleteCommentOutputSchema>
export const OperationDeleteCommentErrorSchema = z.object({
  status: z.literal(403),
  body: ErrorResponseSchema
})
export type OperationDeleteCommentError = z.infer<typeof OperationDeleteCommentErrorSchema>

export const OperationGetGroupInviteInputSchema = z
  .object({
    path: z
      .object({
        token: z.string()
      })
      .strict()
  })
  .strict()
export type OperationGetGroupInviteInput = z.infer<typeof OperationGetGroupInviteInputSchema>
export const OperationGetGroupInviteOutputSchema = GroupInviteInfoSchema
export type OperationGetGroupInviteOutput = z.infer<typeof OperationGetGroupInviteOutputSchema>
export const OperationGetGroupInviteErrorSchema = z.object({
  status: z.literal(404),
  body: ErrorResponseSchema
})
export type OperationGetGroupInviteError = z.infer<typeof OperationGetGroupInviteErrorSchema>

export const OperationJoinGroupInputSchema = z
  .object({
    path: z
      .object({
        token: z.string()
      })
      .strict()
  })
  .strict()
export type OperationJoinGroupInput = z.infer<typeof OperationJoinGroupInputSchema>
export const OperationJoinGroupOutputSchema = StudyGroupSchema
export type OperationJoinGroupOutput = z.infer<typeof OperationJoinGroupOutputSchema>
export const OperationJoinGroupErrorSchema = z.union([
  z.object({ status: z.literal(400), body: ErrorResponseSchema }),
  z.object({ status: z.literal(404), body: ErrorResponseSchema })
])
export type OperationJoinGroupError = z.infer<typeof OperationJoinGroupErrorSchema>

export interface ApiOperations {
  healthCheck: {
    input: OperationHealthCheckInput
    output: OperationHealthCheckOutput
    error: OperationHealthCheckError
  }
  register: {
    input: OperationRegisterInput
    output: OperationRegisterOutput
    error: OperationRegisterError
  }
  login: {
    input: OperationLoginInput
    output: OperationLoginOutput
    error: OperationLoginError
  }
  logout: {
    input: OperationLogoutInput
    output: OperationLogoutOutput
    error: OperationLogoutError
  }
  getMe: {
    input: OperationGetMeInput
    output: OperationGetMeOutput
    error: OperationGetMeError
  }
  getDashboardStats: {
    input: OperationGetDashboardStatsInput
    output: OperationGetDashboardStatsOutput
    error: OperationGetDashboardStatsError
  }
  getDashboardUpcoming: {
    input: OperationGetDashboardUpcomingInput
    output: OperationGetDashboardUpcomingOutput
    error: OperationGetDashboardUpcomingError
  }
  getDashboardActivity: {
    input: OperationGetDashboardActivityInput
    output: OperationGetDashboardActivityOutput
    error: OperationGetDashboardActivityError
  }
  listEvents: {
    input: OperationListEventsInput
    output: OperationListEventsOutput
    error: OperationListEventsError
  }
  createEvent: {
    input: OperationCreateEventInput
    output: OperationCreateEventOutput
    error: OperationCreateEventError
  }
  getEvent: {
    input: OperationGetEventInput
    output: OperationGetEventOutput
    error: OperationGetEventError
  }
  updateEvent: {
    input: OperationUpdateEventInput
    output: OperationUpdateEventOutput
    error: OperationUpdateEventError
  }
  deleteEvent: {
    input: OperationDeleteEventInput
    output: OperationDeleteEventOutput
    error: OperationDeleteEventError
  }
  listGrades: {
    input: OperationListGradesInput
    output: OperationListGradesOutput
    error: OperationListGradesError
  }
  createGrade: {
    input: OperationCreateGradeInput
    output: OperationCreateGradeOutput
    error: OperationCreateGradeError
  }
  getGradeStats: {
    input: OperationGetGradeStatsInput
    output: OperationGetGradeStatsOutput
    error: OperationGetGradeStatsError
  }
  updateGrade: {
    input: OperationUpdateGradeInput
    output: OperationUpdateGradeOutput
    error: OperationUpdateGradeError
  }
  deleteGrade: {
    input: OperationDeleteGradeInput
    output: OperationDeleteGradeOutput
    error: OperationDeleteGradeError
  }
  listTimetableEntries: {
    input: OperationListTimetableEntriesInput
    output: OperationListTimetableEntriesOutput
    error: OperationListTimetableEntriesError
  }
  addTimetableEntry: {
    input: OperationAddTimetableEntryInput
    output: OperationAddTimetableEntryOutput
    error: OperationAddTimetableEntryError
  }
  removeTimetableEntry: {
    input: OperationRemoveTimetableEntryInput
    output: OperationRemoveTimetableEntryOutput
    error: OperationRemoveTimetableEntryError
  }
  clearTimetable: {
    input: OperationClearTimetableInput
    output: OperationClearTimetableOutput
    error: OperationClearTimetableError
  }
  listTimetablePresets: {
    input: OperationListTimetablePresetsInput
    output: OperationListTimetablePresetsOutput
    error: OperationListTimetablePresetsError
  }
  getTimetablePresetEntries: {
    input: OperationGetTimetablePresetEntriesInput
    output: OperationGetTimetablePresetEntriesOutput
    error: OperationGetTimetablePresetEntriesError
  }
  listStudyPrograms: {
    input: OperationListStudyProgramsInput
    output: OperationListStudyProgramsOutput
    error: OperationListStudyProgramsError
  }
  listStudyProgramCourses: {
    input: OperationListStudyProgramCoursesInput
    output: OperationListStudyProgramCoursesOutput
    error: OperationListStudyProgramCoursesError
  }
  listGroups: {
    input: OperationListGroupsInput
    output: OperationListGroupsOutput
    error: OperationListGroupsError
  }
  createGroup: {
    input: OperationCreateGroupInput
    output: OperationCreateGroupOutput
    error: OperationCreateGroupError
  }
  getGroupsActivity: {
    input: OperationGetGroupsActivityInput
    output: OperationGetGroupsActivityOutput
    error: OperationGetGroupsActivityError
  }
  listAllGroupEvents: {
    input: OperationListAllGroupEventsInput
    output: OperationListAllGroupEventsOutput
    error: OperationListAllGroupEventsError
  }
  getGroup: {
    input: OperationGetGroupInput
    output: OperationGetGroupOutput
    error: OperationGetGroupError
  }
  updateGroup: {
    input: OperationUpdateGroupInput
    output: OperationUpdateGroupOutput
    error: OperationUpdateGroupError
  }
  deleteGroup: {
    input: OperationDeleteGroupInput
    output: OperationDeleteGroupOutput
    error: OperationDeleteGroupError
  }
  createGroupInvite: {
    input: OperationCreateGroupInviteInput
    output: OperationCreateGroupInviteOutput
    error: OperationCreateGroupInviteError
  }
  leaveGroup: {
    input: OperationLeaveGroupInput
    output: OperationLeaveGroupOutput
    error: OperationLeaveGroupError
  }
  listGroupMembers: {
    input: OperationListGroupMembersInput
    output: OperationListGroupMembersOutput
    error: OperationListGroupMembersError
  }
  removeGroupMember: {
    input: OperationRemoveGroupMemberInput
    output: OperationRemoveGroupMemberOutput
    error: OperationRemoveGroupMemberError
  }
  listGroupEvents: {
    input: OperationListGroupEventsInput
    output: OperationListGroupEventsOutput
    error: OperationListGroupEventsError
  }
  createGroupEvent: {
    input: OperationCreateGroupEventInput
    output: OperationCreateGroupEventOutput
    error: OperationCreateGroupEventError
  }
  updateGroupEvent: {
    input: OperationUpdateGroupEventInput
    output: OperationUpdateGroupEventOutput
    error: OperationUpdateGroupEventError
  }
  deleteGroupEvent: {
    input: OperationDeleteGroupEventInput
    output: OperationDeleteGroupEventOutput
    error: OperationDeleteGroupEventError
  }
  listEventComments: {
    input: OperationListEventCommentsInput
    output: OperationListEventCommentsOutput
    error: OperationListEventCommentsError
  }
  addEventComment: {
    input: OperationAddEventCommentInput
    output: OperationAddEventCommentOutput
    error: OperationAddEventCommentError
  }
  listGroupTasks: {
    input: OperationListGroupTasksInput
    output: OperationListGroupTasksOutput
    error: OperationListGroupTasksError
  }
  createGroupTask: {
    input: OperationCreateGroupTaskInput
    output: OperationCreateGroupTaskOutput
    error: OperationCreateGroupTaskError
  }
  updateGroupTask: {
    input: OperationUpdateGroupTaskInput
    output: OperationUpdateGroupTaskOutput
    error: OperationUpdateGroupTaskError
  }
  deleteGroupTask: {
    input: OperationDeleteGroupTaskInput
    output: OperationDeleteGroupTaskOutput
    error: OperationDeleteGroupTaskError
  }
  listTaskComments: {
    input: OperationListTaskCommentsInput
    output: OperationListTaskCommentsOutput
    error: OperationListTaskCommentsError
  }
  addTaskComment: {
    input: OperationAddTaskCommentInput
    output: OperationAddTaskCommentOutput
    error: OperationAddTaskCommentError
  }
  listGroupNotes: {
    input: OperationListGroupNotesInput
    output: OperationListGroupNotesOutput
    error: OperationListGroupNotesError
  }
  createGroupNote: {
    input: OperationCreateGroupNoteInput
    output: OperationCreateGroupNoteOutput
    error: OperationCreateGroupNoteError
  }
  updateGroupNote: {
    input: OperationUpdateGroupNoteInput
    output: OperationUpdateGroupNoteOutput
    error: OperationUpdateGroupNoteError
  }
  deleteGroupNote: {
    input: OperationDeleteGroupNoteInput
    output: OperationDeleteGroupNoteOutput
    error: OperationDeleteGroupNoteError
  }
  deleteComment: {
    input: OperationDeleteCommentInput
    output: OperationDeleteCommentOutput
    error: OperationDeleteCommentError
  }
  getGroupInvite: {
    input: OperationGetGroupInviteInput
    output: OperationGetGroupInviteOutput
    error: OperationGetGroupInviteError
  }
  joinGroup: {
    input: OperationJoinGroupInput
    output: OperationJoinGroupOutput
    error: OperationJoinGroupError
  }
}

export type ApiOperationId = keyof ApiOperations
export type ApiInput<K extends ApiOperationId> = ApiOperations[K]['input']
export type ApiOutput<K extends ApiOperationId> = ApiOperations[K]['output']
export type ApiDeclaredError<K extends ApiOperationId> = ApiOperations[K]['error']

export const operationContracts = {
  healthCheck: {
    method: 'GET',
    path: '/healthz',
    tag: 'health',
    input: OperationHealthCheckInputSchema,
    output: OperationHealthCheckOutputSchema,
    error: OperationHealthCheckErrorSchema
  },
  register: {
    method: 'POST',
    path: '/auth/register',
    tag: 'auth',
    input: OperationRegisterInputSchema,
    output: OperationRegisterOutputSchema,
    error: OperationRegisterErrorSchema
  },
  login: {
    method: 'POST',
    path: '/auth/login',
    tag: 'auth',
    input: OperationLoginInputSchema,
    output: OperationLoginOutputSchema,
    error: OperationLoginErrorSchema
  },
  logout: {
    method: 'POST',
    path: '/auth/logout',
    tag: 'auth',
    input: OperationLogoutInputSchema,
    output: OperationLogoutOutputSchema,
    error: OperationLogoutErrorSchema
  },
  getMe: {
    method: 'GET',
    path: '/auth/me',
    tag: 'auth',
    input: OperationGetMeInputSchema,
    output: OperationGetMeOutputSchema,
    error: OperationGetMeErrorSchema
  },
  getDashboardStats: {
    method: 'GET',
    path: '/dashboard/stats',
    tag: 'dashboard',
    input: OperationGetDashboardStatsInputSchema,
    output: OperationGetDashboardStatsOutputSchema,
    error: OperationGetDashboardStatsErrorSchema
  },
  getDashboardUpcoming: {
    method: 'GET',
    path: '/dashboard/upcoming',
    tag: 'dashboard',
    input: OperationGetDashboardUpcomingInputSchema,
    output: OperationGetDashboardUpcomingOutputSchema,
    error: OperationGetDashboardUpcomingErrorSchema
  },
  getDashboardActivity: {
    method: 'GET',
    path: '/dashboard/activity',
    tag: 'dashboard',
    input: OperationGetDashboardActivityInputSchema,
    output: OperationGetDashboardActivityOutputSchema,
    error: OperationGetDashboardActivityErrorSchema
  },
  listEvents: {
    method: 'GET',
    path: '/events',
    tag: 'events',
    input: OperationListEventsInputSchema,
    output: OperationListEventsOutputSchema,
    error: OperationListEventsErrorSchema
  },
  createEvent: {
    method: 'POST',
    path: '/events',
    tag: 'events',
    input: OperationCreateEventInputSchema,
    output: OperationCreateEventOutputSchema,
    error: OperationCreateEventErrorSchema
  },
  getEvent: {
    method: 'GET',
    path: '/events/{id}',
    tag: 'events',
    input: OperationGetEventInputSchema,
    output: OperationGetEventOutputSchema,
    error: OperationGetEventErrorSchema
  },
  updateEvent: {
    method: 'PATCH',
    path: '/events/{id}',
    tag: 'events',
    input: OperationUpdateEventInputSchema,
    output: OperationUpdateEventOutputSchema,
    error: OperationUpdateEventErrorSchema
  },
  deleteEvent: {
    method: 'DELETE',
    path: '/events/{id}',
    tag: 'events',
    input: OperationDeleteEventInputSchema,
    output: OperationDeleteEventOutputSchema,
    error: OperationDeleteEventErrorSchema
  },
  listGrades: {
    method: 'GET',
    path: '/grades',
    tag: 'grades',
    input: OperationListGradesInputSchema,
    output: OperationListGradesOutputSchema,
    error: OperationListGradesErrorSchema
  },
  createGrade: {
    method: 'POST',
    path: '/grades',
    tag: 'grades',
    input: OperationCreateGradeInputSchema,
    output: OperationCreateGradeOutputSchema,
    error: OperationCreateGradeErrorSchema
  },
  getGradeStats: {
    method: 'GET',
    path: '/grades/stats',
    tag: 'grades',
    input: OperationGetGradeStatsInputSchema,
    output: OperationGetGradeStatsOutputSchema,
    error: OperationGetGradeStatsErrorSchema
  },
  updateGrade: {
    method: 'PATCH',
    path: '/grades/{id}',
    tag: 'grades',
    input: OperationUpdateGradeInputSchema,
    output: OperationUpdateGradeOutputSchema,
    error: OperationUpdateGradeErrorSchema
  },
  deleteGrade: {
    method: 'DELETE',
    path: '/grades/{id}',
    tag: 'grades',
    input: OperationDeleteGradeInputSchema,
    output: OperationDeleteGradeOutputSchema,
    error: OperationDeleteGradeErrorSchema
  },
  listTimetableEntries: {
    method: 'GET',
    path: '/timetable',
    tag: 'timetable',
    input: OperationListTimetableEntriesInputSchema,
    output: OperationListTimetableEntriesOutputSchema,
    error: OperationListTimetableEntriesErrorSchema
  },
  addTimetableEntry: {
    method: 'POST',
    path: '/timetable',
    tag: 'timetable',
    input: OperationAddTimetableEntryInputSchema,
    output: OperationAddTimetableEntryOutputSchema,
    error: OperationAddTimetableEntryErrorSchema
  },
  removeTimetableEntry: {
    method: 'DELETE',
    path: '/timetable/{id}',
    tag: 'timetable',
    input: OperationRemoveTimetableEntryInputSchema,
    output: OperationRemoveTimetableEntryOutputSchema,
    error: OperationRemoveTimetableEntryErrorSchema
  },
  clearTimetable: {
    method: 'DELETE',
    path: '/timetable/clear',
    tag: 'timetable',
    input: OperationClearTimetableInputSchema,
    output: OperationClearTimetableOutputSchema,
    error: OperationClearTimetableErrorSchema
  },
  listTimetablePresets: {
    method: 'GET',
    path: '/timetable/presets',
    tag: 'timetable',
    input: OperationListTimetablePresetsInputSchema,
    output: OperationListTimetablePresetsOutputSchema,
    error: OperationListTimetablePresetsErrorSchema
  },
  getTimetablePresetEntries: {
    method: 'GET',
    path: '/timetable/presets/{presetId}/entries',
    tag: 'timetable',
    input: OperationGetTimetablePresetEntriesInputSchema,
    output: OperationGetTimetablePresetEntriesOutputSchema,
    error: OperationGetTimetablePresetEntriesErrorSchema
  },
  listStudyPrograms: {
    method: 'GET',
    path: '/study-programs',
    tag: 'studyPrograms',
    input: OperationListStudyProgramsInputSchema,
    output: OperationListStudyProgramsOutputSchema,
    error: OperationListStudyProgramsErrorSchema
  },
  listStudyProgramCourses: {
    method: 'GET',
    path: '/study-programs/{id}/courses',
    tag: 'studyPrograms',
    input: OperationListStudyProgramCoursesInputSchema,
    output: OperationListStudyProgramCoursesOutputSchema,
    error: OperationListStudyProgramCoursesErrorSchema
  },
  listGroups: {
    method: 'GET',
    path: '/groups',
    tag: 'groups',
    input: OperationListGroupsInputSchema,
    output: OperationListGroupsOutputSchema,
    error: OperationListGroupsErrorSchema
  },
  createGroup: {
    method: 'POST',
    path: '/groups',
    tag: 'groups',
    input: OperationCreateGroupInputSchema,
    output: OperationCreateGroupOutputSchema,
    error: OperationCreateGroupErrorSchema
  },
  getGroupsActivity: {
    method: 'GET',
    path: '/groups/activity',
    tag: 'groups',
    input: OperationGetGroupsActivityInputSchema,
    output: OperationGetGroupsActivityOutputSchema,
    error: OperationGetGroupsActivityErrorSchema
  },
  listAllGroupEvents: {
    method: 'GET',
    path: '/groups/events',
    tag: 'groups',
    input: OperationListAllGroupEventsInputSchema,
    output: OperationListAllGroupEventsOutputSchema,
    error: OperationListAllGroupEventsErrorSchema
  },
  getGroup: {
    method: 'GET',
    path: '/groups/{id}',
    tag: 'groups',
    input: OperationGetGroupInputSchema,
    output: OperationGetGroupOutputSchema,
    error: OperationGetGroupErrorSchema
  },
  updateGroup: {
    method: 'PATCH',
    path: '/groups/{id}',
    tag: 'groups',
    input: OperationUpdateGroupInputSchema,
    output: OperationUpdateGroupOutputSchema,
    error: OperationUpdateGroupErrorSchema
  },
  deleteGroup: {
    method: 'DELETE',
    path: '/groups/{id}',
    tag: 'groups',
    input: OperationDeleteGroupInputSchema,
    output: OperationDeleteGroupOutputSchema,
    error: OperationDeleteGroupErrorSchema
  },
  createGroupInvite: {
    method: 'POST',
    path: '/groups/{id}/invite',
    tag: 'groups',
    input: OperationCreateGroupInviteInputSchema,
    output: OperationCreateGroupInviteOutputSchema,
    error: OperationCreateGroupInviteErrorSchema
  },
  leaveGroup: {
    method: 'POST',
    path: '/groups/{id}/leave',
    tag: 'groups',
    input: OperationLeaveGroupInputSchema,
    output: OperationLeaveGroupOutputSchema,
    error: OperationLeaveGroupErrorSchema
  },
  listGroupMembers: {
    method: 'GET',
    path: '/groups/{id}/members',
    tag: 'groups',
    input: OperationListGroupMembersInputSchema,
    output: OperationListGroupMembersOutputSchema,
    error: OperationListGroupMembersErrorSchema
  },
  removeGroupMember: {
    method: 'DELETE',
    path: '/groups/{id}/members/{userId}',
    tag: 'groups',
    input: OperationRemoveGroupMemberInputSchema,
    output: OperationRemoveGroupMemberOutputSchema,
    error: OperationRemoveGroupMemberErrorSchema
  },
  listGroupEvents: {
    method: 'GET',
    path: '/groups/{id}/events',
    tag: 'groups',
    input: OperationListGroupEventsInputSchema,
    output: OperationListGroupEventsOutputSchema,
    error: OperationListGroupEventsErrorSchema
  },
  createGroupEvent: {
    method: 'POST',
    path: '/groups/{id}/events',
    tag: 'groups',
    input: OperationCreateGroupEventInputSchema,
    output: OperationCreateGroupEventOutputSchema,
    error: OperationCreateGroupEventErrorSchema
  },
  updateGroupEvent: {
    method: 'PATCH',
    path: '/groups/{id}/events/{eventId}',
    tag: 'groups',
    input: OperationUpdateGroupEventInputSchema,
    output: OperationUpdateGroupEventOutputSchema,
    error: OperationUpdateGroupEventErrorSchema
  },
  deleteGroupEvent: {
    method: 'DELETE',
    path: '/groups/{id}/events/{eventId}',
    tag: 'groups',
    input: OperationDeleteGroupEventInputSchema,
    output: OperationDeleteGroupEventOutputSchema,
    error: OperationDeleteGroupEventErrorSchema
  },
  listEventComments: {
    method: 'GET',
    path: '/groups/{id}/events/{eventId}/comments',
    tag: 'groups',
    input: OperationListEventCommentsInputSchema,
    output: OperationListEventCommentsOutputSchema,
    error: OperationListEventCommentsErrorSchema
  },
  addEventComment: {
    method: 'POST',
    path: '/groups/{id}/events/{eventId}/comments',
    tag: 'groups',
    input: OperationAddEventCommentInputSchema,
    output: OperationAddEventCommentOutputSchema,
    error: OperationAddEventCommentErrorSchema
  },
  listGroupTasks: {
    method: 'GET',
    path: '/groups/{id}/tasks',
    tag: 'groups',
    input: OperationListGroupTasksInputSchema,
    output: OperationListGroupTasksOutputSchema,
    error: OperationListGroupTasksErrorSchema
  },
  createGroupTask: {
    method: 'POST',
    path: '/groups/{id}/tasks',
    tag: 'groups',
    input: OperationCreateGroupTaskInputSchema,
    output: OperationCreateGroupTaskOutputSchema,
    error: OperationCreateGroupTaskErrorSchema
  },
  updateGroupTask: {
    method: 'PATCH',
    path: '/groups/{id}/tasks/{taskId}',
    tag: 'groups',
    input: OperationUpdateGroupTaskInputSchema,
    output: OperationUpdateGroupTaskOutputSchema,
    error: OperationUpdateGroupTaskErrorSchema
  },
  deleteGroupTask: {
    method: 'DELETE',
    path: '/groups/{id}/tasks/{taskId}',
    tag: 'groups',
    input: OperationDeleteGroupTaskInputSchema,
    output: OperationDeleteGroupTaskOutputSchema,
    error: OperationDeleteGroupTaskErrorSchema
  },
  listTaskComments: {
    method: 'GET',
    path: '/groups/{id}/tasks/{taskId}/comments',
    tag: 'groups',
    input: OperationListTaskCommentsInputSchema,
    output: OperationListTaskCommentsOutputSchema,
    error: OperationListTaskCommentsErrorSchema
  },
  addTaskComment: {
    method: 'POST',
    path: '/groups/{id}/tasks/{taskId}/comments',
    tag: 'groups',
    input: OperationAddTaskCommentInputSchema,
    output: OperationAddTaskCommentOutputSchema,
    error: OperationAddTaskCommentErrorSchema
  },
  listGroupNotes: {
    method: 'GET',
    path: '/groups/{id}/notes',
    tag: 'groups',
    input: OperationListGroupNotesInputSchema,
    output: OperationListGroupNotesOutputSchema,
    error: OperationListGroupNotesErrorSchema
  },
  createGroupNote: {
    method: 'POST',
    path: '/groups/{id}/notes',
    tag: 'groups',
    input: OperationCreateGroupNoteInputSchema,
    output: OperationCreateGroupNoteOutputSchema,
    error: OperationCreateGroupNoteErrorSchema
  },
  updateGroupNote: {
    method: 'PATCH',
    path: '/groups/{id}/notes/{noteId}',
    tag: 'groups',
    input: OperationUpdateGroupNoteInputSchema,
    output: OperationUpdateGroupNoteOutputSchema,
    error: OperationUpdateGroupNoteErrorSchema
  },
  deleteGroupNote: {
    method: 'DELETE',
    path: '/groups/{id}/notes/{noteId}',
    tag: 'groups',
    input: OperationDeleteGroupNoteInputSchema,
    output: OperationDeleteGroupNoteOutputSchema,
    error: OperationDeleteGroupNoteErrorSchema
  },
  deleteComment: {
    method: 'DELETE',
    path: '/comments/{id}',
    tag: 'groups',
    input: OperationDeleteCommentInputSchema,
    output: OperationDeleteCommentOutputSchema,
    error: OperationDeleteCommentErrorSchema
  },
  getGroupInvite: {
    method: 'GET',
    path: '/invite/{token}',
    tag: 'invite',
    input: OperationGetGroupInviteInputSchema,
    output: OperationGetGroupInviteOutputSchema,
    error: OperationGetGroupInviteErrorSchema
  },
  joinGroup: {
    method: 'POST',
    path: '/invite/{token}/join',
    tag: 'invite',
    input: OperationJoinGroupInputSchema,
    output: OperationJoinGroupOutputSchema,
    error: OperationJoinGroupErrorSchema
  }
} as const
