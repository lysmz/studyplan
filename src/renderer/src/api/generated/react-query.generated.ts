/**
 * GENERATED FILE - DO NOT EDIT.
 * Source: api/openapi.yaml
 * Run `npm run api:generate` to regenerate.
 */
import {
  useMutation,
  useQuery,
  type MutationFunction,
  type QueryKey,
  type UseMutationOptions,
  type UseMutationResult,
  type UseQueryOptions,
  type UseQueryResult
} from '@tanstack/react-query'
import { createApiClient } from '../../../../shared/api'
import type {
  ApiClientError,
  ApiClient,
  ApiDeclaredError,
  ApiInput,
  ApiOperationId,
  ApiOutput,
  ApiTransport
} from '../../../../shared/api'

export type ApiOperationError<K extends ApiOperationId> = ApiClientError & {
  readonly details?: ApiDeclaredError<K>
}

function getTransport(): ApiTransport {
  return (window as unknown as { apiTransport: { invoke: ApiTransport } }).apiTransport.invoke
}

const api = createApiClient((operationId, input) => getTransport()(operationId, input))

function getApi(): ApiClient {
  return api
}

function isDefined(value: unknown): boolean {
  return value !== undefined && value !== null
}

function withQueryKey<TData, TError>(
  query: UseQueryResult<TData, TError>,
  queryKey: QueryKey
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  return Object.assign(query, { queryKey })
}

export type HealthCheckQueryResult = ApiOutput<'healthCheck'>
export type HealthCheckQueryError = ApiOperationError<'healthCheck'>
export type HealthCheckQueryHookOptions<TData, TError> = {
  query?: Omit<UseQueryOptions<ApiOutput<'healthCheck'>, TError, TData>, 'queryKey' | 'queryFn'> & {
    queryKey?: QueryKey
  }
}

export const getHealthCheckQueryKey = (): readonly [
  'api',
  'healthCheck',
  ApiInput<'healthCheck'>
] => {
  const input = {} satisfies ApiInput<'healthCheck'>
  return ['api', 'healthCheck', input] as const
}

export const getHealthCheckQueryOptions = <
  TData = ApiOutput<'healthCheck'>,
  TError = HealthCheckQueryError
>(
  options?: HealthCheckQueryHookOptions<TData, TError>
): UseQueryOptions<ApiOutput<'healthCheck'>, TError, TData> & { queryKey: QueryKey } => {
  const input = {} satisfies ApiInput<'healthCheck'>
  const queryOptions = options?.query
  const queryKey = queryOptions?.queryKey ?? getHealthCheckQueryKey()
  const requiredParametersPresent = true

  return {
    ...queryOptions,
    queryKey,
    queryFn: () => getApi()['health']['healthCheck'](input),
    enabled: requiredParametersPresent ? queryOptions?.enabled : false
  } as UseQueryOptions<ApiOutput<'healthCheck'>, TError, TData> & { queryKey: QueryKey }
}

export function useHealthCheck<TData = ApiOutput<'healthCheck'>, TError = HealthCheckQueryError>(
  options?: HealthCheckQueryHookOptions<TData, TError>
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getHealthCheckQueryOptions(options)
  const query = useQuery(queryOptions) as UseQueryResult<TData, TError>
  return withQueryKey(query, queryOptions.queryKey)
}

export type RegisterMutationVariables = { data: NonNullable<ApiInput<'register'>['body']> }
export type RegisterMutationResult = ApiOutput<'register'>
export type RegisterMutationBody = NonNullable<ApiInput<'register'>['body']>
export type RegisterMutationError = ApiOperationError<'register'>
export type RegisterMutationHookOptions<TError, TContext> = {
  mutation?: UseMutationOptions<ApiOutput<'register'>, TError, RegisterMutationVariables, TContext>
}

export const getRegisterMutationOptions = <TError = RegisterMutationError, TContext = unknown>(
  options?: RegisterMutationHookOptions<TError, TContext>
): UseMutationOptions<ApiOutput<'register'>, TError, RegisterMutationVariables, TContext> => {
  const mutationOptions = options?.mutation
  const mutationKey = mutationOptions?.mutationKey ?? ['api', 'register']
  const mutationFn: MutationFunction<ApiOutput<'register'>, RegisterMutationVariables> = (
    variables
  ) => {
    const input = { body: variables.data } satisfies ApiInput<'register'>
    return getApi()['auth']['register'](input)
  }

  return { mutationKey, mutationFn, ...mutationOptions }
}

export const useRegister = <TError = RegisterMutationError, TContext = unknown>(
  options?: RegisterMutationHookOptions<TError, TContext>
): UseMutationResult<ApiOutput<'register'>, TError, RegisterMutationVariables, TContext> =>
  useMutation(getRegisterMutationOptions(options))

export type LoginMutationVariables = { data: NonNullable<ApiInput<'login'>['body']> }
export type LoginMutationResult = ApiOutput<'login'>
export type LoginMutationBody = NonNullable<ApiInput<'login'>['body']>
export type LoginMutationError = ApiOperationError<'login'>
export type LoginMutationHookOptions<TError, TContext> = {
  mutation?: UseMutationOptions<ApiOutput<'login'>, TError, LoginMutationVariables, TContext>
}

export const getLoginMutationOptions = <TError = LoginMutationError, TContext = unknown>(
  options?: LoginMutationHookOptions<TError, TContext>
): UseMutationOptions<ApiOutput<'login'>, TError, LoginMutationVariables, TContext> => {
  const mutationOptions = options?.mutation
  const mutationKey = mutationOptions?.mutationKey ?? ['api', 'login']
  const mutationFn: MutationFunction<ApiOutput<'login'>, LoginMutationVariables> = (variables) => {
    const input = { body: variables.data } satisfies ApiInput<'login'>
    return getApi()['auth']['login'](input)
  }

  return { mutationKey, mutationFn, ...mutationOptions }
}

export const useLogin = <TError = LoginMutationError, TContext = unknown>(
  options?: LoginMutationHookOptions<TError, TContext>
): UseMutationResult<ApiOutput<'login'>, TError, LoginMutationVariables, TContext> =>
  useMutation(getLoginMutationOptions(options))

export type LogoutMutationVariables = void
export type LogoutMutationResult = ApiOutput<'logout'>

export type LogoutMutationError = ApiOperationError<'logout'>
export type LogoutMutationHookOptions<TError, TContext> = {
  mutation?: UseMutationOptions<ApiOutput<'logout'>, TError, LogoutMutationVariables, TContext>
}

export const getLogoutMutationOptions = <TError = LogoutMutationError, TContext = unknown>(
  options?: LogoutMutationHookOptions<TError, TContext>
): UseMutationOptions<ApiOutput<'logout'>, TError, LogoutMutationVariables, TContext> => {
  const mutationOptions = options?.mutation
  const mutationKey = mutationOptions?.mutationKey ?? ['api', 'logout']
  const mutationFn: MutationFunction<ApiOutput<'logout'>, LogoutMutationVariables> = () => {
    const input = {} satisfies ApiInput<'logout'>
    return getApi()['auth']['logout'](input)
  }

  return { mutationKey, mutationFn, ...mutationOptions }
}

export const useLogout = <TError = LogoutMutationError, TContext = unknown>(
  options?: LogoutMutationHookOptions<TError, TContext>
): UseMutationResult<ApiOutput<'logout'>, TError, LogoutMutationVariables, TContext> =>
  useMutation(getLogoutMutationOptions(options))

export type GetMeQueryResult = ApiOutput<'getMe'>
export type GetMeQueryError = ApiOperationError<'getMe'>
export type GetMeQueryHookOptions<TData, TError> = {
  query?: Omit<UseQueryOptions<ApiOutput<'getMe'>, TError, TData>, 'queryKey' | 'queryFn'> & {
    queryKey?: QueryKey
  }
}

export const getGetMeQueryKey = (): readonly ['api', 'getMe', ApiInput<'getMe'>] => {
  const input = {} satisfies ApiInput<'getMe'>
  return ['api', 'getMe', input] as const
}

export const getGetMeQueryOptions = <TData = ApiOutput<'getMe'>, TError = GetMeQueryError>(
  options?: GetMeQueryHookOptions<TData, TError>
): UseQueryOptions<ApiOutput<'getMe'>, TError, TData> & { queryKey: QueryKey } => {
  const input = {} satisfies ApiInput<'getMe'>
  const queryOptions = options?.query
  const queryKey = queryOptions?.queryKey ?? getGetMeQueryKey()
  const requiredParametersPresent = true

  return {
    ...queryOptions,
    queryKey,
    queryFn: () => getApi()['auth']['getMe'](input),
    enabled: requiredParametersPresent ? queryOptions?.enabled : false
  } as UseQueryOptions<ApiOutput<'getMe'>, TError, TData> & { queryKey: QueryKey }
}

export function useGetMe<TData = ApiOutput<'getMe'>, TError = GetMeQueryError>(
  options?: GetMeQueryHookOptions<TData, TError>
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getGetMeQueryOptions(options)
  const query = useQuery(queryOptions) as UseQueryResult<TData, TError>
  return withQueryKey(query, queryOptions.queryKey)
}

export type GetDashboardStatsQueryResult = ApiOutput<'getDashboardStats'>
export type GetDashboardStatsQueryError = ApiOperationError<'getDashboardStats'>
export type GetDashboardStatsQueryHookOptions<TData, TError> = {
  query?: Omit<
    UseQueryOptions<ApiOutput<'getDashboardStats'>, TError, TData>,
    'queryKey' | 'queryFn'
  > & {
    queryKey?: QueryKey
  }
}

export const getGetDashboardStatsQueryKey = (): readonly [
  'api',
  'getDashboardStats',
  ApiInput<'getDashboardStats'>
] => {
  const input = {} satisfies ApiInput<'getDashboardStats'>
  return ['api', 'getDashboardStats', input] as const
}

export const getGetDashboardStatsQueryOptions = <
  TData = ApiOutput<'getDashboardStats'>,
  TError = GetDashboardStatsQueryError
>(
  options?: GetDashboardStatsQueryHookOptions<TData, TError>
): UseQueryOptions<ApiOutput<'getDashboardStats'>, TError, TData> & { queryKey: QueryKey } => {
  const input = {} satisfies ApiInput<'getDashboardStats'>
  const queryOptions = options?.query
  const queryKey = queryOptions?.queryKey ?? getGetDashboardStatsQueryKey()
  const requiredParametersPresent = true

  return {
    ...queryOptions,
    queryKey,
    queryFn: () => getApi()['dashboard']['getDashboardStats'](input),
    enabled: requiredParametersPresent ? queryOptions?.enabled : false
  } as UseQueryOptions<ApiOutput<'getDashboardStats'>, TError, TData> & { queryKey: QueryKey }
}

export function useGetDashboardStats<
  TData = ApiOutput<'getDashboardStats'>,
  TError = GetDashboardStatsQueryError
>(
  options?: GetDashboardStatsQueryHookOptions<TData, TError>
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getGetDashboardStatsQueryOptions(options)
  const query = useQuery(queryOptions) as UseQueryResult<TData, TError>
  return withQueryKey(query, queryOptions.queryKey)
}

export type GetDashboardUpcomingQueryResult = ApiOutput<'getDashboardUpcoming'>
export type GetDashboardUpcomingQueryError = ApiOperationError<'getDashboardUpcoming'>
export type GetDashboardUpcomingQueryHookOptions<TData, TError> = {
  query?: Omit<
    UseQueryOptions<ApiOutput<'getDashboardUpcoming'>, TError, TData>,
    'queryKey' | 'queryFn'
  > & {
    queryKey?: QueryKey
  }
}

export const getGetDashboardUpcomingQueryKey = (): readonly [
  'api',
  'getDashboardUpcoming',
  ApiInput<'getDashboardUpcoming'>
] => {
  const input = {} satisfies ApiInput<'getDashboardUpcoming'>
  return ['api', 'getDashboardUpcoming', input] as const
}

export const getGetDashboardUpcomingQueryOptions = <
  TData = ApiOutput<'getDashboardUpcoming'>,
  TError = GetDashboardUpcomingQueryError
>(
  options?: GetDashboardUpcomingQueryHookOptions<TData, TError>
): UseQueryOptions<ApiOutput<'getDashboardUpcoming'>, TError, TData> & { queryKey: QueryKey } => {
  const input = {} satisfies ApiInput<'getDashboardUpcoming'>
  const queryOptions = options?.query
  const queryKey = queryOptions?.queryKey ?? getGetDashboardUpcomingQueryKey()
  const requiredParametersPresent = true

  return {
    ...queryOptions,
    queryKey,
    queryFn: () => getApi()['dashboard']['getDashboardUpcoming'](input),
    enabled: requiredParametersPresent ? queryOptions?.enabled : false
  } as UseQueryOptions<ApiOutput<'getDashboardUpcoming'>, TError, TData> & { queryKey: QueryKey }
}

export function useGetDashboardUpcoming<
  TData = ApiOutput<'getDashboardUpcoming'>,
  TError = GetDashboardUpcomingQueryError
>(
  options?: GetDashboardUpcomingQueryHookOptions<TData, TError>
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getGetDashboardUpcomingQueryOptions(options)
  const query = useQuery(queryOptions) as UseQueryResult<TData, TError>
  return withQueryKey(query, queryOptions.queryKey)
}

export type GetDashboardActivityQueryResult = ApiOutput<'getDashboardActivity'>
export type GetDashboardActivityQueryError = ApiOperationError<'getDashboardActivity'>
export type GetDashboardActivityQueryHookOptions<TData, TError> = {
  query?: Omit<
    UseQueryOptions<ApiOutput<'getDashboardActivity'>, TError, TData>,
    'queryKey' | 'queryFn'
  > & {
    queryKey?: QueryKey
  }
}

export const getGetDashboardActivityQueryKey = (): readonly [
  'api',
  'getDashboardActivity',
  ApiInput<'getDashboardActivity'>
] => {
  const input = {} satisfies ApiInput<'getDashboardActivity'>
  return ['api', 'getDashboardActivity', input] as const
}

export const getGetDashboardActivityQueryOptions = <
  TData = ApiOutput<'getDashboardActivity'>,
  TError = GetDashboardActivityQueryError
