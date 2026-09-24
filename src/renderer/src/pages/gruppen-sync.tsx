import { useState } from 'react'
import type { JSX } from 'react'
import { Link, useLocation, useParams } from 'wouter'
import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query'
import { ArrowLeft, Check, Cloud, CloudOff, Plus, Users, X } from 'lucide-react'
import type {
  CollaborationMember,
  CollaborationState,
  CollaborationTask
} from '../../../shared/collaboration/ipc'
import { collaboration } from '@/collaboration/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'

const refreshInterval = 2_000

function useCollaborationState(): UseQueryResult<CollaborationState> {
  return useQuery({
    queryKey: ['collaboration', 'state'],
    queryFn: () => collaboration('state', {}),
    refetchInterval: refreshInterval
  })
}

function CloudStatus({ connected }: { connected: boolean }): JSX.Element {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
      {connected ? <Cloud className="h-4 w-4" /> : <CloudOff className="h-4 w-4" />}
      {connected ? 'Synchronisiert' : 'Offline · Aufgaben bleiben lokal verfügbar'}
    </span>
  )
}

function SignIn(): JSX.Element {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const signIn = useMutation({
    mutationFn: () => collaboration('signIn', { email, password }),
    onSuccess: () => {
      setPassword('')
      void queryClient.invalidateQueries({ queryKey: ['collaboration'] })
    },
    onError: (error) =>
      toast({
        title: 'Anmeldung fehlgeschlagen',
        description: error.message,
        variant: 'destructive'
      })
  })

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Bei synchronisierten Gruppen anmelden</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-5 text-sm text-muted-foreground">
          Für gemeinsame Gruppen wird ein Supabase-Konto verwendet. Dein lokales StudyPlan-Konto
          bleibt davon getrennt.
        </p>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            signIn.mutate()
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="collaboration-email">E-Mail</Label>
            <Input
              id="collaboration-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="collaboration-password">Passwort</Label>
            <Input
              id="collaboration-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={signIn.isPending}>
            {signIn.isPending ? 'Wird angemeldet …' : 'Anmelden'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default function GruppenSync(): JSX.Element {
  const state = useCollaborationState()
  const queryClient = useQueryClient()
  const [, setLocation] = useLocation()
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const groups = useQuery({
    queryKey: ['collaboration', 'groups'],
    queryFn: () => collaboration('listGroups', {}),
    enabled: state.data?.signedIn === true,
    refetchInterval: refreshInterval
  })
  const invitations = useQuery({
    queryKey: ['collaboration', 'invitations'],
    queryFn: () => collaboration('listInvitations', {}),
    enabled: state.data?.signedIn === true,
    refetchInterval: refreshInterval
  })
  const create = useMutation({
    mutationFn: () =>
      collaboration('createGroup', {
        name: name.trim(),
        description: description.trim() || undefined
      }),
    onSuccess: (group) => {
      setName('')
      setDescription('')
      void queryClient.invalidateQueries({ queryKey: ['collaboration', 'groups'] })
      setLocation(`/gruppen-sync/${group.id}`)
    },
    onError: (error) =>
      toast({
        title: 'Gruppe konnte nicht angelegt werden',
        description: error.message,
        variant: 'destructive'
      })
  })
  const respond = useMutation({
    mutationFn: (input: { invitationId: string; response: 'accepted' | 'declined' }) =>
      collaboration('respondInvitation', input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['collaboration', 'invitations'] })
      void queryClient.invalidateQueries({ queryKey: ['collaboration', 'groups'] })
    },
    onError: (error) =>
      toast({
        title: 'Einladung konnte nicht beantwortet werden',
        description: error.message,
        variant: 'destructive'
      })
  })
  const signOut = useMutation({
    mutationFn: () => collaboration('signOut', {}),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ['collaboration'] })
      void queryClient.invalidateQueries({ queryKey: ['collaboration', 'state'] })
    }
  })

  return (
    <div className="space-y-7 pb-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl font-bold">Synchronisierte Gruppen</h1>
          <p className="mt-2 text-muted-foreground">
            Einladungen laufen online; gemeinsame Aufgaben sind lokal verfügbar.
          </p>
          {state.data?.signedIn && <CloudStatus connected={state.data.connected} />}
        </div>
        {state.data?.signedIn && (
          <Button variant="outline" onClick={() => signOut.mutate()} disabled={signOut.isPending}>
            Online-Konto wechseln
          </Button>
        )}
      </div>

      {state.isLoading ? (
        <p>Gruppen werden vorbereitet …</p>
      ) : state.isError ? (
        <p>Der Gruppenstatus konnte nicht geladen werden.</p>
      ) : !state.data?.configured ? (
        <Card>
          <CardContent className="py-8">
            Dieser Build hat noch keine PowerSync- und Supabase-Konfiguration.
          </CardContent>
        </Card>
      ) : !state.data.signedIn ? (
        <SignIn />
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Neue Gruppe</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-3"
                onSubmit={(event) => {
                  event.preventDefault()
                  create.mutate()
                }}
              >
                <Input
                  aria-label="Gruppenname"
                  placeholder="Name der Gruppe"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  maxLength={120}
                />
                <Textarea
                  aria-label="Beschreibung"
                  placeholder="Beschreibung (optional)"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  maxLength={2000}
                />
                <Button type="submit" disabled={create.isPending || !name.trim()}>
                  <Plus className="mr-2 h-4 w-4" /> Gruppe anlegen
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Meine Gruppen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {groups.isError && <p>Gruppen konnten nicht geladen werden.</p>}
                {groups.data?.length === 0 && (
                  <p className="text-muted-foreground">Noch keine Gruppen.</p>
                )}
                {groups.data?.map((group) => (
                  <Link
                    key={group.id}
                    href={`/gruppen-sync/${group.id}`}
                    className="block rounded-lg border p-4 hover:bg-muted/50"
                  >
                    <div className="font-medium">{group.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {group.myRole === 'owner' ? 'Besitzer' : 'Mitglied'} ·{' '}
                      {group.description || 'Ohne Beschreibung'}
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Einladungen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {invitations.isError && <p>Einladungen konnten nicht geladen werden.</p>}
                {invitations.data?.length === 0 && (
                  <p className="text-muted-foreground">Keine offenen Einladungen.</p>
                )}
                {invitations.data?.map((invitation) => (
                  <div key={invitation.id} className="rounded-lg border p-4">
                    <p className="font-medium">
                      Einladung von {invitation.inviterName ?? 'einem Gruppenmitglied'}
                    </p>
                    <p className="mb-3 text-sm text-muted-foreground">
                      Nach der Annahme erscheint die Gruppe hier.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={respond.isPending}
                        onClick={() =>
                          respond.mutate({ invitationId: invitation.id, response: 'accepted' })
                        }
                      >
                        <Check className="mr-1 h-4 w-4" /> Annehmen
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={respond.isPending}
                        onClick={() =>
                          respond.mutate({ invitationId: invitation.id, response: 'declined' })
                        }
                      >
                        <X className="mr-1 h-4 w-4" /> Ablehnen
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}

function TaskItem({
  task,
  members,
  onToggle,
  onDelete
}: {
  task: CollaborationTask
  members: CollaborationMember[]
  onToggle: () => void
  onDelete: () => void
}): JSX.Element {
  const assignee = members.find((member) => member.userId === task.assigneeId)
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border p-4">
      <div>
        <div
          className={
            task.status === 'done'
              ? 'font-medium line-through text-muted-foreground'
              : 'font-medium'
          }
        >
          {task.title}
        </div>
        {task.description && (
          <p className="mt-1 text-sm text-muted-foreground">{task.description}</p>
        )}
        <p className="mt-2 text-xs text-muted-foreground">
          {assignee && `Zuständig: ${assignee.displayName}`}
          {task.dueDate && ` · Fällig: ${new Date(task.dueDate).toLocaleString('de-DE')}`}
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button size="sm" variant="outline" onClick={onToggle}>
          {task.status === 'done' ? 'Öffnen' : 'Erledigt'}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onDelete}
          aria-label={`Aufgabe ${task.title} löschen`}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export function GruppenSyncDetail(): JSX.Element {
  const { id: groupId } = useParams<{ id: string }>()
  const [, setLocation] = useLocation()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const state = useCollaborationState()
  const [search, setSearch] = useState('')
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDescription, setTaskDescription] = useState('')
  const [taskAssignee, setTaskAssignee] = useState('')
  const [taskDueDate, setTaskDueDate] = useState('')
  const enabled = state.data?.signedIn === true && Boolean(groupId)
  const group = useQuery({
    queryKey: ['collaboration', 'group', groupId],
    queryFn: () => collaboration('getGroup', { groupId: groupId! }),
    enabled,
    refetchInterval: refreshInterval,
    retry: false
  })
  const members = useQuery({
    queryKey: ['collaboration', 'members', groupId],
    queryFn: () => collaboration('listMembers', { groupId: groupId! }),
    enabled: enabled && group.isSuccess,
    refetchInterval: refreshInterval
  })
  const tasks = useQuery({
    queryKey: ['collaboration', 'tasks', groupId],
    queryFn: () => collaboration('listTasks', { groupId: groupId! }),
    enabled: enabled && group.isSuccess,
    refetchInterval: refreshInterval
  })
  const candidates = useQuery({
    queryKey: ['collaboration', 'candidates', groupId, search],
    queryFn: () => collaboration('searchCandidates', { groupId: groupId!, query: search.trim() }),
    enabled: enabled && group.data?.myRole === 'owner' && search.trim().length >= 2,
    retry: false
  })
  const invite = useMutation({
    mutationFn: (inviteeId: string) =>
      collaboration('sendInvitation', { groupId: groupId!, inviteeId }),
    onSuccess: () => {
      setSearch('')
      toast({ title: 'Einladung gesendet' })
    },
    onError: (error) =>
      toast({
        title: 'Einladung fehlgeschlagen',
        description: error.message,
        variant: 'destructive'
      })
  })
  const createTask = useMutation({
    mutationFn: () =>
      collaboration('createTask', {
        groupId: groupId!,
        title: taskTitle.trim(),
        description: taskDescription.trim() || null,
        assigneeId: taskAssignee || null,
        dueDate: taskDueDate ? new Date(taskDueDate).toISOString() : null
      }),
    onSuccess: () => {
      setTaskTitle('')
      setTaskDescription('')
      setTaskAssignee('')
      setTaskDueDate('')
      void queryClient.invalidateQueries({ queryKey: ['collaboration', 'tasks', groupId] })
      toast({ title: 'Aufgabe lokal gespeichert' })
    },
    onError: (error) =>
      toast({
        title: 'Aufgabe konnte nicht gespeichert werden',
        description: error.message,
        variant: 'destructive'
      })
  })
  const updateTask = useMutation({
    mutationFn: (task: CollaborationTask) =>
      collaboration('updateTask', {
        groupId: groupId!,
        taskId: task.id,
        status: task.status === 'done' ? 'open' : 'done'
      }),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: ['collaboration', 'tasks', groupId] }),
    onError: (error) =>
      toast({
        title: 'Aufgabe konnte nicht geändert werden',
        description: error.message,
        variant: 'destructive'
      })
  })
  const deleteTask = useMutation({
    mutationFn: (taskId: string) => collaboration('deleteTask', { groupId: groupId!, taskId }),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: ['collaboration', 'tasks', groupId] }),
    onError: (error) =>
      toast({
        title: 'Aufgabe konnte nicht gelöscht werden',
        description: error.message,
        variant: 'destructive'
      })
  })

  if (!state.data?.signedIn) {
    return (
      <Card>
        <CardContent className="py-8">
          <p>Melde dich zuerst für synchronisierte Gruppen an.</p>
          <Button className="mt-4" onClick={() => setLocation('/gruppen-sync')}>
            Zur Übersicht
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6 pb-10">
      <Button variant="ghost" onClick={() => setLocation('/gruppen-sync')}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Gruppenübersicht
      </Button>
      {!group.data ? (
        <Card>
          <CardContent className="py-8">
            {group.isError
              ? 'Diese Gruppe ist lokal noch nicht verfügbar oder du bist kein Mitglied.'
              : 'Gruppe wird synchronisiert …'}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-serif text-4xl font-bold">{group.data.name}</h1>
              <p className="mt-2 text-muted-foreground">{group.data.description}</p>
            </div>
            <CloudStatus connected={state.data.connected} />
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Gemeinsame Aufgaben</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <form
                  className="space-y-3 rounded-lg border p-4"
                  onSubmit={(event) => {
                    event.preventDefault()
                    createTask.mutate()
                  }}
                >
                  <Input
                    aria-label="Aufgabentitel"
                    placeholder="Neue Aufgabe"
                    value={taskTitle}
                    onChange={(event) => setTaskTitle(event.target.value)}
                    required
                    maxLength={200}
                  />
                  <Textarea
                    aria-label="Aufgabenbeschreibung"
                    placeholder="Beschreibung (optional)"
                    value={taskDescription}
                    onChange={(event) => setTaskDescription(event.target.value)}
                    maxLength={4000}
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <select
                      aria-label="Zuständige Person"
                      className="h-10 rounded-md border bg-background px-3 text-sm"
                      value={taskAssignee}
                      onChange={(event) => setTaskAssignee(event.target.value)}
                    >
                      <option value="">Niemandem zuweisen</option>
                      {members.data?.map((member) => (
                        <option key={member.userId} value={member.userId}>
                          {member.displayName}
                        </option>
                      ))}
                    </select>
                    <Input
                      aria-label="Fälligkeitsdatum"
                      type="datetime-local"
                      value={taskDueDate}
                      onChange={(event) => setTaskDueDate(event.target.value)}
                    />
                  </div>
                  <Button type="submit" disabled={createTask.isPending || !taskTitle.trim()}>
                    <Plus className="mr-2 h-4 w-4" /> Aufgabe hinzufügen
                  </Button>
                </form>
                {tasks.data?.length === 0 && (
                  <p className="text-muted-foreground">Noch keine Aufgaben.</p>
                )}
                {tasks.data?.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    members={members.data ?? []}
                    onToggle={() => updateTask.mutate(task)}
                    onDelete={() => deleteTask.mutate(task.id)}
                  />
                ))}
              </CardContent>
            </Card>
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Mitglieder</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {members.data?.map((member) => (
                    <div key={member.id} className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{member.displayName}</span>
                      <span className="text-xs text-muted-foreground">
                        {member.role === 'owner' ? 'Besitzer' : 'Mitglied'}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
              {group.data.myRole === 'owner' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Person einladen</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Suche nach Benutzername oder Anzeigename. Einladen erfordert eine Verbindung.
                    </p>
                    <Input
                      aria-label="Person suchen"
                      placeholder="Mindestens 2 Zeichen"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                    />
                    {candidates.data?.map((candidate) => (
                      <div
                        key={candidate.id}
                        className="flex items-center justify-between gap-2 rounded-md border p-2 text-sm"
                      >
                        <span>
                          {candidate.displayName}{' '}
                          <span className="text-muted-foreground">@{candidate.username}</span>
                        </span>
                        <Button
                          size="sm"
                          disabled={invite.isPending}
                          onClick={() => invite.mutate(candidate.id)}
                        >
                          Einladen
                        </Button>
                      </div>
                    ))}
                    {search.trim().length >= 2 && candidates.data?.length === 0 && (
                      <p className="text-sm text-muted-foreground">Keine verfügbaren Personen.</p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
