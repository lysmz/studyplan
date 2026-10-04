import { useState } from 'react'
import type { JSX, ReactNode } from 'react'
import { Link, useLocation, useParams } from 'wouter'
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  ClipboardList,
  FileText,
  FolderKanban,
  Mail,
  Pencil,
  Plus,
  Trash2,
  UserMinus,
  UserPlus,
  Users,
  X
} from 'lucide-react'
import type {
  CollaborationMember,
  CollaborationState,
  CollaborationTask
} from '../../../shared/collaboration/ipc'
import {
  useCollaborationCandidates,
  useCollaborationGroup,
  useCollaborationGroups,
  useCollaborationInvitations,
  useCollaborationMembers,
  useCollaborationSignIn,
  useCollaborationSignOut,
  useCollaborationState,
  useCollaborationTasks,
  useCreateCollaborationGroup,
  useCreateCollaborationTask,
  useDeleteCollaborationTask,
  useRespondCollaborationInvitation,
  useSendCollaborationInvitation,
  useUpdateCollaborationTask
} from '@/api/collaboration'
import { UploadStatus } from '@/collaboration/upload-status'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'

function SignIn(): JSX.Element {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { toast } = useToast()
  const signIn = useCollaborationSignIn({
    onSuccess: () => {
      setPassword('')
    },
    onError: (error) =>
      toast({
        title: 'Anmeldung fehlgeschlagen',
        description: error.message,
        variant: 'destructive'
      })
  })

  return (
    <Card className="max-w-xl border-primary/10 shadow-sm">
      <CardHeader>
        <CardTitle className="font-serif text-2xl">Bei synchronisierten Gruppen anmelden</CardTitle>
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
            signIn.mutate({ email, password })
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

function AccountSwitch(): JSX.Element {
  const { toast } = useToast()
  const signOut = useCollaborationSignOut({
    onError: (error) =>
      toast({
        title: 'Abmeldung fehlgeschlagen',
        description: error.message,
        variant: 'destructive'
      })
  })
  return (
    <Button variant="outline" onClick={() => signOut.mutate({})} disabled={signOut.isPending}>
      {signOut.isPending ? 'Wird abgemeldet …' : 'Online-Konto wechseln'}
    </Button>
  )
}

function SyncStatus({ state }: { state: CollaborationState }): JSX.Element {
  return (
    <div className="rounded-xl border border-primary/10 bg-card px-5 py-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-primary/70">
        Übertragungsstatus · alle Gruppen
      </p>
      <UploadStatus state={state} />
    </div>
  )
}

function LoadingRows(): JSX.Element {
  return (
    <div className="space-y-3" role="status" aria-label="Wird geladen">
      <Skeleton className="h-16 rounded-xl" />
      <Skeleton className="h-16 rounded-xl" />
    </div>
  )
}

function QueryError({ message, retry }: { message: string; retry: () => void }): JSX.Element {
  return (
    <div className="space-y-3 rounded-xl border border-destructive/20 p-5 text-center">
      <p>{message}</p>
      <Button variant="outline" onClick={retry}>
        Erneut versuchen
      </Button>
    </div>
  )
}

function PanelCard({
  title,
  description,
  icon: Icon,
  action,
  children
}: {
  title: string
  description: string
  icon: typeof Users
  action?: ReactNode
  children: ReactNode
}): JSX.Element {
  return (
    <Card className="border-primary/10 shadow-sm">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
        <div className="flex gap-3">
          <div className="self-start rounded-xl bg-secondary p-2.5 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="font-serif text-2xl">{title}</CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
        </div>
        {action}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

export default function GruppenSync(): JSX.Element {
  const state = useCollaborationState()
  const [, setLocation] = useLocation()
  const { toast } = useToast()
  const [createOpen, setCreateOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const groups = useCollaborationGroups(state.data?.signedIn === true)
  const invitations = useCollaborationInvitations(state.data?.signedIn === true)
  const create = useCreateCollaborationGroup({
    onSuccess: (group) => {
      setCreateOpen(false)
      setName('')
      setDescription('')
      setLocation(`/gruppen-sync/${group.id}`)
    },
    onError: (error) =>
      toast({
        title: 'Gruppe konnte nicht angelegt werden',
        description: error.message,
        variant: 'destructive'
      })
  })
  const respond = useRespondCollaborationInvitation({
    onError: (error) =>
      toast({
        title: 'Einladung konnte nicht beantwortet werden',
        description: error.message,
        variant: 'destructive'
      })
  })

  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-500">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
            Gemeinsam studieren
          </p>
          <h1 className="mt-2 font-serif text-4xl font-bold tracking-tight">
            Synchronisierte Gruppen
          </h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Euer gemeinsamer Studienraum. Aufgaben bleiben auch offline verfügbar.
          </p>
        </div>
        {state.data?.signedIn && (
          <div className="flex shrink-0 flex-wrap gap-2">
            <AccountSwitch />
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" /> Gruppe anlegen
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-serif text-2xl">Neue Studiengruppe</DialogTitle>
                  <DialogDescription>Lege einen gemeinsamen Studienraum an.</DialogDescription>
                </DialogHeader>
                <form
                  className="space-y-4"
                  onSubmit={(event) => {
                    event.preventDefault()
                    if (!name.trim()) return
                    create.mutate({
                      name: name.trim(),
                      description: description.trim() || undefined
                    })
                  }}
                >
                  <div className="space-y-2">
                    <Label htmlFor="sync-group-name">Name</Label>
                    <Input
                      id="sync-group-name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="z. B. Statistik Lerngruppe"
                      required
                      maxLength={120}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sync-group-description">Beschreibung (optional)</Label>
                    <Textarea
                      id="sync-group-description"
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      placeholder="Woran arbeitet ihr gerade?"
                      rows={4}
                      maxLength={2000}
                    />
                  </div>
                  <Button className="w-full" disabled={create.isPending || !name.trim()}>
                    {create.isPending ? 'Wird angelegt …' : 'Gruppe anlegen'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {state.isLoading ? (
        <LoadingRows />
      ) : state.isError ? (
        <QueryError
          message="Der Gruppenstatus konnte nicht geladen werden."
          retry={() => void state.refetch()}
        />
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
          <SyncStatus state={state.data} />
          <PanelCard
            title="Einladungen"
            description="Hier beginnt euer nächstes gemeinsames Lernprojekt. Einladungen erfordern eine Verbindung."
            icon={Mail}
          >
            {invitations.isError && invitations.data && (
              <QueryError
                message="Einladungen konnten nicht aktualisiert werden."
                retry={() => void invitations.refetch()}
              />
            )}
            {invitations.isLoading ? (
              <LoadingRows />
            ) : invitations.isError && !invitations.data ? (
              <QueryError
                message="Einladungen konnten nicht geladen werden."
                retry={() => void invitations.refetch()}
              />
            ) : invitations.data?.length === 0 ? (
              <p className="text-sm text-muted-foreground">Keine offenen Einladungen.</p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {invitations.data?.map((invitation) => (
                  <div key={invitation.id} className="rounded-xl border p-4">
                    <p className="font-medium">
                      Einladung von {invitation.inviterName ?? 'einem Gruppenmitglied'}
                    </p>
                    <p className="mb-4 mt-1 text-sm text-muted-foreground">
                      Nach der Annahme erscheint die Gruppe hier.
                    </p>
                    <div className="flex flex-wrap gap-2">
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
              </div>
            )}
          </PanelCard>
          <section className="space-y-4" aria-label="Meine Gruppen">
            <h2 className="font-serif text-2xl font-semibold">Meine Gruppen</h2>
            {groups.isError && groups.data && (
              <QueryError
                message="Gruppen konnten nicht aktualisiert werden."
                retry={() => void groups.refetch()}
              />
            )}
            {groups.isLoading ? (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                <Skeleton className="h-60 rounded-2xl" />
                <Skeleton className="h-60 rounded-2xl" />
              </div>
            ) : groups.isError && !groups.data ? (
              <QueryError
                message="Gruppen konnten nicht geladen werden."
                retry={() => void groups.refetch()}
              />
            ) : groups.data?.length ? (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {groups.data.map((group) => (
                  <Link key={group.id} href={'/gruppen-sync/' + group.id} className="group block">
                    <Card className="h-full overflow-hidden border-primary/10 transition-all duration-300 group-hover:-translate-y-1 group-hover:border-primary/35 group-hover:shadow-lg">
                      <div className="h-2 bg-primary" />
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div className="rounded-xl bg-secondary p-3 text-primary">
                            <FolderKanban className="h-5 w-5" />
                          </div>
                          <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                        </div>
                        <CardTitle className="break-words pt-2 font-serif text-2xl">
                          {group.name}
                        </CardTitle>
                        <CardDescription className="line-clamp-2 min-h-10">
                          {group.description || 'Ein gemeinsamer Platz für euren Studienalltag.'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex items-center gap-2 border-t bg-muted/20 pt-4 text-sm text-muted-foreground">
                        <Users className="h-4 w-4 text-primary" />
                        {group.myRole === 'owner' ? 'Eigentümer' : 'Mitglied'}
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <Card className="border-dashed border-primary/25 bg-primary/[0.025]">
                <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="mb-5 rounded-2xl bg-secondary p-4 text-primary">
                    <Users className="h-8 w-8" />
                  </div>
                  <h3 className="font-serif text-2xl font-semibold">Noch keine Studiengruppe</h3>
                  <p className="mt-2 max-w-sm text-muted-foreground">
                    Gründe einen Raum für dein nächstes gemeinsames Lernprojekt oder nimm eine
                    Einladung an.
                  </p>
                  <Button onClick={() => setCreateOpen(true)} className="mt-6 gap-2">
                    <Plus className="h-4 w-4" /> Erste Gruppe anlegen
                  </Button>
                </CardContent>
              </Card>
            )}
          </section>
        </>
      )}
    </div>
  )
}

function TaskItem({
  task,
  members,
  busy,
  onToggle,
  onEdit,
  onDelete
}: {
  task: CollaborationTask
  members: CollaborationMember[]
  busy: boolean
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
}): JSX.Element {
  const assignee = members.find((member) => member.userId === task.assigneeId)
  const done = task.status === 'done'
  return (
    <div
      className={
        'flex items-start gap-3 rounded-xl border p-4 ' + (done ? 'bg-muted/30' : 'bg-card')
      }
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={done}
        aria-label={'Aufgabe ' + task.title + (done ? ' öffnen' : ' erledigen')}
        disabled={busy}
        onClick={onToggle}
        className={
          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 ' +
          (done ? 'border-primary bg-primary text-primary-foreground' : 'border-primary/30')
        }
      >
        {done && <Check className="h-3.5 w-3.5" />}
      </button>
      <div className="min-w-0 flex-1">
        <p
          className={
            'break-words font-medium ' + (done ? 'line-through text-muted-foreground' : '')
          }
        >
          {task.title}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {assignee && assignee.displayName + ' · '}
          {task.dueDate ? new Date(task.dueDate).toLocaleString('de-DE') : 'Ohne Termin'}
        </p>
        {task.description && (
          <p className="mt-2 whitespace-pre-wrap break-words text-sm text-foreground/75">
            {task.description}
          </p>
        )}
      </div>
      <div className="flex shrink-0 flex-wrap gap-1">
        <Button
          size="icon"
          variant="ghost"
          onClick={onEdit}
          aria-label={'Aufgabe ' + task.title + ' bearbeiten'}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          disabled={busy}
          className="text-muted-foreground hover:text-destructive"
          onClick={onDelete}
          aria-label={'Aufgabe ' + task.title + ' löschen'}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export function GruppenSyncDetail(): JSX.Element {
  const { id: groupId } = useParams<{ id: string }>()
  const [, setLocation] = useLocation()
  const { toast } = useToast()
  const state = useCollaborationState()
  const [tab, setTab] = useState('aufgaben')
  const [taskOpen, setTaskOpen] = useState(false)
  const [stubFeature, setStubFeature] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDescription, setTaskDescription] = useState('')
  const [taskAssignee, setTaskAssignee] = useState('')
  const [taskDueDate, setTaskDueDate] = useState('')
  const enabled = state.data?.signedIn === true && Boolean(groupId)
  const group = useCollaborationGroup(groupId, enabled)
  const members = useCollaborationMembers(groupId, enabled && group.isSuccess)
  const tasks = useCollaborationTasks(groupId, enabled && group.isSuccess)
  const candidates = useCollaborationCandidates(
    groupId,
    search,
    enabled && group.data?.myRole === 'owner'
  )
  const invite = useSendCollaborationInvitation({
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
  const createTask = useCreateCollaborationTask({
    onSuccess: () => {
      setTaskOpen(false)
      setTaskTitle('')
      setTaskDescription('')
      setTaskAssignee('')
      setTaskDueDate('')
      toast({ title: 'Aufgabe lokal gespeichert' })
    },
    onError: (error) =>
      toast({
        title: 'Aufgabe konnte nicht gespeichert werden',
        description: error.message,
        variant: 'destructive'
      })
  })
  const updateTask = useUpdateCollaborationTask({
    onError: (error) =>
      toast({
        title: 'Aufgabe konnte nicht geändert werden',
        description: error.message,
        variant: 'destructive'
      })
  })
  const deleteTask = useDeleteCollaborationTask({
    onError: (error) =>
      toast({
        title: 'Aufgabe konnte nicht gelöscht werden',
        description: error.message,
        variant: 'destructive'
      })
  })

  if (state.isLoading) return <LoadingRows />
  if (state.isError && !state.data)
    return (
      <QueryError
        message="Der Gruppenstatus konnte nicht geladen werden."
        retry={() => void state.refetch()}
      />
    )
  if (!state.data?.signedIn)
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p>Melde dich zuerst für synchronisierte Gruppen an.</p>
          <Button className="mt-4" onClick={() => setLocation('/gruppen-sync')}>
            Zur Übersicht
          </Button>
        </CardContent>
      </Card>
    )

  const owner = group.data?.myRole === 'owner'
  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" onClick={() => setLocation('/gruppen-sync')}>
          <ArrowLeft className="mr-2 h-5 w-5" /> Gruppenübersicht
        </Button>
        <AccountSwitch />
      </div>
      {!group.data ? (
        <Card>
          <CardContent className="py-12 text-center">
            {group.isError ? (
              <QueryError
                message="Diese Gruppe ist lokal noch nicht verfügbar oder du bist kein Mitglied."
                retry={() => void group.refetch()}
              />
            ) : (
              <p role="status">Gruppe wird synchronisiert …</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <section className="rounded-2xl bg-primary p-6 text-primary-foreground shadow-lg md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2 text-primary-foreground/70">
                <Users className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-[0.2em]">
                  {members.data
                    ? members.data.length +
                      (members.data.length === 1 ? ' Mitglied' : ' Mitglieder')
                    : 'Studiengruppe'}
                  {' · '}
                  {owner ? 'Eigentümer' : 'Mitglied'}
                </span>
              </div>
              <h1 className="break-words font-serif text-4xl font-bold tracking-tight">
                {group.data.name}
              </h1>
              <p className="mt-2 max-w-2xl break-words text-primary-foreground/75">
                {group.data.description || 'Euer gemeinsamer Studienraum.'}
              </p>
            </div>
            {owner && (
              <div className="flex shrink-0 flex-wrap gap-2">
                <Button variant="secondary" className="gap-2" onClick={() => setTab('mitglieder')}>
                  <UserPlus className="h-4 w-4" /> Einladen
                </Button>
                <Button
                  variant="outline"
                  className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                  onClick={() => setStubFeature('Gruppe bearbeiten')}
                >
                  <Pencil className="mr-2 h-4 w-4" /> Bearbeiten
                </Button>
              </div>
            )}
          </div>
        </section>
      )}
      <SyncStatus state={state.data} />
      {group.data && (
        <>
          <Tabs value={tab} onValueChange={setTab} className="space-y-5">
            <TabsList className="grid h-auto w-full grid-cols-4 bg-secondary/60 p-1">
              <TabsTrigger value="termine" className="gap-2 px-2 py-2.5">
                <CalendarDays className="hidden h-4 w-4 sm:block" /> Termine
              </TabsTrigger>
              <TabsTrigger value="aufgaben" className="gap-2 px-2 py-2.5">
                <ClipboardList className="hidden h-4 w-4 sm:block" /> Aufgaben
              </TabsTrigger>
              <TabsTrigger value="notizen" className="gap-2 px-2 py-2.5">
                <FileText className="hidden h-4 w-4 sm:block" /> Notizen
              </TabsTrigger>
              <TabsTrigger value="mitglieder" className="gap-2 px-2 py-2.5">
                <Users className="hidden h-4 w-4 sm:block" /> Mitglieder
              </TabsTrigger>
            </TabsList>
            <TabsContent value="termine">
              <PanelCard
                title="Termine"
                description="Eure gemeinsamen Lerntermine."
                icon={CalendarDays}
              >
                <p className="py-12 text-center text-muted-foreground">not implemented</p>
              </PanelCard>
            </TabsContent>
            <TabsContent value="aufgaben">
              <PanelCard
                title="Aufgaben"
                description="Haltet fest, was als Nächstes ansteht."
                icon={ClipboardList}
                action={
                  <Button size="sm" className="gap-2" onClick={() => setTaskOpen(true)}>
                    <Plus className="h-4 w-4" /> Aufgabe
                  </Button>
                }
              >
                {tasks.isError && (
                  <QueryError
                    message="Aufgaben konnten nicht geladen werden."
                    retry={() => void tasks.refetch()}
                  />
                )}
                {tasks.isLoading ? (
                  <LoadingRows />
                ) : tasks.data?.length ? (
                  <div className="space-y-3">
                    {tasks.data.map((task) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        members={members.data ?? []}
                        busy={
                          (updateTask.isPending && updateTask.variables?.taskId === task.id) ||
                          (deleteTask.isPending && deleteTask.variables?.taskId === task.id)
                        }
                        onToggle={() =>
                          updateTask.mutate({
                            groupId: groupId!,
                            taskId: task.id,
                            status: task.status === 'done' ? 'open' : 'done'
                          })
                        }
                        onEdit={() => setStubFeature('Aufgabe bearbeiten')}
                        onDelete={() => deleteTask.mutate({ groupId: groupId!, taskId: task.id })}
                      />
                    ))}
                  </div>
                ) : !tasks.isError ? (
                  <p className="py-12 text-center text-muted-foreground">
                    Noch keine Aufgaben in dieser Gruppe.
                  </p>
                ) : null}
              </PanelCard>
            </TabsContent>
            <TabsContent value="notizen">
              <PanelCard
                title="Notizen & Links"
                description="Ein gemeinsamer Platz für eure Gedanken und Materialien."
                icon={FileText}
              >
                <p className="py-12 text-center text-muted-foreground">not implemented</p>
              </PanelCard>
            </TabsContent>
            <TabsContent value="mitglieder" className="space-y-5">
              <PanelCard
                title="Mitglieder"
                description="Wer gerade an eurem Studienprojekt arbeitet."
                icon={Users}
              >
                {members.isError && (
                  <QueryError
                    message="Mitglieder konnten nicht geladen werden."
                    retry={() => void members.refetch()}
                  />
                )}
                {members.isLoading ? (
                  <LoadingRows />
                ) : (
                  <div className="space-y-2">
                    {members.data?.map((member) => (
                      <div
                        key={member.id}
                        className="flex flex-wrap items-center gap-3 rounded-xl border p-3"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary font-serif font-semibold text-primary">
                          {member.displayName.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{member.displayName}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            @{member.username}
                          </p>
                        </div>
                        <Badge variant={member.role === 'owner' ? 'default' : 'secondary'}>
                          {member.role === 'owner' ? 'Eigentümer' : 'Mitglied'}
                        </Badge>
                        {owner && member.role !== 'owner' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive"
                            aria-label={member.displayName + ' aus der Gruppe entfernen'}
                            onClick={() => setStubFeature('Mitglied entfernen')}
                          >
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </PanelCard>
              {owner && (
                <PanelCard
                  title="Person einladen"
                  description="Suche nach Benutzername oder Anzeigename. Einladen erfordert eine Verbindung."
                  icon={UserPlus}
                >
                  <div className="space-y-3">
                    <Label htmlFor="sync-person-search">Person suchen</Label>
                    <Input
                      id="sync-person-search"
                      placeholder="Mindestens 2 Zeichen"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                    />
                    {candidates.isFetching && (
                      <p className="text-sm text-muted-foreground">Wird gesucht …</p>
                    )}
                    {candidates.isError && (
                      <QueryError
                        message="Personen konnten nicht gesucht werden. Bitte prüfe deine Verbindung."
                        retry={() => void candidates.refetch()}
                      />
                    )}
                    {candidates.data?.map((candidate) => (
                      <div
                        key={candidate.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 text-sm"
                      >
                        <div className="min-w-0">
                          <p className="break-words font-medium">{candidate.displayName}</p>
                          <p className="break-words text-muted-foreground">@{candidate.username}</p>
                        </div>
                        <Button
                          size="sm"
                          disabled={invite.isPending}
                          onClick={() =>
                            invite.mutate({ groupId: groupId!, inviteeId: candidate.id })
                          }
                        >
                          Einladen
                        </Button>
                      </div>
                    ))}
                    {search.trim().length >= 2 && candidates.data?.length === 0 && (
                      <p className="text-sm text-muted-foreground">Keine verfügbaren Personen.</p>
                    )}
                  </div>
                </PanelCard>
              )}
            </TabsContent>
          </Tabs>
          <Card className="border-destructive/20">
            <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">{owner ? 'Gruppe verwalten' : 'Nicht mehr dabei?'}</p>
                <p className="text-sm text-muted-foreground">
                  {owner
                    ? 'Einstellungen für euren gemeinsamen Studienraum.'
                    : 'Deine Mitgliedschaft in dieser Gruppe.'}
                </p>
              </div>
              <Button
                variant="outline"
                className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setStubFeature(owner ? 'Gruppe löschen' : 'Gruppe verlassen')}
              >
                <Trash2 className="h-4 w-4" /> {owner ? 'Gruppe löschen' : 'Gruppe verlassen'}
              </Button>
            </CardContent>
          </Card>
          <Dialog open={taskOpen} onOpenChange={setTaskOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-serif text-2xl">Neue Aufgabe</DialogTitle>
                <DialogDescription>
                  Die Aufgabe wird zuerst auf diesem Gerät gespeichert.
                </DialogDescription>
              </DialogHeader>
              <form
                className="space-y-4"
                onSubmit={(event) => {
                  event.preventDefault()
                  if (!taskTitle.trim()) return
                  createTask.mutate({
                    groupId: groupId!,
                    title: taskTitle.trim(),
                    description: taskDescription.trim() || null,
                    assigneeId: taskAssignee || null,
                    dueDate: taskDueDate ? new Date(taskDueDate).toISOString() : null
                  })
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="sync-task-title">Titel</Label>
                  <Input
                    id="sync-task-title"
                    value={taskTitle}
                    onChange={(event) => setTaskTitle(event.target.value)}
                    required
                    maxLength={200}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sync-task-description">Beschreibung (optional)</Label>
                  <Textarea
                    id="sync-task-description"
                    value={taskDescription}
                    onChange={(event) => setTaskDescription(event.target.value)}
                    maxLength={4000}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="sync-task-assignee">Zuständige Person</Label>
                    <select
                      id="sync-task-assignee"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
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
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sync-task-due-date">Fälligkeitsdatum</Label>
                    <Input
                      id="sync-task-due-date"
                      type="datetime-local"
                      value={taskDueDate}
                      onChange={(event) => setTaskDueDate(event.target.value)}
                    />
                  </div>
                </div>
                <Button className="w-full" disabled={createTask.isPending || !taskTitle.trim()}>
                  {createTask.isPending ? 'Wird gespeichert …' : 'Aufgabe hinzufügen'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog
            open={stubFeature !== null}
            onOpenChange={(open) => {
              if (!open) setStubFeature(null)
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-serif text-2xl">{stubFeature}</DialogTitle>
                <DialogDescription>not implemented</DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  )
}