>(
  options?: GetDashboardActivityQueryHookOptions<TData, TError>
): UseQueryOptions<ApiOutput<'getDashboardActivity'>, TError, TData> & { queryKey: QueryKey } => {
  const input = {} satisfies ApiInput<'getDashboardActivity'>
  const queryOptions = options?.query
  const queryKey = queryOptions?.queryKey ?? getGetDashboardActivityQueryKey()
  const requiredParametersPresent = true

  return {
    ...queryOptions,
    queryKey,
    queryFn: () => getApi()['dashboard']['getDashboardActivity'](input),
    enabled: requiredParametersPresent ? queryOptions?.enabled : false
  } as UseQueryOptions<ApiOutput<'getDashboardActivity'>, TError, TData> & { queryKey: QueryKey }
}

export function useGetDashboardActivity<
  TData = ApiOutput<'getDashboardActivity'>,
  TError = GetDashboardActivityQueryError
>(
  options?: GetDashboardActivityQueryHookOptions<TData, TError>
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getGetDashboardActivityQueryOptions(options)
  const query = useQuery(queryOptions) as UseQueryResult<TData, TError>
  return withQueryKey(query, queryOptions.queryKey)
}

export type ListEventsParams = NonNullable<ApiInput<'listEvents'>['query']>
export type ListEventsQueryResult = ApiOutput<'listEvents'>
export type ListEventsQueryError = ApiOperationError<'listEvents'>
export type ListEventsQueryHookOptions<TData, TError> = {
  query?: Omit<UseQueryOptions<ApiOutput<'listEvents'>, TError, TData>, 'queryKey' | 'queryFn'> & {
    queryKey?: QueryKey
  }
}

export const getListEventsQueryKey = (
  params?: ListEventsParams
): readonly ['api', 'listEvents', ApiInput<'listEvents'>] => {
  const input = {
    ...(params === undefined ? {} : { query: params })
  } satisfies ApiInput<'listEvents'>
  return ['api', 'listEvents', input] as const
}

export const getListEventsQueryOptions = <
  TData = ApiOutput<'listEvents'>,
  TError = ListEventsQueryError
>(
  params?: ListEventsParams,
  options?: ListEventsQueryHookOptions<TData, TError>
): UseQueryOptions<ApiOutput<'listEvents'>, TError, TData> & { queryKey: QueryKey } => {
  const input = {
    ...(params === undefined ? {} : { query: params })
  } satisfies ApiInput<'listEvents'>
  const queryOptions = options?.query
  const queryKey = queryOptions?.queryKey ?? getListEventsQueryKey(params)
  const requiredParametersPresent = true

  return {
    ...queryOptions,
    queryKey,
    queryFn: () => getApi()['events']['listEvents'](input),
    enabled: requiredParametersPresent ? queryOptions?.enabled : false
  } as UseQueryOptions<ApiOutput<'listEvents'>, TError, TData> & { queryKey: QueryKey }
}

export function useListEvents<TData = ApiOutput<'listEvents'>, TError = ListEventsQueryError>(
  params?: ListEventsParams,
  options?: ListEventsQueryHookOptions<TData, TError>
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getListEventsQueryOptions(params, options)
  const query = useQuery(queryOptions) as UseQueryResult<TData, TError>
  return withQueryKey(query, queryOptions.queryKey)
}

export type CreateEventMutationVariables = { data: NonNullable<ApiInput<'createEvent'>['body']> }
export type CreateEventMutationResult = ApiOutput<'createEvent'>
export type CreateEventMutationBody = NonNullable<ApiInput<'createEvent'>['body']>
export type CreateEventMutationError = ApiOperationError<'createEvent'>
export type CreateEventMutationHookOptions<TError, TContext> = {
  mutation?: UseMutationOptions<
    ApiOutput<'createEvent'>,
    TError,
    CreateEventMutationVariables,
    TContext
  >
}

export const getCreateEventMutationOptions = <
  TError = CreateEventMutationError,
  TContext = unknown
>(
  options?: CreateEventMutationHookOptions<TError, TContext>
): UseMutationOptions<ApiOutput<'createEvent'>, TError, CreateEventMutationVariables, TContext> => {
  const mutationOptions = options?.mutation
  const mutationKey = mutationOptions?.mutationKey ?? ['api', 'createEvent']
  const mutationFn: MutationFunction<ApiOutput<'createEvent'>, CreateEventMutationVariables> = (
    variables
  ) => {
    const input = { body: variables.data } satisfies ApiInput<'createEvent'>
    return getApi()['events']['createEvent'](input)
  }

  return { mutationKey, mutationFn, ...mutationOptions }
}

export const useCreateEvent = <TError = CreateEventMutationError, TContext = unknown>(
  options?: CreateEventMutationHookOptions<TError, TContext>
): UseMutationResult<ApiOutput<'createEvent'>, TError, CreateEventMutationVariables, TContext> =>
  useMutation(getCreateEventMutationOptions(options))

export type ImportEventsIcalMutationVariables = void
export type ImportEventsIcalMutationResult = ApiOutput<'importEventsIcal'>

export type ImportEventsIcalMutationError = ApiOperationError<'importEventsIcal'>
export type ImportEventsIcalMutationHookOptions<TError, TContext> = {
  mutation?: UseMutationOptions<
    ApiOutput<'importEventsIcal'>,
    TError,
    ImportEventsIcalMutationVariables,
    TContext
  >
}

export const getImportEventsIcalMutationOptions = <
  TError = ImportEventsIcalMutationError,
  TContext = unknown
>(
  options?: ImportEventsIcalMutationHookOptions<TError, TContext>
): UseMutationOptions<
  ApiOutput<'importEventsIcal'>,
  TError,
  ImportEventsIcalMutationVariables,
  TContext
> => {
  const mutationOptions = options?.mutation
  const mutationKey = mutationOptions?.mutationKey ?? ['api', 'importEventsIcal']
  const mutationFn: MutationFunction<
    ApiOutput<'importEventsIcal'>,
    ImportEventsIcalMutationVariables
  > = () => {
    const input = {} satisfies ApiInput<'importEventsIcal'>
    return getApi()['events']['importEventsIcal'](input)
  }

  return { mutationKey, mutationFn, ...mutationOptions }
}

export const useImportEventsIcal = <TError = ImportEventsIcalMutationError, TContext = unknown>(
  options?: ImportEventsIcalMutationHookOptions<TError, TContext>
): UseMutationResult<
  ApiOutput<'importEventsIcal'>,
  TError,
  ImportEventsIcalMutationVariables,
  TContext
> => useMutation(getImportEventsIcalMutationOptions(options))

export type GetEventQueryResult = ApiOutput<'getEvent'>
export type GetEventQueryError = ApiOperationError<'getEvent'>
export type GetEventQueryHookOptions<TData, TError> = {
  query?: Omit<UseQueryOptions<ApiOutput<'getEvent'>, TError, TData>, 'queryKey' | 'queryFn'> & {
    queryKey?: QueryKey
  }
}

export const getGetEventQueryKey = (
  id: ApiInput<'getEvent'>['path']['id']
): readonly ['api', 'getEvent', ApiInput<'getEvent'>] => {
  const input = { path: { id: id } } satisfies ApiInput<'getEvent'>
  return ['api', 'getEvent', input] as const
}

export const getGetEventQueryOptions = <TData = ApiOutput<'getEvent'>, TError = GetEventQueryError>(
  id: ApiInput<'getEvent'>['path']['id'],
  options?: GetEventQueryHookOptions<TData, TError>
): UseQueryOptions<ApiOutput<'getEvent'>, TError, TData> & { queryKey: QueryKey } => {
  const input = { path: { id: id } } satisfies ApiInput<'getEvent'>
  const queryOptions = options?.query
  const queryKey = queryOptions?.queryKey ?? getGetEventQueryKey(id)
  const requiredParametersPresent = isDefined(id)

  return {
    ...queryOptions,
    queryKey,
    queryFn: () => getApi()['events']['getEvent'](input),
    enabled: requiredParametersPresent ? queryOptions?.enabled : false
  } as UseQueryOptions<ApiOutput<'getEvent'>, TError, TData> & { queryKey: QueryKey }
}

export function useGetEvent<TData = ApiOutput<'getEvent'>, TError = GetEventQueryError>(
  id: ApiInput<'getEvent'>['path']['id'],
  options?: GetEventQueryHookOptions<TData, TError>
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getGetEventQueryOptions(id, options)
  const query = useQuery(queryOptions) as UseQueryResult<TData, TError>
  return withQueryKey(query, queryOptions.queryKey)
}

export type UpdateEventMutationVariables = {
  id: ApiInput<'updateEvent'>['path']['id']
  data: NonNullable<ApiInput<'updateEvent'>['body']>
}
export type UpdateEventMutationResult = ApiOutput<'updateEvent'>
export type UpdateEventMutationBody = NonNullable<ApiInput<'updateEvent'>['body']>
export type UpdateEventMutationError = ApiOperationError<'updateEvent'>
export type UpdateEventMutationHookOptions<TError, TContext> = {
  mutation?: UseMutationOptions<
    ApiOutput<'updateEvent'>,
    TError,
    UpdateEventMutationVariables,
    TContext
  >
}

export const getUpdateEventMutationOptions = <
  TError = UpdateEventMutationError,
  TContext = unknown
>(
  options?: UpdateEventMutationHookOptions<TError, TContext>
): UseMutationOptions<ApiOutput<'updateEvent'>, TError, UpdateEventMutationVariables, TContext> => {
  const mutationOptions = options?.mutation
  const mutationKey = mutationOptions?.mutationKey ?? ['api', 'updateEvent']
  const mutationFn: MutationFunction<ApiOutput<'updateEvent'>, UpdateEventMutationVariables> = (
    variables
  ) => {
    const input = {
      path: { id: variables.id },
      body: variables.data
    } satisfies ApiInput<'updateEvent'>
    return getApi()['events']['updateEvent'](input)
  }

  return { mutationKey, mutationFn, ...mutationOptions }
}

export const useUpdateEvent = <TError = UpdateEventMutationError, TContext = unknown>(
  options?: UpdateEventMutationHookOptions<TError, TContext>
): UseMutationResult<ApiOutput<'updateEvent'>, TError, UpdateEventMutationVariables, TContext> =>
  useMutation(getUpdateEventMutationOptions(options))

export type DeleteEventMutationVariables = { id: ApiInput<'deleteEvent'>['path']['id'] }
export type DeleteEventMutationResult = ApiOutput<'deleteEvent'>

export type DeleteEventMutationError = ApiOperationError<'deleteEvent'>
export type DeleteEventMutationHookOptions<TError, TContext> = {
  mutation?: UseMutationOptions<
    ApiOutput<'deleteEvent'>,
    TError,
    DeleteEventMutationVariables,
    TContext
  >
}

export const getDeleteEventMutationOptions = <
  TError = DeleteEventMutationError,
  TContext = unknown
>(
  options?: DeleteEventMutationHookOptions<TError, TContext>
): UseMutationOptions<ApiOutput<'deleteEvent'>, TError, DeleteEventMutationVariables, TContext> => {
  const mutationOptions = options?.mutation
  const mutationKey = mutationOptions?.mutationKey ?? ['api', 'deleteEvent']
  const mutationFn: MutationFunction<ApiOutput<'deleteEvent'>, DeleteEventMutationVariables> = (
    variables
  ) => {
    const input = { path: { id: variables.id } } satisfies ApiInput<'deleteEvent'>
    return getApi()['events']['deleteEvent'](input)
  }

  return { mutationKey, mutationFn, ...mutationOptions }
}

export const useDeleteEvent = <TError = DeleteEventMutationError, TContext = unknown>(
  options?: DeleteEventMutationHookOptions<TError, TContext>
): UseMutationResult<ApiOutput<'deleteEvent'>, TError, DeleteEventMutationVariables, TContext> =>
  useMutation(getDeleteEventMutationOptions(options))

export type ListGradesParams = NonNullable<ApiInput<'listGrades'>['query']>
export type ListGradesQueryResult = ApiOutput<'listGrades'>
export type ListGradesQueryError = ApiOperationError<'listGrades'>
export type ListGradesQueryHookOptions<TData, TError> = {
  query?: Omit<UseQueryOptions<ApiOutput<'listGrades'>, TError, TData>, 'queryKey' | 'queryFn'> & {
    queryKey?: QueryKey
  }
}

export const getListGradesQueryKey = (
  params?: ListGradesParams
): readonly ['api', 'listGrades', ApiInput<'listGrades'>] => {
  const input = {
    ...(params === undefined ? {} : { query: params })
  } satisfies ApiInput<'listGrades'>
  return ['api', 'listGrades', input] as const
}

export const getListGradesQueryOptions = <
  TData = ApiOutput<'listGrades'>,
  TError = ListGradesQueryError
>(
  params?: ListGradesParams,
  options?: ListGradesQueryHookOptions<TData, TError>
): UseQueryOptions<ApiOutput<'listGrades'>, TError, TData> & { queryKey: QueryKey } => {
  const input = {
    ...(params === undefined ? {} : { query: params })
  } satisfies ApiInput<'listGrades'>
  const queryOptions = options?.query
  const queryKey = queryOptions?.queryKey ?? getListGradesQueryKey(params)
  const requiredParametersPresent = true

  return {
    ...queryOptions,
    queryKey,
    queryFn: () => getApi()['grades']['listGrades'](input),
    enabled: requiredParametersPresent ? queryOptions?.enabled : false
  } as UseQueryOptions<ApiOutput<'listGrades'>, TError, TData> & { queryKey: QueryKey }
}

export function useListGrades<TData = ApiOutput<'listGrades'>, TError = ListGradesQueryError>(
  params?: ListGradesParams,
  options?: ListGradesQueryHookOptions<TData, TError>
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getListGradesQueryOptions(params, options)
  const query = useQuery(queryOptions) as UseQueryResult<TData, TError>
  return withQueryKey(query, queryOptions.queryKey)
}

export type CreateGradeMutationVariables = { data: NonNullable<ApiInput<'createGrade'>['body']> }
export type CreateGradeMutationResult = ApiOutput<'createGrade'>
export type CreateGradeMutationBody = NonNullable<ApiInput<'createGrade'>['body']>
export type CreateGradeMutationError = ApiOperationError<'createGrade'>
export type CreateGradeMutationHookOptions<TError, TContext> = {
  mutation?: UseMutationOptions<
    ApiOutput<'createGrade'>,
    TError,
    CreateGradeMutationVariables,
    TContext
  >
}

export const getCreateGradeMutationOptions = <
  TError = CreateGradeMutationError,
  TContext = unknown
