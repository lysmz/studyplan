import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
  type UseMutationOptions,
  type UseMutationResult,
  type UseQueryResult
} from '@tanstack/react-query'
import type { CollaborationOperations } from '../../../shared/collaboration/ipc'
import { collaboration, CollaborationClientError } from '@/collaboration/client'

const refreshInterval = 2_000

type CollaborationQueryResult<K extends keyof CollaborationOperations> = UseQueryResult<
  CollaborationOperations[K]['output']
>

export function useCollaborationState(): CollaborationQueryResult<'state'> {
  return useQuery({
    queryKey: ['collaboration', 'state'],
    queryFn: () => collaboration('state', {}),
    refetchInterval: refreshInterval
  })
}

export function useCollaborationGroups(enabled: boolean): CollaborationQueryResult<'listGroups'> {
  return useQuery({
    queryKey: ['collaboration', 'groups'],
    queryFn: () => collaboration('listGroups', {}),
    enabled,
    refetchInterval: refreshInterval
  })
}

export function useCollaborationInvitations(
  enabled: boolean
): CollaborationQueryResult<'listInvitations'> {
  return useQuery({
    queryKey: ['collaboration', 'invitations'],
    queryFn: () => collaboration('listInvitations', {}),
    enabled,
    refetchInterval: refreshInterval
  })
}

export function useCollaborationGroup(
  groupId: string | undefined,
  enabled: boolean
): CollaborationQueryResult<'getGroup'> {
  return useQuery({
    queryKey: ['collaboration', 'group', groupId],
    queryFn: () => collaboration('getGroup', { groupId: groupId! }),
    enabled: enabled && Boolean(groupId),
    refetchInterval: refreshInterval,
    retry: false
  })
}

export function useCollaborationMembers(
  groupId: string | undefined,
  enabled: boolean
): CollaborationQueryResult<'listMembers'> {
  return useQuery({
    queryKey: ['collaboration', 'members', groupId],
    queryFn: () => collaboration('listMembers', { groupId: groupId! }),
    enabled: enabled && Boolean(groupId),
    refetchInterval: refreshInterval
  })
}

export function useCollaborationTasks(
  groupId: string | undefined,
  enabled: boolean
): CollaborationQueryResult<'listTasks'> {
  return useQuery({
    queryKey: ['collaboration', 'tasks', groupId],
    queryFn: () => collaboration('listTasks', { groupId: groupId! }),
    enabled: enabled && Boolean(groupId),
    refetchInterval: refreshInterval
  })
}

export function useCollaborationCandidates(
  groupId: string | undefined,
  search: string,
  enabled: boolean
): CollaborationQueryResult<'searchCandidates'> {
  return useQuery({
    queryKey: ['collaboration', 'candidates', groupId, search],
    queryFn: () => collaboration('searchCandidates', { groupId: groupId!, query: search.trim() }),
    enabled: enabled && Boolean(groupId) && search.trim().length >= 2,
    retry: false
  })
}

type CollaborationMutationOperation =
  | 'signIn'
  | 'signOut'
  | 'createGroup'
  | 'respondInvitation'
  | 'sendInvitation'
  | 'createTask'
  | 'updateTask'
  | 'deleteTask'

type CollaborationMutationOptions<K extends CollaborationMutationOperation> = Omit<
  UseMutationOptions<
    CollaborationOperations[K]['output'],
    CollaborationClientError,
    CollaborationOperations[K]['input']
  >,
  'mutationFn'
>

type CollaborationMutationResult<K extends CollaborationMutationOperation> = UseMutationResult<
  CollaborationOperations[K]['output'],
  CollaborationClientError,
  CollaborationOperations[K]['input']
>

function useCollaborationMutation<K extends CollaborationMutationOperation>(
  operation: K,
  options?: CollaborationMutationOptions<K>,
  updateCache?: (
    queryClient: QueryClient,
    data: CollaborationOperations[K]['output'],
    input: CollaborationOperations[K]['input']
  ) => void
): CollaborationMutationResult<K> {
  const queryClient = useQueryClient()
  return useMutation({
    ...options,
    mutationFn: (input) => collaboration(operation, input),
    onSuccess: (...args) => {
      updateCache?.(queryClient, args[0], args[1])
      return options?.onSuccess?.(...args)
    }
  })
}

export function useCollaborationSignIn(
  options?: CollaborationMutationOptions<'signIn'>
): CollaborationMutationResult<'signIn'> {
  return useCollaborationMutation('signIn', options, (queryClient) => {
    void queryClient.invalidateQueries({ queryKey: ['collaboration'] })
  })
}

export function useCollaborationSignOut(
  options?: CollaborationMutationOptions<'signOut'>
): CollaborationMutationResult<'signOut'> {
  return useCollaborationMutation('signOut', options, (queryClient) => {
    queryClient.removeQueries({ queryKey: ['collaboration'] })
    void queryClient.invalidateQueries({ queryKey: ['collaboration', 'state'] })
  })
}

export function useCreateCollaborationGroup(
  options?: CollaborationMutationOptions<'createGroup'>
): CollaborationMutationResult<'createGroup'> {
  return useCollaborationMutation('createGroup', options, (queryClient) => {
    void queryClient.invalidateQueries({ queryKey: ['collaboration', 'groups'] })
  })
}

export function useRespondCollaborationInvitation(
  options?: CollaborationMutationOptions<'respondInvitation'>
): CollaborationMutationResult<'respondInvitation'> {
  return useCollaborationMutation('respondInvitation', options, (queryClient) => {
    void queryClient.invalidateQueries({ queryKey: ['collaboration', 'invitations'] })
    void queryClient.invalidateQueries({ queryKey: ['collaboration', 'groups'] })
  })
}

export function useSendCollaborationInvitation(
  options?: CollaborationMutationOptions<'sendInvitation'>
): CollaborationMutationResult<'sendInvitation'> {
  return useCollaborationMutation('sendInvitation', options)
}

export function useCreateCollaborationTask(
  options?: CollaborationMutationOptions<'createTask'>
): CollaborationMutationResult<'createTask'> {
  return useCollaborationMutation('createTask', options, (queryClient, _data, input) => {
    void queryClient.invalidateQueries({ queryKey: ['collaboration', 'tasks', input.groupId] })
  })
}

export function useUpdateCollaborationTask(
  options?: CollaborationMutationOptions<'updateTask'>
): CollaborationMutationResult<'updateTask'> {
  return useCollaborationMutation('updateTask', options, (queryClient, _data, input) => {
    void queryClient.invalidateQueries({ queryKey: ['collaboration', 'tasks', input.groupId] })
  })
}

export function useDeleteCollaborationTask(
  options?: CollaborationMutationOptions<'deleteTask'>
): CollaborationMutationResult<'deleteTask'> {
  return useCollaborationMutation('deleteTask', options, (queryClient, _data, input) => {
    void queryClient.invalidateQueries({ queryKey: ['collaboration', 'tasks', input.groupId] })
  })
}