>(
  options?: CreateGradeMutationHookOptions<TError, TContext>
): UseMutationOptions<ApiOutput<'createGrade'>, TError, CreateGradeMutationVariables, TContext> => {
  const mutationOptions = options?.mutation
  const mutationKey = mutationOptions?.mutationKey ?? ['api', 'createGrade']
  const mutationFn: MutationFunction<ApiOutput<'createGrade'>, CreateGradeMutationVariables> = (
    variables
  ) => {
    const input = { body: variables.data } satisfies ApiInput<'createGrade'>
    return getApi()['grades']['createGrade'](input)
  }

  return { mutationKey, mutationFn, ...mutationOptions }
}

export const useCreateGrade = <TError = CreateGradeMutationError, TContext = unknown>(
  options?: CreateGradeMutationHookOptions<TError, TContext>
): UseMutationResult<ApiOutput<'createGrade'>, TError, CreateGradeMutationVariables, TContext> =>
  useMutation(getCreateGradeMutationOptions(options))

export type ImportGradesCsvMutationVariables = void
export type ImportGradesCsvMutationResult = ApiOutput<'importGradesCsv'>

export type ImportGradesCsvMutationError = ApiOperationError<'importGradesCsv'>
export type ImportGradesCsvMutationHookOptions<TError, TContext> = {
  mutation?: UseMutationOptions<
    ApiOutput<'importGradesCsv'>,
    TError,
    ImportGradesCsvMutationVariables,
    TContext
  >
}

export const getImportGradesCsvMutationOptions = <
  TError = ImportGradesCsvMutationError,
  TContext = unknown
>(
  options?: ImportGradesCsvMutationHookOptions<TError, TContext>
): UseMutationOptions<
  ApiOutput<'importGradesCsv'>,
  TError,
  ImportGradesCsvMutationVariables,
  TContext
> => {
  const mutationOptions = options?.mutation
  const mutationKey = mutationOptions?.mutationKey ?? ['api', 'importGradesCsv']
  const mutationFn: MutationFunction<
    ApiOutput<'importGradesCsv'>,
    ImportGradesCsvMutationVariables
  > = () => {
    const input = {} satisfies ApiInput<'importGradesCsv'>
    return getApi()['grades']['importGradesCsv'](input)
  }

  return { mutationKey, mutationFn, ...mutationOptions }
}

export const useImportGradesCsv = <TError = ImportGradesCsvMutationError, TContext = unknown>(
  options?: ImportGradesCsvMutationHookOptions<TError, TContext>
): UseMutationResult<
  ApiOutput<'importGradesCsv'>,
  TError,
  ImportGradesCsvMutationVariables,
  TContext
> => useMutation(getImportGradesCsvMutationOptions(options))

export type GetGradeStatsQueryResult = ApiOutput<'getGradeStats'>
export type GetGradeStatsQueryError = ApiOperationError<'getGradeStats'>
export type GetGradeStatsQueryHookOptions<TData, TError> = {
  query?: Omit<
    UseQueryOptions<ApiOutput<'getGradeStats'>, TError, TData>,
    'queryKey' | 'queryFn'
  > & {
    queryKey?: QueryKey
  }
}

export const getGetGradeStatsQueryKey = (): readonly [
  'api',
  'getGradeStats',
  ApiInput<'getGradeStats'>
] => {
  const input = {} satisfies ApiInput<'getGradeStats'>
  return ['api', 'getGradeStats', input] as const
}

export const getGetGradeStatsQueryOptions = <
  TData = ApiOutput<'getGradeStats'>,
  TError = GetGradeStatsQueryError
>(
  options?: GetGradeStatsQueryHookOptions<TData, TError>
): UseQueryOptions<ApiOutput<'getGradeStats'>, TError, TData> & { queryKey: QueryKey } => {
  const input = {} satisfies ApiInput<'getGradeStats'>
  const queryOptions = options?.query
  const queryKey = queryOptions?.queryKey ?? getGetGradeStatsQueryKey()
  const requiredParametersPresent = true

  return {
    ...queryOptions,
    queryKey,
    queryFn: () => getApi()['grades']['getGradeStats'](input),
    enabled: requiredParametersPresent ? queryOptions?.enabled : false
  } as UseQueryOptions<ApiOutput<'getGradeStats'>, TError, TData> & { queryKey: QueryKey }
}

export function useGetGradeStats<
  TData = ApiOutput<'getGradeStats'>,
  TError = GetGradeStatsQueryError
>(
  options?: GetGradeStatsQueryHookOptions<TData, TError>
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getGetGradeStatsQueryOptions(options)
  const query = useQuery(queryOptions) as UseQueryResult<TData, TError>
  return withQueryKey(query, queryOptions.queryKey)
}

export type UpdateGradeMutationVariables = {
  id: ApiInput<'updateGrade'>['path']['id']
  data: NonNullable<ApiInput<'updateGrade'>['body']>
}
export type UpdateGradeMutationResult = ApiOutput<'updateGrade'>
export type UpdateGradeMutationBody = NonNullable<ApiInput<'updateGrade'>['body']>
export type UpdateGradeMutationError = ApiOperationError<'updateGrade'>
export type UpdateGradeMutationHookOptions<TError, TContext> = {
  mutation?: UseMutationOptions<
    ApiOutput<'updateGrade'>,
    TError,
    UpdateGradeMutationVariables,
    TContext
  >
}

export const getUpdateGradeMutationOptions = <
  TError = UpdateGradeMutationError,
  TContext = unknown
>(
  options?: UpdateGradeMutationHookOptions<TError, TContext>
): UseMutationOptions<ApiOutput<'updateGrade'>, TError, UpdateGradeMutationVariables, TContext> => {
  const mutationOptions = options?.mutation
  const mutationKey = mutationOptions?.mutationKey ?? ['api', 'updateGrade']
  const mutationFn: MutationFunction<ApiOutput<'updateGrade'>, UpdateGradeMutationVariables> = (
    variables
  ) => {
    const input = {
      path: { id: variables.id },
      body: variables.data
    } satisfies ApiInput<'updateGrade'>
    return getApi()['grades']['updateGrade'](input)
  }

  return { mutationKey, mutationFn, ...mutationOptions }
}

export const useUpdateGrade = <TError = UpdateGradeMutationError, TContext = unknown>(
  options?: UpdateGradeMutationHookOptions<TError, TContext>
): UseMutationResult<ApiOutput<'updateGrade'>, TError, UpdateGradeMutationVariables, TContext> =>
  useMutation(getUpdateGradeMutationOptions(options))

export type DeleteGradeMutationVariables = { id: ApiInput<'deleteGrade'>['path']['id'] }
export type DeleteGradeMutationResult = ApiOutput<'deleteGrade'>

export type DeleteGradeMutationError = ApiOperationError<'deleteGrade'>
export type DeleteGradeMutationHookOptions<TError, TContext> = {
  mutation?: UseMutationOptions<
    ApiOutput<'deleteGrade'>,
    TError,
    DeleteGradeMutationVariables,
    TContext
  >
}

export const getDeleteGradeMutationOptions = <
  TError = DeleteGradeMutationError,
  TContext = unknown
>(
  options?: DeleteGradeMutationHookOptions<TError, TContext>
): UseMutationOptions<ApiOutput<'deleteGrade'>, TError, DeleteGradeMutationVariables, TContext> => {
  const mutationOptions = options?.mutation
  const mutationKey = mutationOptions?.mutationKey ?? ['api', 'deleteGrade']
  const mutationFn: MutationFunction<ApiOutput<'deleteGrade'>, DeleteGradeMutationVariables> = (
    variables
  ) => {
    const input = { path: { id: variables.id } } satisfies ApiInput<'deleteGrade'>
    return getApi()['grades']['deleteGrade'](input)
  }

  return { mutationKey, mutationFn, ...mutationOptions }
}

export const useDeleteGrade = <TError = DeleteGradeMutationError, TContext = unknown>(
  options?: DeleteGradeMutationHookOptions<TError, TContext>
): UseMutationResult<ApiOutput<'deleteGrade'>, TError, DeleteGradeMutationVariables, TContext> =>
  useMutation(getDeleteGradeMutationOptions(options))

export type ListTimetableEntriesQueryResult = ApiOutput<'listTimetableEntries'>
export type ListTimetableEntriesQueryError = ApiOperationError<'listTimetableEntries'>
export type ListTimetableEntriesQueryHookOptions<TData, TError> = {
  query?: Omit<
    UseQueryOptions<ApiOutput<'listTimetableEntries'>, TError, TData>,
    'queryKey' | 'queryFn'
  > & {
    queryKey?: QueryKey
  }
}

export const getListTimetableEntriesQueryKey = (): readonly [
  'api',
  'listTimetableEntries',
  ApiInput<'listTimetableEntries'>
] => {
  const input = {} satisfies ApiInput<'listTimetableEntries'>
  return ['api', 'listTimetableEntries', input] as const
}

export const getListTimetableEntriesQueryOptions = <
  TData = ApiOutput<'listTimetableEntries'>,
  TError = ListTimetableEntriesQueryError
>(
  options?: ListTimetableEntriesQueryHookOptions<TData, TError>
): UseQueryOptions<ApiOutput<'listTimetableEntries'>, TError, TData> & { queryKey: QueryKey } => {
  const input = {} satisfies ApiInput<'listTimetableEntries'>
  const queryOptions = options?.query
  const queryKey = queryOptions?.queryKey ?? getListTimetableEntriesQueryKey()
  const requiredParametersPresent = true

  return {
    ...queryOptions,
    queryKey,
    queryFn: () => getApi()['timetable']['listTimetableEntries'](input),
    enabled: requiredParametersPresent ? queryOptions?.enabled : false
  } as UseQueryOptions<ApiOutput<'listTimetableEntries'>, TError, TData> & { queryKey: QueryKey }
}

export function useListTimetableEntries<
  TData = ApiOutput<'listTimetableEntries'>,
  TError = ListTimetableEntriesQueryError
>(
  options?: ListTimetableEntriesQueryHookOptions<TData, TError>
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getListTimetableEntriesQueryOptions(options)
  const query = useQuery(queryOptions) as UseQueryResult<TData, TError>
  return withQueryKey(query, queryOptions.queryKey)
}

export type AddTimetableEntryMutationVariables = {
  data: NonNullable<ApiInput<'addTimetableEntry'>['body']>
}
export type AddTimetableEntryMutationResult = ApiOutput<'addTimetableEntry'>
export type AddTimetableEntryMutationBody = NonNullable<ApiInput<'addTimetableEntry'>['body']>
export type AddTimetableEntryMutationError = ApiOperationError<'addTimetableEntry'>
export type AddTimetableEntryMutationHookOptions<TError, TContext> = {
  mutation?: UseMutationOptions<
    ApiOutput<'addTimetableEntry'>,
    TError,
    AddTimetableEntryMutationVariables,
    TContext
  >
}

export const getAddTimetableEntryMutationOptions = <
  TError = AddTimetableEntryMutationError,
  TContext = unknown
>(
  options?: AddTimetableEntryMutationHookOptions<TError, TContext>
): UseMutationOptions<
  ApiOutput<'addTimetableEntry'>,
  TError,
  AddTimetableEntryMutationVariables,
  TContext
> => {
  const mutationOptions = options?.mutation
  const mutationKey = mutationOptions?.mutationKey ?? ['api', 'addTimetableEntry']
  const mutationFn: MutationFunction<
    ApiOutput<'addTimetableEntry'>,
    AddTimetableEntryMutationVariables
  > = (variables) => {
    const input = { body: variables.data } satisfies ApiInput<'addTimetableEntry'>
    return getApi()['timetable']['addTimetableEntry'](input)
  }

  return { mutationKey, mutationFn, ...mutationOptions }
}

export const useAddTimetableEntry = <TError = AddTimetableEntryMutationError, TContext = unknown>(
  options?: AddTimetableEntryMutationHookOptions<TError, TContext>
): UseMutationResult<
  ApiOutput<'addTimetableEntry'>,
  TError,
  AddTimetableEntryMutationVariables,
  TContext
> => useMutation(getAddTimetableEntryMutationOptions(options))

export type RemoveTimetableEntryMutationVariables = {
  id: ApiInput<'removeTimetableEntry'>['path']['id']
}
export type RemoveTimetableEntryMutationResult = ApiOutput<'removeTimetableEntry'>

export type RemoveTimetableEntryMutationError = ApiOperationError<'removeTimetableEntry'>
export type RemoveTimetableEntryMutationHookOptions<TError, TContext> = {
  mutation?: UseMutationOptions<
    ApiOutput<'removeTimetableEntry'>,
    TError,
    RemoveTimetableEntryMutationVariables,
    TContext
  >
}

export const getRemoveTimetableEntryMutationOptions = <
  TError = RemoveTimetableEntryMutationError,
  TContext = unknown
>(
  options?: RemoveTimetableEntryMutationHookOptions<TError, TContext>
): UseMutationOptions<
  ApiOutput<'removeTimetableEntry'>,
  TError,
  RemoveTimetableEntryMutationVariables,
  TContext
> => {
  const mutationOptions = options?.mutation
  const mutationKey = mutationOptions?.mutationKey ?? ['api', 'removeTimetableEntry']
  const mutationFn: MutationFunction<
    ApiOutput<'removeTimetableEntry'>,
    RemoveTimetableEntryMutationVariables
  > = (variables) => {
    const input = { path: { id: variables.id } } satisfies ApiInput<'removeTimetableEntry'>
    return getApi()['timetable']['removeTimetableEntry'](input)
  }

  return { mutationKey, mutationFn, ...mutationOptions }
}

export const useRemoveTimetableEntry = <
  TError = RemoveTimetableEntryMutationError,
  TContext = unknown
>(
  options?: RemoveTimetableEntryMutationHookOptions<TError, TContext>
): UseMutationResult<
  ApiOutput<'removeTimetableEntry'>,
  TError,
  RemoveTimetableEntryMutationVariables,
  TContext
> => useMutation(getRemoveTimetableEntryMutationOptions(options))

export type ClearTimetableMutationVariables = void
export type ClearTimetableMutationResult = ApiOutput<'clearTimetable'>

export type ClearTimetableMutationError = ApiOperationError<'clearTimetable'>
export type ClearTimetableMutationHookOptions<TError, TContext> = {
  mutation?: UseMutationOptions<
    ApiOutput<'clearTimetable'>,
    TError,
    ClearTimetableMutationVariables,
    TContext
  >
}

export const getClearTimetableMutationOptions = <
  TError = ClearTimetableMutationError,
  TContext = unknown
>(
  options?: ClearTimetableMutationHookOptions<TError, TContext>
): UseMutationOptions<
  ApiOutput<'clearTimetable'>,
  TError,
  ClearTimetableMutationVariables,
  TContext
> => {
  const mutationOptions = options?.mutation
  const mutationKey = mutationOptions?.mutationKey ?? ['api', 'clearTimetable']
  const mutationFn: MutationFunction<
    ApiOutput<'clearTimetable'>,
    ClearTimetableMutationVariables
  > = () => {
    const input = {} satisfies ApiInput<'clearTimetable'>
    return getApi()['timetable']['clearTimetable'](input)
  }

  return { mutationKey, mutationFn, ...mutationOptions }
}

export const useClearTimetable = <TError = ClearTimetableMutationError, TContext = unknown>(
  options?: ClearTimetableMutationHookOptions<TError, TContext>
): UseMutationResult<
  ApiOutput<'clearTimetable'>,
  TError,
  ClearTimetableMutationVariables,
  TContext
> => useMutation(getClearTimetableMutationOptions(options))

export type ListTimetablePresetsQueryResult = ApiOutput<'listTimetablePresets'>
export type ListTimetablePresetsQueryError = ApiOperationError<'listTimetablePresets'>
export type ListTimetablePresetsQueryHookOptions<TData, TError> = {
  query?: Omit<
    UseQueryOptions<ApiOutput<'listTimetablePresets'>, TError, TData>,
    'queryKey' | 'queryFn'
  > & {
    queryKey?: QueryKey
  }
}

export const getListTimetablePresetsQueryKey = (): readonly [
  'api',
  'listTimetablePresets',
  ApiInput<'listTimetablePresets'>
] => {
  const input = {} satisfies ApiInput<'listTimetablePresets'>
  return ['api', 'listTimetablePresets', input] as const
}

export const getListTimetablePresetsQueryOptions = <
  TData = ApiOutput<'listTimetablePresets'>,
  TError = ListTimetablePresetsQueryError
>(
  options?: ListTimetablePresetsQueryHookOptions<TData, TError>
): UseQueryOptions<ApiOutput<'listTimetablePresets'>, TError, TData> & { queryKey: QueryKey } => {
  const input = {} satisfies ApiInput<'listTimetablePresets'>
  const queryOptions = options?.query
  const queryKey = queryOptions?.queryKey ?? getListTimetablePresetsQueryKey()
  const requiredParametersPresent = true

  return {
    ...queryOptions,
    queryKey,
    queryFn: () => getApi()['timetable']['listTimetablePresets'](input),
    enabled: requiredParametersPresent ? queryOptions?.enabled : false
  } as UseQueryOptions<ApiOutput<'listTimetablePresets'>, TError, TData> & { queryKey: QueryKey }
}

export function useListTimetablePresets<
  TData = ApiOutput<'listTimetablePresets'>,
  TError = ListTimetablePresetsQueryError
>(
  options?: ListTimetablePresetsQueryHookOptions<TData, TError>
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getListTimetablePresetsQueryOptions(options)
  const query = useQuery(queryOptions) as UseQueryResult<TData, TError>
  return withQueryKey(query, queryOptions.queryKey)
}

export type GetTimetablePresetEntriesQueryResult = ApiOutput<'getTimetablePresetEntries'>
export type GetTimetablePresetEntriesQueryError = ApiOperationError<'getTimetablePresetEntries'>
export type GetTimetablePresetEntriesQueryHookOptions<TData, TError> = {
  query?: Omit<
    UseQueryOptions<ApiOutput<'getTimetablePresetEntries'>, TError, TData>,
    'queryKey' | 'queryFn'
  > & {
    queryKey?: QueryKey
  }
}

export const getGetTimetablePresetEntriesQueryKey = (
  presetId: ApiInput<'getTimetablePresetEntries'>['path']['presetId']
): readonly ['api', 'getTimetablePresetEntries', ApiInput<'getTimetablePresetEntries'>] => {
  const input = { path: { presetId: presetId } } satisfies ApiInput<'getTimetablePresetEntries'>
  return ['api', 'getTimetablePresetEntries', input] as const
}

export const getGetTimetablePresetEntriesQueryOptions = <
  TData = ApiOutput<'getTimetablePresetEntries'>,
  TError = GetTimetablePresetEntriesQueryError
>(
  presetId: ApiInput<'getTimetablePresetEntries'>['path']['presetId'],
  options?: GetTimetablePresetEntriesQueryHookOptions<TData, TError>
): UseQueryOptions<ApiOutput<'getTimetablePresetEntries'>, TError, TData> & {
  queryKey: QueryKey
} => {
  const input = { path: { presetId: presetId } } satisfies ApiInput<'getTimetablePresetEntries'>
  const queryOptions = options?.query
  const queryKey = queryOptions?.queryKey ?? getGetTimetablePresetEntriesQueryKey(presetId)
  const requiredParametersPresent = isDefined(presetId)

  return {
    ...queryOptions,
    queryKey,
    queryFn: () => getApi()['timetable']['getTimetablePresetEntries'](input),
    enabled: requiredParametersPresent ? queryOptions?.enabled : false
  } as UseQueryOptions<ApiOutput<'getTimetablePresetEntries'>, TError, TData> & {
    queryKey: QueryKey
  }
}

export function useGetTimetablePresetEntries<
  TData = ApiOutput<'getTimetablePresetEntries'>,
  TError = GetTimetablePresetEntriesQueryError
>(
  presetId: ApiInput<'getTimetablePresetEntries'>['path']['presetId'],
  options?: GetTimetablePresetEntriesQueryHookOptions<TData, TError>
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getGetTimetablePresetEntriesQueryOptions(presetId, options)
  const query = useQuery(queryOptions) as UseQueryResult<TData, TError>
  return withQueryKey(query, queryOptions.queryKey)
}

export type ListStudyProgramsQueryResult = ApiOutput<'listStudyPrograms'>
export type ListStudyProgramsQueryError = ApiOperationError<'listStudyPrograms'>
export type ListStudyProgramsQueryHookOptions<TData, TError> = {
  query?: Omit<
    UseQueryOptions<ApiOutput<'listStudyPrograms'>, TError, TData>,
    'queryKey' | 'queryFn'
  > & {
    queryKey?: QueryKey
  }
}

export const getListStudyProgramsQueryKey = (): readonly [
  'api',
  'listStudyPrograms',
  ApiInput<'listStudyPrograms'>
] => {
  const input = {} satisfies ApiInput<'listStudyPrograms'>
  return ['api', 'listStudyPrograms', input] as const
}

export const getListStudyProgramsQueryOptions = <
  TData = ApiOutput<'listStudyPrograms'>,
  TError = ListStudyProgramsQueryError
>(
  options?: ListStudyProgramsQueryHookOptions<TData, TError>
): UseQueryOptions<ApiOutput<'listStudyPrograms'>, TError, TData> & { queryKey: QueryKey } => {
  const input = {} satisfies ApiInput<'listStudyPrograms'>
  const queryOptions = options?.query
  const queryKey = queryOptions?.queryKey ?? getListStudyProgramsQueryKey()
  const requiredParametersPresent = true

  return {
    ...queryOptions,
    queryKey,
    queryFn: () => getApi()['studyPrograms']['listStudyPrograms'](input),
    enabled: requiredParametersPresent ? queryOptions?.enabled : false
  } as UseQueryOptions<ApiOutput<'listStudyPrograms'>, TError, TData> & { queryKey: QueryKey }
}

export function useListStudyPrograms<
  TData = ApiOutput<'listStudyPrograms'>,
  TError = ListStudyProgramsQueryError
>(
  options?: ListStudyProgramsQueryHookOptions<TData, TError>
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getListStudyProgramsQueryOptions(options)
  const query = useQuery(queryOptions) as UseQueryResult<TData, TError>
  return withQueryKey(query, queryOptions.queryKey)
}

export type RefreshStudyCatalogMutationVariables = void
export type RefreshStudyCatalogMutationResult = ApiOutput<'refreshStudyCatalog'>

export type RefreshStudyCatalogMutationError = ApiOperationError<'refreshStudyCatalog'>
export type RefreshStudyCatalogMutationHookOptions<TError, TContext> = {
  mutation?: UseMutationOptions<
    ApiOutput<'refreshStudyCatalog'>,
    TError,
    RefreshStudyCatalogMutationVariables,
    TContext
  >
}

export const getRefreshStudyCatalogMutationOptions = <
  TError = RefreshStudyCatalogMutationError,
  TContext = unknown
>(
  options?: RefreshStudyCatalogMutationHookOptions<TError, TContext>
): UseMutationOptions<
  ApiOutput<'refreshStudyCatalog'>,
  TError,
  RefreshStudyCatalogMutationVariables,
  TContext
> => {
  const mutationOptions = options?.mutation
  const mutationKey = mutationOptions?.mutationKey ?? ['api', 'refreshStudyCatalog']
  const mutationFn: MutationFunction<
    ApiOutput<'refreshStudyCatalog'>,
    RefreshStudyCatalogMutationVariables
  > = () => {
    const input = {} satisfies ApiInput<'refreshStudyCatalog'>
    return getApi()['studyPrograms']['refreshStudyCatalog'](input)
  }

  return { mutationKey, mutationFn, ...mutationOptions }
}

export const useRefreshStudyCatalog = <
  TError = RefreshStudyCatalogMutationError,
  TContext = unknown
>(
  options?: RefreshStudyCatalogMutationHookOptions<TError, TContext>
): UseMutationResult<
  ApiOutput<'refreshStudyCatalog'>,
  TError,
  RefreshStudyCatalogMutationVariables,
  TContext
> => useMutation(getRefreshStudyCatalogMutationOptions(options))

export type ListStudyProgramCoursesQueryResult = ApiOutput<'listStudyProgramCourses'>
export type ListStudyProgramCoursesQueryError = ApiOperationError<'listStudyProgramCourses'>
export type ListStudyProgramCoursesQueryHookOptions<TData, TError> = {
  query?: Omit<
    UseQueryOptions<ApiOutput<'listStudyProgramCourses'>, TError, TData>,
    'queryKey' | 'queryFn'
  > & {
    queryKey?: QueryKey
  }
}

export const getListStudyProgramCoursesQueryKey = (
  id: ApiInput<'listStudyProgramCourses'>['path']['id']
): readonly ['api', 'listStudyProgramCourses', ApiInput<'listStudyProgramCourses'>] => {
  const input = { path: { id: id } } satisfies ApiInput<'listStudyProgramCourses'>
  return ['api', 'listStudyProgramCourses', input] as const
}

export const getListStudyProgramCoursesQueryOptions = <
  TData = ApiOutput<'listStudyProgramCourses'>,
  TError = ListStudyProgramCoursesQueryError
>(
  id: ApiInput<'listStudyProgramCourses'>['path']['id'],
  options?: ListStudyProgramCoursesQueryHookOptions<TData, TError>
): UseQueryOptions<ApiOutput<'listStudyProgramCourses'>, TError, TData> & {
  queryKey: QueryKey
} => {
  const input = { path: { id: id } } satisfies ApiInput<'listStudyProgramCourses'>
  const queryOptions = options?.query
  const queryKey = queryOptions?.queryKey ?? getListStudyProgramCoursesQueryKey(id)
  const requiredParametersPresent = isDefined(id)

  return {
    ...queryOptions,
    queryKey,
    queryFn: () => getApi()['studyPrograms']['listStudyProgramCourses'](input),
    enabled: requiredParametersPresent ? queryOptions?.enabled : false
  } as UseQueryOptions<ApiOutput<'listStudyProgramCourses'>, TError, TData> & { queryKey: QueryKey }
}

export function useListStudyProgramCourses<
  TData = ApiOutput<'listStudyProgramCourses'>,
  TError = ListStudyProgramCoursesQueryError
>(
  id: ApiInput<'listStudyProgramCourses'>['path']['id'],
  options?: ListStudyProgramCoursesQueryHookOptions<TData, TError>
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getListStudyProgramCoursesQueryOptions(id, options)
  const query = useQuery(queryOptions) as UseQueryResult<TData, TError>
  return withQueryKey(query, queryOptions.queryKey)
}

export type ListGroupsQueryResult = ApiOutput<'listGroups'>
export type ListGroupsQueryError = ApiOperationError<'listGroups'>
export type ListGroupsQueryHookOptions<TData, TError> = {
  query?: Omit<UseQueryOptions<ApiOutput<'listGroups'>, TError, TData>, 'queryKey' | 'queryFn'> & {
    queryKey?: QueryKey
  }
}

export const getListGroupsQueryKey = (): readonly ['api', 'listGroups', ApiInput<'listGroups'>] => {
  const input = {} satisfies ApiInput<'listGroups'>
  return ['api', 'listGroups', input] as const
}

export const getListGroupsQueryOptions = <
  TData = ApiOutput<'listGroups'>,
  TError = ListGroupsQueryError
>(
  options?: ListGroupsQueryHookOptions<TData, TError>
): UseQueryOptions<ApiOutput<'listGroups'>, TError, TData> & { queryKey: QueryKey } => {
  const input = {} satisfies ApiInput<'listGroups'>
  const queryOptions = options?.query
  const queryKey = queryOptions?.queryKey ?? getListGroupsQueryKey()
  const requiredParametersPresent = true

  return {
    ...queryOptions,
    queryKey,
    queryFn: () => getApi()['groups']['listGroups'](input),
    enabled: requiredParametersPresent ? queryOptions?.enabled : false
  } as UseQueryOptions<ApiOutput<'listGroups'>, TError, TData> & { queryKey: QueryKey }
}

export function useListGroups<TData = ApiOutput<'listGroups'>, TError = ListGroupsQueryError>(
  options?: ListGroupsQueryHookOptions<TData, TError>
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getListGroupsQueryOptions(options)
  const query = useQuery(queryOptions) as UseQueryResult<TData, TError>
  return withQueryKey(query, queryOptions.queryKey)
}

export type CreateGroupMutationVariables = { data: NonNullable<ApiInput<'createGroup'>['body']> }
export type CreateGroupMutationResult = ApiOutput<'createGroup'>
export type CreateGroupMutationBody = NonNullable<ApiInput<'createGroup'>['body']>
export type CreateGroupMutationError = ApiOperationError<'createGroup'>
export type CreateGroupMutationHookOptions<TError, TContext> = {
  mutation?: UseMutationOptions<
    ApiOutput<'createGroup'>,
    TError,
    CreateGroupMutationVariables,
    TContext
  >
}

export const getCreateGroupMutationOptions = <
  TError = CreateGroupMutationError,
  TContext = unknown
>(
  options?: CreateGroupMutationHookOptions<TError, TContext>
): UseMutationOptions<ApiOutput<'createGroup'>, TError, CreateGroupMutationVariables, TContext> => {
  const mutationOptions = options?.mutation
  const mutationKey = mutationOptions?.mutationKey ?? ['api', 'createGroup']
  const mutationFn: MutationFunction<ApiOutput<'createGroup'>, CreateGroupMutationVariables> = (
    variables
  ) => {
    const input = { body: variables.data } satisfies ApiInput<'createGroup'>
    return getApi()['groups']['createGroup'](input)
  }

  return { mutationKey, mutationFn, ...mutationOptions }
}

export const useCreateGroup = <TError = CreateGroupMutationError, TContext = unknown>(
  options?: CreateGroupMutationHookOptions<TError, TContext>
): UseMutationResult<ApiOutput<'createGroup'>, TError, CreateGroupMutationVariables, TContext> =>
  useMutation(getCreateGroupMutationOptions(options))

export type GetGroupsActivityQueryResult = ApiOutput<'getGroupsActivity'>
export type GetGroupsActivityQueryError = ApiOperationError<'getGroupsActivity'>
export type GetGroupsActivityQueryHookOptions<TData, TError> = {
  query?: Omit<
    UseQueryOptions<ApiOutput<'getGroupsActivity'>, TError, TData>,
    'queryKey' | 'queryFn'
  > & {
    queryKey?: QueryKey
  }
}

export const getGetGroupsActivityQueryKey = (): readonly [
  'api',
  'getGroupsActivity',
  ApiInput<'getGroupsActivity'>
] => {
  const input = {} satisfies ApiInput<'getGroupsActivity'>
  return ['api', 'getGroupsActivity', input] as const
}

export const getGetGroupsActivityQueryOptions = <
  TData = ApiOutput<'getGroupsActivity'>,
  TError = GetGroupsActivityQueryError
>(
  options?: GetGroupsActivityQueryHookOptions<TData, TError>
): UseQueryOptions<ApiOutput<'getGroupsActivity'>, TError, TData> & { queryKey: QueryKey } => {
  const input = {} satisfies ApiInput<'getGroupsActivity'>
  const queryOptions = options?.query
  const queryKey = queryOptions?.queryKey ?? getGetGroupsActivityQueryKey()
  const requiredParametersPresent = true

  return {
    ...queryOptions,
    queryKey,
    queryFn: () => getApi()['groups']['getGroupsActivity'](input),
    enabled: requiredParametersPresent ? queryOptions?.enabled : false
  } as UseQueryOptions<ApiOutput<'getGroupsActivity'>, TError, TData> & { queryKey: QueryKey }
}

export function useGetGroupsActivity<
  TData = ApiOutput<'getGroupsActivity'>,
  TError = GetGroupsActivityQueryError
>(
  options?: GetGroupsActivityQueryHookOptions<TData, TError>
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getGetGroupsActivityQueryOptions(options)
  const query = useQuery(queryOptions) as UseQueryResult<TData, TError>
  return withQueryKey(query, queryOptions.queryKey)
}

export type ListAllGroupEventsParams = NonNullable<ApiInput<'listAllGroupEvents'>['query']>
export type ListAllGroupEventsQueryResult = ApiOutput<'listAllGroupEvents'>
export type ListAllGroupEventsQueryError = ApiOperationError<'listAllGroupEvents'>
export type ListAllGroupEventsQueryHookOptions<TData, TError> = {
  query?: Omit<
    UseQueryOptions<ApiOutput<'listAllGroupEvents'>, TError, TData>,
    'queryKey' | 'queryFn'
  > & {
    queryKey?: QueryKey
  }
}

export const getListAllGroupEventsQueryKey = (
  params?: ListAllGroupEventsParams
): readonly ['api', 'listAllGroupEvents', ApiInput<'listAllGroupEvents'>] => {
  const input = {
    ...(params === undefined ? {} : { query: params })
  } satisfies ApiInput<'listAllGroupEvents'>
  return ['api', 'listAllGroupEvents', input] as const
}

export const getListAllGroupEventsQueryOptions = <
  TData = ApiOutput<'listAllGroupEvents'>,
  TError = ListAllGroupEventsQueryError
>(
  params?: ListAllGroupEventsParams,
  options?: ListAllGroupEventsQueryHookOptions<TData, TError>
): UseQueryOptions<ApiOutput<'listAllGroupEvents'>, TError, TData> & { queryKey: QueryKey } => {
  const input = {
    ...(params === undefined ? {} : { query: params })
  } satisfies ApiInput<'listAllGroupEvents'>
  const queryOptions = options?.query
  const queryKey = queryOptions?.queryKey ?? getListAllGroupEventsQueryKey(params)
  const requiredParametersPresent = true

  return {
    ...queryOptions,
    queryKey,
    queryFn: () => getApi()['groups']['listAllGroupEvents'](input),
    enabled: requiredParametersPresent ? queryOptions?.enabled : false
  } as UseQueryOptions<ApiOutput<'listAllGroupEvents'>, TError, TData> & { queryKey: QueryKey }
}

export function useListAllGroupEvents<
  TData = ApiOutput<'listAllGroupEvents'>,
  TError = ListAllGroupEventsQueryError
>(
  params?: ListAllGroupEventsParams,
  options?: ListAllGroupEventsQueryHookOptions<TData, TError>
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getListAllGroupEventsQueryOptions(params, options)
  const query = useQuery(queryOptions) as UseQueryResult<TData, TError>
  return withQueryKey(query, queryOptions.queryKey)
}

export type GetGroupQueryResult = ApiOutput<'getGroup'>
export type GetGroupQueryError = ApiOperationError<'getGroup'>
export type GetGroupQueryHookOptions<TData, TError> = {
  query?: Omit<UseQueryOptions<ApiOutput<'getGroup'>, TError, TData>, 'queryKey' | 'queryFn'> & {
    queryKey?: QueryKey
  }
}

export const getGetGroupQueryKey = (
  id: ApiInput<'getGroup'>['path']['id']
): readonly ['api', 'getGroup', ApiInput<'getGroup'>] => {
  const input = { path: { id: id } } satisfies ApiInput<'getGroup'>
  return ['api', 'getGroup', input] as const
}

export const getGetGroupQueryOptions = <TData = ApiOutput<'getGroup'>, TError = GetGroupQueryError>(
  id: ApiInput<'getGroup'>['path']['id'],
  options?: GetGroupQueryHookOptions<TData, TError>
): UseQueryOptions<ApiOutput<'getGroup'>, TError, TData> & { queryKey: QueryKey } => {
  const input = { path: { id: id } } satisfies ApiInput<'getGroup'>
  const queryOptions = options?.query
  const queryKey = queryOptions?.queryKey ?? getGetGroupQueryKey(id)
  const requiredParametersPresent = isDefined(id)

  return {
    ...queryOptions,
    queryKey,
    queryFn: () => getApi()['groups']['getGroup'](input),
    enabled: requiredParametersPresent ? queryOptions?.enabled : false
  } as UseQueryOptions<ApiOutput<'getGroup'>, TError, TData> & { queryKey: QueryKey }
}

export function useGetGroup<TData = ApiOutput<'getGroup'>, TError = GetGroupQueryError>(
  id: ApiInput<'getGroup'>['path']['id'],
  options?: GetGroupQueryHookOptions<TData, TError>
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getGetGroupQueryOptions(id, options)
  const query = useQuery(queryOptions) as UseQueryResult<TData, TError>
  return withQueryKey(query, queryOptions.queryKey)
}

export type UpdateGroupMutationVariables = {
  id: ApiInput<'updateGroup'>['path']['id']
  data: NonNullable<ApiInput<'updateGroup'>['body']>
}
export type UpdateGroupMutationResult = ApiOutput<'updateGroup'>
export type UpdateGroupMutationBody = NonNullable<ApiInput<'updateGroup'>['body']>
export type UpdateGroupMutationError = ApiOperationError<'updateGroup'>
export type UpdateGroupMutationHookOptions<TError, TContext> = {
  mutation?: UseMutationOptions<
    ApiOutput<'updateGroup'>,
    TError,
    UpdateGroupMutationVariables,
    TContext
  >
}

export const getUpdateGroupMutationOptions = <
  TError = UpdateGroupMutationError,
  TContext = unknown
>(
  options?: UpdateGroupMutationHookOptions<TError, TContext>
): UseMutationOptions<ApiOutput<'updateGroup'>, TError, UpdateGroupMutationVariables, TContext> => {
  const mutationOptions = options?.mutation
  const mutationKey = mutationOptions?.mutationKey ?? ['api', 'updateGroup']
  const mutationFn: MutationFunction<ApiOutput<'updateGroup'>, UpdateGroupMutationVariables> = (
    variables
  ) => {
    const input = {
      path: { id: variables.id },
      body: variables.data
    } satisfies ApiInput<'updateGroup'>
    return getApi()['groups']['updateGroup'](input)
  }

  return { mutationKey, mutationFn, ...mutationOptions }
}

export const useUpdateGroup = <TError = UpdateGroupMutationError, TContext = unknown>(
  options?: UpdateGroupMutationHookOptions<TError, TContext>
): UseMutationResult<ApiOutput<'updateGroup'>, TError, UpdateGroupMutationVariables, TContext> =>
  useMutation(getUpdateGroupMutationOptions(options))

export type DeleteGroupMutationVariables = { id: ApiInput<'deleteGroup'>['path']['id'] }
export type DeleteGroupMutationResult = ApiOutput<'deleteGroup'>

export type DeleteGroupMutationError = ApiOperationError<'deleteGroup'>
export type DeleteGroupMutationHookOptions<TError, TContext> = {
  mutation?: UseMutationOptions<
    ApiOutput<'deleteGroup'>,
    TError,
    DeleteGroupMutationVariables,
    TContext
  >
}

export const getDeleteGroupMutationOptions = <
  TError = DeleteGroupMutationError,
  TContext = unknown
>(
  options?: DeleteGroupMutationHookOptions<TError, TContext>
): UseMutationOptions<ApiOutput<'deleteGroup'>, TError, DeleteGroupMutationVariables, TContext> => {
  const mutationOptions = options?.mutation
  const mutationKey = mutationOptions?.mutationKey ?? ['api', 'deleteGroup']
  const mutationFn: MutationFunction<ApiOutput<'deleteGroup'>, DeleteGroupMutationVariables> = (
    variables
  ) => {
    const input = { path: { id: variables.id } } satisfies ApiInput<'deleteGroup'>
    return getApi()['groups']['deleteGroup'](input)
  }

  return { mutationKey, mutationFn, ...mutationOptions }
}

export const useDeleteGroup = <TError = DeleteGroupMutationError, TContext = unknown>(
  options?: DeleteGroupMutationHookOptions<TError, TContext>
): UseMutationResult<ApiOutput<'deleteGroup'>, TError, DeleteGroupMutationVariables, TContext> =>
  useMutation(getDeleteGroupMutationOptions(options))

export type CreateGroupInviteMutationVariables = { id: ApiInput<'createGroupInvite'>['path']['id'] }
export type CreateGroupInviteMutationResult = ApiOutput<'createGroupInvite'>

export type CreateGroupInviteMutationError = ApiOperationError<'createGroupInvite'>
export type CreateGroupInviteMutationHookOptions<TError, TContext> = {
  mutation?: UseMutationOptions<
    ApiOutput<'createGroupInvite'>,
    TError,
    CreateGroupInviteMutationVariables,
    TContext
  >
}

export const getCreateGroupInviteMutationOptions = <
  TError = CreateGroupInviteMutationError,
  TContext = unknown
>(
  options?: CreateGroupInviteMutationHookOptions<TError, TContext>
): UseMutationOptions<
  ApiOutput<'createGroupInvite'>,
  TError,
  CreateGroupInviteMutationVariables,
  TContext
> => {
  const mutationOptions = options?.mutation
  const mutationKey = mutationOptions?.mutationKey ?? ['api', 'createGroupInvite']
  const mutationFn: MutationFunction<
    ApiOutput<'createGroupInvite'>,
    CreateGroupInviteMutationVariables
  > = (variables) => {
    const input = { path: { id: variables.id } } satisfies ApiInput<'createGroupInvite'>
    return getApi()['groups']['createGroupInvite'](input)
  }

  return { mutationKey, mutationFn, ...mutationOptions }
}

export const useCreateGroupInvite = <TError = CreateGroupInviteMutationError, TContext = unknown>(
  options?: CreateGroupInviteMutationHookOptions<TError, TContext>
): UseMutationResult<
  ApiOutput<'createGroupInvite'>,
  TError,
  CreateGroupInviteMutationVariables,
  TContext
> => useMutation(getCreateGroupInviteMutationOptions(options))

export type LeaveGroupMutationVariables = { id: ApiInput<'leaveGroup'>['path']['id'] }
export type LeaveGroupMutationResult = ApiOutput<'leaveGroup'>

export type LeaveGroupMutationError = ApiOperationError<'leaveGroup'>
export type LeaveGroupMutationHookOptions<TError, TContext> = {
  mutation?: UseMutationOptions<
    ApiOutput<'leaveGroup'>,
    TError,
    LeaveGroupMutationVariables,
    TContext
  >
}

export const getLeaveGroupMutationOptions = <TError = LeaveGroupMutationError, TContext = unknown>(
  options?: LeaveGroupMutationHookOptions<TError, TContext>
): UseMutationOptions<ApiOutput<'leaveGroup'>, TError, LeaveGroupMutationVariables, TContext> => {
  const mutationOptions = options?.mutation
  const mutationKey = mutationOptions?.mutationKey ?? ['api', 'leaveGroup']
  const mutationFn: MutationFunction<ApiOutput<'leaveGroup'>, LeaveGroupMutationVariables> = (
    variables
  ) => {
    const input = { path: { id: variables.id } } satisfies ApiInput<'leaveGroup'>
    return getApi()['groups']['leaveGroup'](input)
  }

  return { mutationKey, mutationFn, ...mutationOptions }
}

export const useLeaveGroup = <TError = LeaveGroupMutationError, TContext = unknown>(
  options?: LeaveGroupMutationHookOptions<TError, TContext>
): UseMutationResult<ApiOutput<'leaveGroup'>, TError, LeaveGroupMutationVariables, TContext> =>
  useMutation(getLeaveGroupMutationOptions(options))

export type ListGroupMembersQueryResult = ApiOutput<'listGroupMembers'>
export type ListGroupMembersQueryError = ApiOperationError<'listGroupMembers'>
export type ListGroupMembersQueryHookOptions<TData, TError> = {
  query?: Omit<
    UseQueryOptions<ApiOutput<'listGroupMembers'>, TError, TData>,
    'queryKey' | 'queryFn'
  > & {
    queryKey?: QueryKey
  }
}

export const getListGroupMembersQueryKey = (
  id: ApiInput<'listGroupMembers'>['path']['id']
): readonly ['api', 'listGroupMembers', ApiInput<'listGroupMembers'>] => {
  const input = { path: { id: id } } satisfies ApiInput<'listGroupMembers'>
  return ['api', 'listGroupMembers', input] as const
}

export const getListGroupMembersQueryOptions = <
  TData = ApiOutput<'listGroupMembers'>,
  TError = ListGroupMembersQueryError
>(
  id: ApiInput<'listGroupMembers'>['path']['id'],
  options?: ListGroupMembersQueryHookOptions<TData, TError>
): UseQueryOptions<ApiOutput<'listGroupMembers'>, TError, TData> & { queryKey: QueryKey } => {
  const input = { path: { id: id } } satisfies ApiInput<'listGroupMembers'>
  const queryOptions = options?.query
  const queryKey = queryOptions?.queryKey ?? getListGroupMembersQueryKey(id)
  const requiredParametersPresent = isDefined(id)

  return {
    ...queryOptions,
    queryKey,
    queryFn: () => getApi()['groups']['listGroupMembers'](input),
    enabled: requiredParametersPresent ? queryOptions?.enabled : false
  } as UseQueryOptions<ApiOutput<'listGroupMembers'>, TError, TData> & { queryKey: QueryKey }
}

export function useListGroupMembers<
  TData = ApiOutput<'listGroupMembers'>,
  TError = ListGroupMembersQueryError
>(
  id: ApiInput<'listGroupMembers'>['path']['id'],
  options?: ListGroupMembersQueryHookOptions<TData, TError>
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getListGroupMembersQueryOptions(id, options)
  const query = useQuery(queryOptions) as UseQueryResult<TData, TError>
  return withQueryKey(query, queryOptions.queryKey)
}

export type RemoveGroupMemberMutationVariables = {
  id: ApiInput<'removeGroupMember'>['path']['id']
  userId: ApiInput<'removeGroupMember'>['path']['userId']
}
export type RemoveGroupMemberMutationResult = ApiOutput<'removeGroupMember'>

export type RemoveGroupMemberMutationError = ApiOperationError<'removeGroupMember'>
export type RemoveGroupMemberMutationHookOptions<TError, TContext> = {
  mutation?: UseMutationOptions<
    ApiOutput<'removeGroupMember'>,
    TError,
    RemoveGroupMemberMutationVariables,
    TContext
  >
}

export const getRemoveGroupMemberMutationOptions = <
  TError = RemoveGroupMemberMutationError,
  TContext = unknown
>(
  options?: RemoveGroupMemberMutationHookOptions<TError, TContext>
): UseMutationOptions<
  ApiOutput<'removeGroupMember'>,
  TError,
  RemoveGroupMemberMutationVariables,
  TContext
> => {
  const mutationOptions = options?.mutation
  const mutationKey = mutationOptions?.mutationKey ?? ['api', 'removeGroupMember']
  const mutationFn: MutationFunction<
    ApiOutput<'removeGroupMember'>,
    RemoveGroupMemberMutationVariables
  > = (variables) => {
    const input = {
      path: { id: variables.id, userId: variables.userId }
    } satisfies ApiInput<'removeGroupMember'>
    return getApi()['groups']['removeGroupMember'](input)
  }

  return { mutationKey, mutationFn, ...mutationOptions }
}

export const useRemoveGroupMember = <TError = RemoveGroupMemberMutationError, TContext = unknown>(
  options?: RemoveGroupMemberMutationHookOptions<TError, TContext>
): UseMutationResult<
  ApiOutput<'removeGroupMember'>,
  TError,
  RemoveGroupMemberMutationVariables,
  TContext
> => useMutation(getRemoveGroupMemberMutationOptions(options))

export type ListGroupEventsQueryResult = ApiOutput<'listGroupEvents'>
export type ListGroupEventsQueryError = ApiOperationError<'listGroupEvents'>
export type ListGroupEventsQueryHookOptions<TData, TError> = {
  query?: Omit<
    UseQueryOptions<ApiOutput<'listGroupEvents'>, TError, TData>,
    'queryKey' | 'queryFn'
  > & {
    queryKey?: QueryKey
  }
}

export const getListGroupEventsQueryKey = (
  id: ApiInput<'listGroupEvents'>['path']['id']
): readonly ['api', 'listGroupEvents', ApiInput<'listGroupEvents'>] => {
  const input = { path: { id: id } } satisfies ApiInput<'listGroupEvents'>
  return ['api', 'listGroupEvents', input] as const
}

export const getListGroupEventsQueryOptions = <
  TData = ApiOutput<'listGroupEvents'>,
  TError = ListGroupEventsQueryError
>(
  id: ApiInput<'listGroupEvents'>['path']['id'],
  options?: ListGroupEventsQueryHookOptions<TData, TError>
): UseQueryOptions<ApiOutput<'listGroupEvents'>, TError, TData> & { queryKey: QueryKey } => {
  const input = { path: { id: id } } satisfies ApiInput<'listGroupEvents'>
  const queryOptions = options?.query
  const queryKey = queryOptions?.queryKey ?? getListGroupEventsQueryKey(id)
  const requiredParametersPresent = isDefined(id)

  return {
    ...queryOptions,
    queryKey,
    queryFn: () => getApi()['groups']['listGroupEvents'](input),
    enabled: requiredParametersPresent ? queryOptions?.enabled : false
  } as UseQueryOptions<ApiOutput<'listGroupEvents'>, TError, TData> & { queryKey: QueryKey }
}

export function useListGroupEvents<
  TData = ApiOutput<'listGroupEvents'>,
  TError = ListGroupEventsQueryError
>(
  id: ApiInput<'listGroupEvents'>['path']['id'],
  options?: ListGroupEventsQueryHookOptions<TData, TError>
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getListGroupEventsQueryOptions(id, options)
  const query = useQuery(queryOptions) as UseQueryResult<TData, TError>
  return withQueryKey(query, queryOptions.queryKey)
}

export type CreateGroupEventMutationVariables = {
  id: ApiInput<'createGroupEvent'>['path']['id']
  data: NonNullable<ApiInput<'createGroupEvent'>['body']>
}
export type CreateGroupEventMutationResult = ApiOutput<'createGroupEvent'>
export type CreateGroupEventMutationBody = NonNullable<ApiInput<'createGroupEvent'>['body']>
export type CreateGroupEventMutationError = ApiOperationError<'createGroupEvent'>
export type CreateGroupEventMutationHookOptions<TError, TContext> = {
  mutation?: UseMutationOptions<
    ApiOutput<'createGroupEvent'>,
    TError,
    CreateGroupEventMutationVariables,
    TContext
  >
}

export const getCreateGroupEventMutationOptions = <
  TError = CreateGroupEventMutationError,
  TContext = unknown
>(
  options?: CreateGroupEventMutationHookOptions<TError, TContext>
): UseMutationOptions<
  ApiOutput<'createGroupEvent'>,
  TError,
  CreateGroupEventMutationVariables,
  TContext
> => {
  const mutationOptions = options?.mutation
  const mutationKey = mutationOptions?.mutationKey ?? ['api', 'createGroupEvent']
  const mutationFn: MutationFunction<
    ApiOutput<'createGroupEvent'>,
    CreateGroupEventMutationVariables
  > = (variables) => {
    const input = {
      path: { id: variables.id },
      body: variables.data
    } satisfies ApiInput<'createGroupEvent'>
    return getApi()['groups']['createGroupEvent'](input)
  }

  return { mutationKey, mutationFn, ...mutationOptions }
}

export const useCreateGroupEvent = <TError = CreateGroupEventMutationError, TContext = unknown>(
  options?: CreateGroupEventMutationHookOptions<TError, TContext>
): UseMutationResult<
  ApiOutput<'createGroupEvent'>,
  TError,
  CreateGroupEventMutationVariables,
  TContext
> => useMutation(getCreateGroupEventMutationOptions(options))

export type UpdateGroupEventMutationVariables = {
  id: ApiInput<'updateGroupEvent'>['path']['id']
  eventId: ApiInput<'updateGroupEvent'>['path']['eventId']
  data: NonNullable<ApiInput<'updateGroupEvent'>['body']>
}
export type UpdateGroupEventMutationResult = ApiOutput<'updateGroupEvent'>
export type UpdateGroupEventMutationBody = NonNullable<ApiInput<'updateGroupEvent'>['body']>
export type UpdateGroupEventMutationError = ApiOperationError<'updateGroupEvent'>
export type UpdateGroupEventMutationHookOptions<TError, TContext> = {
  mutation?: UseMutationOptions<
    ApiOutput<'updateGroupEvent'>,
    TError,
    UpdateGroupEventMutationVariables,
    TContext
  >
}

export const getUpdateGroupEventMutationOptions = <
  TError = UpdateGroupEventMutationError,
  TContext = unknown
>(
  options?: UpdateGroupEventMutationHookOptions<TError, TContext>
): UseMutationOptions<
  ApiOutput<'updateGroupEvent'>,
  TError,
  UpdateGroupEventMutationVariables,
  TContext
> => {
  const mutationOptions = options?.mutation
  const mutationKey = mutationOptions?.mutationKey ?? ['api', 'updateGroupEvent']
  const mutationFn: MutationFunction<
    ApiOutput<'updateGroupEvent'>,
    UpdateGroupEventMutationVariables
  > = (variables) => {
    const input = {
      path: { id: variables.id, eventId: variables.eventId },
      body: variables.data
    } satisfies ApiInput<'updateGroupEvent'>
    return getApi()['groups']['updateGroupEvent'](input)
  }

  return { mutationKey, mutationFn, ...mutationOptions }
}

export const useUpdateGroupEvent = <TError = UpdateGroupEventMutationError, TContext = unknown>(
  options?: UpdateGroupEventMutationHookOptions<TError, TContext>
): UseMutationResult<
  ApiOutput<'updateGroupEvent'>,
  TError,
  UpdateGroupEventMutationVariables,
  TContext
> => useMutation(getUpdateGroupEventMutationOptions(options))

export type DeleteGroupEventMutationVariables = {
  id: ApiInput<'deleteGroupEvent'>['path']['id']
  eventId: ApiInput<'deleteGroupEvent'>['path']['eventId']
}
export type DeleteGroupEventMutationResult = ApiOutput<'deleteGroupEvent'>

export type DeleteGroupEventMutationError = ApiOperationError<'deleteGroupEvent'>
export type DeleteGroupEventMutationHookOptions<TError, TContext> = {
  mutation?: UseMutationOptions<
    ApiOutput<'deleteGroupEvent'>,
    TError,
    DeleteGroupEventMutationVariables,
    TContext
  >
}

export const getDeleteGroupEventMutationOptions = <
  TError = DeleteGroupEventMutationError,
  TContext = unknown
>(
  options?: DeleteGroupEventMutationHookOptions<TError, TContext>
): UseMutationOptions<
  ApiOutput<'deleteGroupEvent'>,
  TError,
  DeleteGroupEventMutationVariables,
  TContext
> => {
  const mutationOptions = options?.mutation
  const mutationKey = mutationOptions?.mutationKey ?? ['api', 'deleteGroupEvent']
  const mutationFn: MutationFunction<
    ApiOutput<'deleteGroupEvent'>,
    DeleteGroupEventMutationVariables
  > = (variables) => {
    const input = {
      path: { id: variables.id, eventId: variables.eventId }
    } satisfies ApiInput<'deleteGroupEvent'>
    return getApi()['groups']['deleteGroupEvent'](input)
  }

  return { mutationKey, mutationFn, ...mutationOptions }
}

export const useDeleteGroupEvent = <TError = DeleteGroupEventMutationError, TContext = unknown>(
  options?: DeleteGroupEventMutationHookOptions<TError, TContext>
): UseMutationResult<
  ApiOutput<'deleteGroupEvent'>,
  TError,
  DeleteGroupEventMutationVariables,
  TContext
> => useMutation(getDeleteGroupEventMutationOptions(options))

export type ListEventCommentsQueryResult = ApiOutput<'listEventComments'>
export type ListEventCommentsQueryError = ApiOperationError<'listEventComments'>
export type ListEventCommentsQueryHookOptions<TData, TError> = {
  query?: Omit<
    UseQueryOptions<ApiOutput<'listEventComments'>, TError, TData>,
    'queryKey' | 'queryFn'
  > & {
    queryKey?: QueryKey
  }
}

export const getListEventCommentsQueryKey = (
  id: ApiInput<'listEventComments'>['path']['id'],
  eventId: ApiInput<'listEventComments'>['path']['eventId']
): readonly ['api', 'listEventComments', ApiInput<'listEventComments'>] => {
  const input = { path: { id: id, eventId: eventId } } satisfies ApiInput<'listEventComments'>
  return ['api', 'listEventComments', input] as const
}

export const getListEventCommentsQueryOptions = <
  TData = ApiOutput<'listEventComments'>,
  TError = ListEventCommentsQueryError
>(
  id: ApiInput<'listEventComments'>['path']['id'],
  eventId: ApiInput<'listEventComments'>['path']['eventId'],
  options?: ListEventCommentsQueryHookOptions<TData, TError>
): UseQueryOptions<ApiOutput<'listEventComments'>, TError, TData> & { queryKey: QueryKey } => {
  const input = { path: { id: id, eventId: eventId } } satisfies ApiInput<'listEventComments'>
  const queryOptions = options?.query
  const queryKey = queryOptions?.queryKey ?? getListEventCommentsQueryKey(id, eventId)
  const requiredParametersPresent = isDefined(id) && isDefined(eventId)

  return {
    ...queryOptions,
    queryKey,
    queryFn: () => getApi()['groups']['listEventComments'](input),
    enabled: requiredParametersPresent ? queryOptions?.enabled : false
  } as UseQueryOptions<ApiOutput<'listEventComments'>, TError, TData> & { queryKey: QueryKey }
}

export function useListEventComments<
  TData = ApiOutput<'listEventComments'>,
  TError = ListEventCommentsQueryError
>(
  id: ApiInput<'listEventComments'>['path']['id'],
  eventId: ApiInput<'listEventComments'>['path']['eventId'],
  options?: ListEventCommentsQueryHookOptions<TData, TError>
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getListEventCommentsQueryOptions(id, eventId, options)
  const query = useQuery(queryOptions) as UseQueryResult<TData, TError>
  return withQueryKey(query, queryOptions.queryKey)
}

export type AddEventCommentMutationVariables = {
  id: ApiInput<'addEventComment'>['path']['id']
  eventId: ApiInput<'addEventComment'>['path']['eventId']
  data: NonNullable<ApiInput<'addEventComment'>['body']>
}
export type AddEventCommentMutationResult = ApiOutput<'addEventComment'>
export type AddEventCommentMutationBody = NonNullable<ApiInput<'addEventComment'>['body']>
export type AddEventCommentMutationError = ApiOperationError<'addEventComment'>
export type AddEventCommentMutationHookOptions<TError, TContext> = {
  mutation?: UseMutationOptions<
    ApiOutput<'addEventComment'>,
    TError,
    AddEventCommentMutationVariables,
    TContext
  >
}

export const getAddEventCommentMutationOptions = <
  TError = AddEventCommentMutationError,
  TContext = unknown
>(
  options?: AddEventCommentMutationHookOptions<TError, TContext>
): UseMutationOptions<
  ApiOutput<'addEventComment'>,
  TError,
  AddEventCommentMutationVariables,
  TContext
> => {
  const mutationOptions = options?.mutation
  const mutationKey = mutationOptions?.mutationKey ?? ['api', 'addEventComment']
  const mutationFn: MutationFunction<
    ApiOutput<'addEventComment'>,
    AddEventCommentMutationVariables
  > = (variables) => {
    const input = {
      path: { id: variables.id, eventId: variables.eventId },
      body: variables.data
    } satisfies ApiInput<'addEventComment'>
    return getApi()['groups']['addEventComment'](input)
  }

  return { mutationKey, mutationFn, ...mutationOptions }
}

export const useAddEventComment = <TError = AddEventCommentMutationError, TContext = unknown>(
  options?: AddEventCommentMutationHookOptions<TError, TContext>
): UseMutationResult<
  ApiOutput<'addEventComment'>,
  TError,
  AddEventCommentMutationVariables,
  TContext
> => useMutation(getAddEventCommentMutationOptions(options))

export type ListGroupTasksQueryResult = ApiOutput<'listGroupTasks'>
export type ListGroupTasksQueryError = ApiOperationError<'listGroupTasks'>
export type ListGroupTasksQueryHookOptions<TData, TError> = {
  query?: Omit<
    UseQueryOptions<ApiOutput<'listGroupTasks'>, TError, TData>,
    'queryKey' | 'queryFn'
  > & {
    queryKey?: QueryKey
  }
}

export const getListGroupTasksQueryKey = (
  id: ApiInput<'listGroupTasks'>['path']['id']
): readonly ['api', 'listGroupTasks', ApiInput<'listGroupTasks'>] => {
  const input = { path: { id: id } } satisfies ApiInput<'listGroupTasks'>
  return ['api', 'listGroupTasks', input] as const
}

export const getListGroupTasksQueryOptions = <
  TData = ApiOutput<'listGroupTasks'>,
  TError = ListGroupTasksQueryError
>(
  id: ApiInput<'listGroupTasks'>['path']['id'],
  options?: ListGroupTasksQueryHookOptions<TData, TError>
): UseQueryOptions<ApiOutput<'listGroupTasks'>, TError, TData> & { queryKey: QueryKey } => {
  const input = { path: { id: id } } satisfies ApiInput<'listGroupTasks'>
  const queryOptions = options?.query
  const queryKey = queryOptions?.queryKey ?? getListGroupTasksQueryKey(id)
  const requiredParametersPresent = isDefined(id)

  return {
    ...queryOptions,
    queryKey,
    queryFn: () => getApi()['groups']['listGroupTasks'](input),
    enabled: requiredParametersPresent ? queryOptions?.enabled : false
  } as UseQueryOptions<ApiOutput<'listGroupTasks'>, TError, TData> & { queryKey: QueryKey }
}

export function useListGroupTasks<
  TData = ApiOutput<'listGroupTasks'>,
  TError = ListGroupTasksQueryError
>(
  id: ApiInput<'listGroupTasks'>['path']['id'],
  options?: ListGroupTasksQueryHookOptions<TData, TError>
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getListGroupTasksQueryOptions(id, options)
  const query = useQuery(queryOptions) as UseQueryResult<TData, TError>
  return withQueryKey(query, queryOptions.queryKey)
}

export type CreateGroupTaskMutationVariables = {
  id: ApiInput<'createGroupTask'>['path']['id']
  data: NonNullable<ApiInput<'createGroupTask'>['body']>
}
export type CreateGroupTaskMutationResult = ApiOutput<'createGroupTask'>
export type CreateGroupTaskMutationBody = NonNullable<ApiInput<'createGroupTask'>['body']>
export type CreateGroupTaskMutationError = ApiOperationError<'createGroupTask'>
export type CreateGroupTaskMutationHookOptions<TError, TContext> = {
  mutation?: UseMutationOptions<
    ApiOutput<'createGroupTask'>,
    TError,
    CreateGroupTaskMutationVariables,
    TContext
  >
}

export const getCreateGroupTaskMutationOptions = <
  TError = CreateGroupTaskMutationError,
  TContext = unknown
>(
  options?: CreateGroupTaskMutationHookOptions<TError, TContext>
): UseMutationOptions<
  ApiOutput<'createGroupTask'>,
  TError,
  CreateGroupTaskMutationVariables,
  TContext
> => {
  const mutationOptions = options?.mutation
  const mutationKey = mutationOptions?.mutationKey ?? ['api', 'createGroupTask']
  const mutationFn: MutationFunction<
    ApiOutput<'createGroupTask'>,
    CreateGroupTaskMutationVariables
  > = (variables) => {
    const input = {
      path: { id: variables.id },
      body: variables.data
    } satisfies ApiInput<'createGroupTask'>
    return getApi()['groups']['createGroupTask'](input)
  }

  return { mutationKey, mutationFn, ...mutationOptions }
}

export const useCreateGroupTask = <TError = CreateGroupTaskMutationError, TContext = unknown>(
  options?: CreateGroupTaskMutationHookOptions<TError, TContext>
): UseMutationResult<
  ApiOutput<'createGroupTask'>,
  TError,
  CreateGroupTaskMutationVariables,
  TContext
> => useMutation(getCreateGroupTaskMutationOptions(options))

export type UpdateGroupTaskMutationVariables = {
  id: ApiInput<'updateGroupTask'>['path']['id']
  taskId: ApiInput<'updateGroupTask'>['path']['taskId']
  data: NonNullable<ApiInput<'updateGroupTask'>['body']>
}
export type UpdateGroupTaskMutationResult = ApiOutput<'updateGroupTask'>
export type UpdateGroupTaskMutationBody = NonNullable<ApiInput<'updateGroupTask'>['body']>
export type UpdateGroupTaskMutationError = ApiOperationError<'updateGroupTask'>
export type UpdateGroupTaskMutationHookOptions<TError, TContext> = {
  mutation?: UseMutationOptions<
    ApiOutput<'updateGroupTask'>,
    TError,
    UpdateGroupTaskMutationVariables,
    TContext
  >
}

export const getUpdateGroupTaskMutationOptions = <
  TError = UpdateGroupTaskMutationError,
  TContext = unknown
>(
  options?: UpdateGroupTaskMutationHookOptions<TError, TContext>
): UseMutationOptions<
  ApiOutput<'updateGroupTask'>,
  TError,
  UpdateGroupTaskMutationVariables,
  TContext
> => {
  const mutationOptions = options?.mutation
  const mutationKey = mutationOptions?.mutationKey ?? ['api', 'updateGroupTask']
  const mutationFn: MutationFunction<
    ApiOutput<'updateGroupTask'>,
    UpdateGroupTaskMutationVariables
  > = (variables) => {
    const input = {
      path: { id: variables.id, taskId: variables.taskId },
      body: variables.data
    } satisfies ApiInput<'updateGroupTask'>
    return getApi()['groups']['updateGroupTask'](input)
  }

  return { mutationKey, mutationFn, ...mutationOptions }
}

export const useUpdateGroupTask = <TError = UpdateGroupTaskMutationError, TContext = unknown>(
  options?: UpdateGroupTaskMutationHookOptions<TError, TContext>
): UseMutationResult<
  ApiOutput<'updateGroupTask'>,
  TError,
  UpdateGroupTaskMutationVariables,
  TContext
> => useMutation(getUpdateGroupTaskMutationOptions(options))

export type DeleteGroupTaskMutationVariables = {
  id: ApiInput<'deleteGroupTask'>['path']['id']
  taskId: ApiInput<'deleteGroupTask'>['path']['taskId']
}
export type DeleteGroupTaskMutationResult = ApiOutput<'deleteGroupTask'>

export type DeleteGroupTaskMutationError = ApiOperationError<'deleteGroupTask'>
export type DeleteGroupTaskMutationHookOptions<TError, TContext> = {
  mutation?: UseMutationOptions<
    ApiOutput<'deleteGroupTask'>,
    TError,
    DeleteGroupTaskMutationVariables,
    TContext
  >
}

export const getDeleteGroupTaskMutationOptions = <
  TError = DeleteGroupTaskMutationError,
  TContext = unknown
>(
  options?: DeleteGroupTaskMutationHookOptions<TError, TContext>
): UseMutationOptions<
  ApiOutput<'deleteGroupTask'>,
  TError,
  DeleteGroupTaskMutationVariables,
  TContext
> => {
  const mutationOptions = options?.mutation
  const mutationKey = mutationOptions?.mutationKey ?? ['api', 'deleteGroupTask']
  const mutationFn: MutationFunction<
    ApiOutput<'deleteGroupTask'>,
    DeleteGroupTaskMutationVariables
  > = (variables) => {
    const input = {
      path: { id: variables.id, taskId: variables.taskId }
    } satisfies ApiInput<'deleteGroupTask'>
    return getApi()['groups']['deleteGroupTask'](input)
  }

  return { mutationKey, mutationFn, ...mutationOptions }
}

export const useDeleteGroupTask = <TError = DeleteGroupTaskMutationError, TContext = unknown>(
  options?: DeleteGroupTaskMutationHookOptions<TError, TContext>
): UseMutationResult<
  ApiOutput<'deleteGroupTask'>,
  TError,
  DeleteGroupTaskMutationVariables,
  TContext
> => useMutation(getDeleteGroupTaskMutationOptions(options))

export type ListTaskCommentsQueryResult = ApiOutput<'listTaskComments'>
export type ListTaskCommentsQueryError = ApiOperationError<'listTaskComments'>
export type ListTaskCommentsQueryHookOptions<TData, TError> = {
  query?: Omit<
    UseQueryOptions<ApiOutput<'listTaskComments'>, TError, TData>,
    'queryKey' | 'queryFn'
  > & {
    queryKey?: QueryKey
  }
}

export const getListTaskCommentsQueryKey = (
  id: ApiInput<'listTaskComments'>['path']['id'],
  taskId: ApiInput<'listTaskComments'>['path']['taskId']
): readonly ['api', 'listTaskComments', ApiInput<'listTaskComments'>] => {
  const input = { path: { id: id, taskId: taskId } } satisfies ApiInput<'listTaskComments'>
  return ['api', 'listTaskComments', input] as const
}

export const getListTaskCommentsQueryOptions = <
  TData = ApiOutput<'listTaskComments'>,
  TError = ListTaskCommentsQueryError
>(
  id: ApiInput<'listTaskComments'>['path']['id'],
  taskId: ApiInput<'listTaskComments'>['path']['taskId'],
  options?: ListTaskCommentsQueryHookOptions<TData, TError>
): UseQueryOptions<ApiOutput<'listTaskComments'>, TError, TData> & { queryKey: QueryKey } => {
  const input = { path: { id: id, taskId: taskId } } satisfies ApiInput<'listTaskComments'>
  const queryOptions = options?.query
  const queryKey = queryOptions?.queryKey ?? getListTaskCommentsQueryKey(id, taskId)
  const requiredParametersPresent = isDefined(id) && isDefined(taskId)

  return {
    ...queryOptions,
    queryKey,
    queryFn: () => getApi()['groups']['listTaskComments'](input),
    enabled: requiredParametersPresent ? queryOptions?.enabled : false
  } as UseQueryOptions<ApiOutput<'listTaskComments'>, TError, TData> & { queryKey: QueryKey }
}

export function useListTaskComments<
  TData = ApiOutput<'listTaskComments'>,
  TError = ListTaskCommentsQueryError
>(
  id: ApiInput<'listTaskComments'>['path']['id'],
  taskId: ApiInput<'listTaskComments'>['path']['taskId'],
  options?: ListTaskCommentsQueryHookOptions<TData, TError>
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getListTaskCommentsQueryOptions(id, taskId, options)
  const query = useQuery(queryOptions) as UseQueryResult<TData, TError>
  return withQueryKey(query, queryOptions.queryKey)
}

export type AddTaskCommentMutationVariables = {
  id: ApiInput<'addTaskComment'>['path']['id']
  taskId: ApiInput<'addTaskComment'>['path']['taskId']
  data: NonNullable<ApiInput<'addTaskComment'>['body']>
}
export type AddTaskCommentMutationResult = ApiOutput<'addTaskComment'>
export type AddTaskCommentMutationBody = NonNullable<ApiInput<'addTaskComment'>['body']>
export type AddTaskCommentMutationError = ApiOperationError<'addTaskComment'>
export type AddTaskCommentMutationHookOptions<TError, TContext> = {
  mutation?: UseMutationOptions<
    ApiOutput<'addTaskComment'>,
    TError,
    AddTaskCommentMutationVariables,
    TContext
  >
}

export const getAddTaskCommentMutationOptions = <
  TError = AddTaskCommentMutationError,
  TContext = unknown
>(
  options?: AddTaskCommentMutationHookOptions<TError, TContext>
): UseMutationOptions<
  ApiOutput<'addTaskComment'>,
  TError,
  AddTaskCommentMutationVariables,
  TContext
> => {
  const mutationOptions = options?.mutation
  const mutationKey = mutationOptions?.mutationKey ?? ['api', 'addTaskComment']
  const mutationFn: MutationFunction<
    ApiOutput<'addTaskComment'>,
    AddTaskCommentMutationVariables
  > = (variables) => {
    const input = {
      path: { id: variables.id, taskId: variables.taskId },
      body: variables.data
    } satisfies ApiInput<'addTaskComment'>
    return getApi()['groups']['addTaskComment'](input)
  }

  return { mutationKey, mutationFn, ...mutationOptions }
}

export const useAddTaskComment = <TError = AddTaskCommentMutationError, TContext = unknown>(
  options?: AddTaskCommentMutationHookOptions<TError, TContext>
): UseMutationResult<
  ApiOutput<'addTaskComment'>,
  TError,
  AddTaskCommentMutationVariables,
  TContext
> => useMutation(getAddTaskCommentMutationOptions(options))

export type ListGroupNotesQueryResult = ApiOutput<'listGroupNotes'>
export type ListGroupNotesQueryError = ApiOperationError<'listGroupNotes'>
export type ListGroupNotesQueryHookOptions<TData, TError> = {
  query?: Omit<
    UseQueryOptions<ApiOutput<'listGroupNotes'>, TError, TData>,
    'queryKey' | 'queryFn'
  > & {
    queryKey?: QueryKey
  }
}

export const getListGroupNotesQueryKey = (
  id: ApiInput<'listGroupNotes'>['path']['id']
): readonly ['api', 'listGroupNotes', ApiInput<'listGroupNotes'>] => {
  const input = { path: { id: id } } satisfies ApiInput<'listGroupNotes'>
  return ['api', 'listGroupNotes', input] as const
}

export const getListGroupNotesQueryOptions = <
  TData = ApiOutput<'listGroupNotes'>,
  TError = ListGroupNotesQueryError
>(
  id: ApiInput<'listGroupNotes'>['path']['id'],
  options?: ListGroupNotesQueryHookOptions<TData, TError>
): UseQueryOptions<ApiOutput<'listGroupNotes'>, TError, TData> & { queryKey: QueryKey } => {
  const input = { path: { id: id } } satisfies ApiInput<'listGroupNotes'>
  const queryOptions = options?.query
  const queryKey = queryOptions?.queryKey ?? getListGroupNotesQueryKey(id)
  const requiredParametersPresent = isDefined(id)

  return {
    ...queryOptions,
    queryKey,
    queryFn: () => getApi()['groups']['listGroupNotes'](input),
    enabled: requiredParametersPresent ? queryOptions?.enabled : false
  } as UseQueryOptions<ApiOutput<'listGroupNotes'>, TError, TData> & { queryKey: QueryKey }
}

export function useListGroupNotes<
  TData = ApiOutput<'listGroupNotes'>,
  TError = ListGroupNotesQueryError
>(
  id: ApiInput<'listGroupNotes'>['path']['id'],
  options?: ListGroupNotesQueryHookOptions<TData, TError>
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getListGroupNotesQueryOptions(id, options)
  const query = useQuery(queryOptions) as UseQueryResult<TData, TError>
  return withQueryKey(query, queryOptions.queryKey)
}

export type CreateGroupNoteMutationVariables = {
  id: ApiInput<'createGroupNote'>['path']['id']
  data: NonNullable<ApiInput<'createGroupNote'>['body']>
}
export type CreateGroupNoteMutationResult = ApiOutput<'createGroupNote'>
export type CreateGroupNoteMutationBody = NonNullable<ApiInput<'createGroupNote'>['body']>
export type CreateGroupNoteMutationError = ApiOperationError<'createGroupNote'>
export type CreateGroupNoteMutationHookOptions<TError, TContext> = {
  mutation?: UseMutationOptions<
    ApiOutput<'createGroupNote'>,
    TError,
    CreateGroupNoteMutationVariables,
    TContext
  >
}

export const getCreateGroupNoteMutationOptions = <
  TError = CreateGroupNoteMutationError,
  TContext = unknown
>(
  options?: CreateGroupNoteMutationHookOptions<TError, TContext>
): UseMutationOptions<
  ApiOutput<'createGroupNote'>,
  TError,
  CreateGroupNoteMutationVariables,
  TContext
> => {
  const mutationOptions = options?.mutation
  const mutationKey = mutationOptions?.mutationKey ?? ['api', 'createGroupNote']
  const mutationFn: MutationFunction<
    ApiOutput<'createGroupNote'>,
    CreateGroupNoteMutationVariables
  > = (variables) => {
    const input = {
      path: { id: variables.id },
      body: variables.data
    } satisfies ApiInput<'createGroupNote'>
    return getApi()['groups']['createGroupNote'](input)
  }

  return { mutationKey, mutationFn, ...mutationOptions }
}

export const useCreateGroupNote = <TError = CreateGroupNoteMutationError, TContext = unknown>(
  options?: CreateGroupNoteMutationHookOptions<TError, TContext>
): UseMutationResult<
  ApiOutput<'createGroupNote'>,
  TError,
  CreateGroupNoteMutationVariables,
  TContext
> => useMutation(getCreateGroupNoteMutationOptions(options))

export type UpdateGroupNoteMutationVariables = {
  id: ApiInput<'updateGroupNote'>['path']['id']
  noteId: ApiInput<'updateGroupNote'>['path']['noteId']
  data: NonNullable<ApiInput<'updateGroupNote'>['body']>
}
export type UpdateGroupNoteMutationResult = ApiOutput<'updateGroupNote'>
export type UpdateGroupNoteMutationBody = NonNullable<ApiInput<'updateGroupNote'>['body']>
export type UpdateGroupNoteMutationError = ApiOperationError<'updateGroupNote'>
export type UpdateGroupNoteMutationHookOptions<TError, TContext> = {
  mutation?: UseMutationOptions<
    ApiOutput<'updateGroupNote'>,
    TError,
    UpdateGroupNoteMutationVariables,
    TContext
  >
}

export const getUpdateGroupNoteMutationOptions = <
  TError = UpdateGroupNoteMutationError,
  TContext = unknown
>(
  options?: UpdateGroupNoteMutationHookOptions<TError, TContext>
): UseMutationOptions<
  ApiOutput<'updateGroupNote'>,
  TError,
  UpdateGroupNoteMutationVariables,
  TContext
> => {
  const mutationOptions = options?.mutation
  const mutationKey = mutationOptions?.mutationKey ?? ['api', 'updateGroupNote']
  const mutationFn: MutationFunction<
    ApiOutput<'updateGroupNote'>,
    UpdateGroupNoteMutationVariables
  > = (variables) => {
    const input = {
      path: { id: variables.id, noteId: variables.noteId },
      body: variables.data
    } satisfies ApiInput<'updateGroupNote'>
    return getApi()['groups']['updateGroupNote'](input)
  }

  return { mutationKey, mutationFn, ...mutationOptions }
}

export const useUpdateGroupNote = <TError = UpdateGroupNoteMutationError, TContext = unknown>(
  options?: UpdateGroupNoteMutationHookOptions<TError, TContext>
): UseMutationResult<
  ApiOutput<'updateGroupNote'>,
  TError,
  UpdateGroupNoteMutationVariables,
  TContext
> => useMutation(getUpdateGroupNoteMutationOptions(options))

export type DeleteGroupNoteMutationVariables = {
  id: ApiInput<'deleteGroupNote'>['path']['id']
  noteId: ApiInput<'deleteGroupNote'>['path']['noteId']
}
export type DeleteGroupNoteMutationResult = ApiOutput<'deleteGroupNote'>

export type DeleteGroupNoteMutationError = ApiOperationError<'deleteGroupNote'>
export type DeleteGroupNoteMutationHookOptions<TError, TContext> = {
  mutation?: UseMutationOptions<
    ApiOutput<'deleteGroupNote'>,
    TError,
    DeleteGroupNoteMutationVariables,
    TContext
  >
}

export const getDeleteGroupNoteMutationOptions = <
  TError = DeleteGroupNoteMutationError,
  TContext = unknown
>(
  options?: DeleteGroupNoteMutationHookOptions<TError, TContext>
): UseMutationOptions<
  ApiOutput<'deleteGroupNote'>,
  TError,
  DeleteGroupNoteMutationVariables,
  TContext
> => {
  const mutationOptions = options?.mutation
  const mutationKey = mutationOptions?.mutationKey ?? ['api', 'deleteGroupNote']
  const mutationFn: MutationFunction<
    ApiOutput<'deleteGroupNote'>,
    DeleteGroupNoteMutationVariables
  > = (variables) => {
    const input = {
      path: { id: variables.id, noteId: variables.noteId }
    } satisfies ApiInput<'deleteGroupNote'>
    return getApi()['groups']['deleteGroupNote'](input)
  }

  return { mutationKey, mutationFn, ...mutationOptions }
}

export const useDeleteGroupNote = <TError = DeleteGroupNoteMutationError, TContext = unknown>(
  options?: DeleteGroupNoteMutationHookOptions<TError, TContext>
): UseMutationResult<
  ApiOutput<'deleteGroupNote'>,
  TError,
  DeleteGroupNoteMutationVariables,
  TContext
> => useMutation(getDeleteGroupNoteMutationOptions(options))

export type DeleteCommentMutationVariables = { id: ApiInput<'deleteComment'>['path']['id'] }
export type DeleteCommentMutationResult = ApiOutput<'deleteComment'>

export type DeleteCommentMutationError = ApiOperationError<'deleteComment'>
export type DeleteCommentMutationHookOptions<TError, TContext> = {
  mutation?: UseMutationOptions<
    ApiOutput<'deleteComment'>,
    TError,
    DeleteCommentMutationVariables,
    TContext
  >
}

export const getDeleteCommentMutationOptions = <
  TError = DeleteCommentMutationError,
  TContext = unknown
>(
  options?: DeleteCommentMutationHookOptions<TError, TContext>
): UseMutationOptions<
  ApiOutput<'deleteComment'>,
  TError,
  DeleteCommentMutationVariables,
  TContext
> => {
  const mutationOptions = options?.mutation
  const mutationKey = mutationOptions?.mutationKey ?? ['api', 'deleteComment']
  const mutationFn: MutationFunction<ApiOutput<'deleteComment'>, DeleteCommentMutationVariables> = (
    variables
  ) => {
    const input = { path: { id: variables.id } } satisfies ApiInput<'deleteComment'>
    return getApi()['groups']['deleteComment'](input)
  }

  return { mutationKey, mutationFn, ...mutationOptions }
}

export const useDeleteComment = <TError = DeleteCommentMutationError, TContext = unknown>(
  options?: DeleteCommentMutationHookOptions<TError, TContext>
): UseMutationResult<
  ApiOutput<'deleteComment'>,
  TError,
  DeleteCommentMutationVariables,
  TContext
> => useMutation(getDeleteCommentMutationOptions(options))

export type GetGroupInviteQueryResult = ApiOutput<'getGroupInvite'>
export type GetGroupInviteQueryError = ApiOperationError<'getGroupInvite'>
export type GetGroupInviteQueryHookOptions<TData, TError> = {
  query?: Omit<
    UseQueryOptions<ApiOutput<'getGroupInvite'>, TError, TData>,
    'queryKey' | 'queryFn'
  > & {
    queryKey?: QueryKey
  }
}

export const getGetGroupInviteQueryKey = (
  token: ApiInput<'getGroupInvite'>['path']['token']
): readonly ['api', 'getGroupInvite', ApiInput<'getGroupInvite'>] => {
  const input = { path: { token: token } } satisfies ApiInput<'getGroupInvite'>
  return ['api', 'getGroupInvite', input] as const
}

export const getGetGroupInviteQueryOptions = <
  TData = ApiOutput<'getGroupInvite'>,
  TError = GetGroupInviteQueryError
>(
  token: ApiInput<'getGroupInvite'>['path']['token'],
  options?: GetGroupInviteQueryHookOptions<TData, TError>
): UseQueryOptions<ApiOutput<'getGroupInvite'>, TError, TData> & { queryKey: QueryKey } => {
  const input = { path: { token: token } } satisfies ApiInput<'getGroupInvite'>
  const queryOptions = options?.query
  const queryKey = queryOptions?.queryKey ?? getGetGroupInviteQueryKey(token)
  const requiredParametersPresent = isDefined(token)

  return {
    ...queryOptions,
    queryKey,
    queryFn: () => getApi()['invite']['getGroupInvite'](input),
    enabled: requiredParametersPresent ? queryOptions?.enabled : false
  } as UseQueryOptions<ApiOutput<'getGroupInvite'>, TError, TData> & { queryKey: QueryKey }
}

export function useGetGroupInvite<
  TData = ApiOutput<'getGroupInvite'>,
  TError = GetGroupInviteQueryError
>(
  token: ApiInput<'getGroupInvite'>['path']['token'],
  options?: GetGroupInviteQueryHookOptions<TData, TError>
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getGetGroupInviteQueryOptions(token, options)
  const query = useQuery(queryOptions) as UseQueryResult<TData, TError>
  return withQueryKey(query, queryOptions.queryKey)
}

export type JoinGroupMutationVariables = { token: ApiInput<'joinGroup'>['path']['token'] }
export type JoinGroupMutationResult = ApiOutput<'joinGroup'>

export type JoinGroupMutationError = ApiOperationError<'joinGroup'>
export type JoinGroupMutationHookOptions<TError, TContext> = {
  mutation?: UseMutationOptions<
    ApiOutput<'joinGroup'>,
    TError,
    JoinGroupMutationVariables,
    TContext
  >
}

export const getJoinGroupMutationOptions = <TError = JoinGroupMutationError, TContext = unknown>(
  options?: JoinGroupMutationHookOptions<TError, TContext>
): UseMutationOptions<ApiOutput<'joinGroup'>, TError, JoinGroupMutationVariables, TContext> => {
  const mutationOptions = options?.mutation
  const mutationKey = mutationOptions?.mutationKey ?? ['api', 'joinGroup']
  const mutationFn: MutationFunction<ApiOutput<'joinGroup'>, JoinGroupMutationVariables> = (
    variables
  ) => {
    const input = { path: { token: variables.token } } satisfies ApiInput<'joinGroup'>
    return getApi()['invite']['joinGroup'](input)
  }

  return { mutationKey, mutationFn, ...mutationOptions }
}

export const useJoinGroup = <TError = JoinGroupMutationError, TContext = unknown>(
  options?: JoinGroupMutationHookOptions<TError, TContext>
): UseMutationResult<ApiOutput<'joinGroup'>, TError, JoinGroupMutationVariables, TContext> =>
  useMutation(getJoinGroupMutationOptions(options))
