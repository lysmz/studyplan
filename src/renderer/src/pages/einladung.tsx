import { useState } from 'react'
import { Link, useLocation, useRoute } from 'wouter'
import { useQueryClient } from '@tanstack/react-query'
import {
  getGetGroupInviteQueryKey,
  getListGroupsQueryKey,
  useGetGroupInvite,
  useJoinGroup
} from '@/api'
import { ArrowRight, Check, Loader2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useGetMe } from '@/api'
import { useToast } from '@/hooks/use-toast'

export default function Einladung() {
  const [, params] = useRoute('/einladung/:token')
  const token = params?.token ?? ''
  const {
    data: invite,
    isLoading,
    isError
  } = useGetGroupInvite(token, {
    query: { enabled: Boolean(token), queryKey: getGetGroupInviteQueryKey(token) }
  })
  const { data: user } = useGetMe()
  const join = useJoinGroup()
  const queryClient = useQueryClient()
  const [, setLocation] = useLocation()
  const { toast } = useToast()
  const [joinedId, setJoinedId] = useState<number | null>(null)

  const handleJoin = () =>
    join.mutate(
      { token },
      {
        onSuccess: (group) => {
          setJoinedId(group.id)
          queryClient.invalidateQueries({ queryKey: getListGroupsQueryKey() })
          toast({ title: 'Du bist beigetreten', description: `Willkommen in ${group.name}.` })
        },
        onError: () => toast({ title: 'Beitritt nicht möglich', variant: 'destructive' })
      }
    )
  if (isLoading)
    return (
      <div className="flex min-h-[70dvh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  return (
    <div className="flex min-h-[70dvh] items-center justify-center py-10">
      <Card className="w-full max-w-lg border-primary/15 shadow-xl">
        <CardHeader className="items-center pb-3 text-center">
          <div className="mb-4 rounded-2xl bg-secondary p-4 text-primary">
            <Users className="h-9 w-9" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/70">
            Einladung
          </p>
          <CardTitle className="font-serif text-3xl">
            {isError
              ? 'Einladung nicht verfügbar'
              : invite
                ? `Beitritt zu ${invite.groupName}`
                : 'Einladung'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          {isError ? (
            <p className="text-muted-foreground">
              Dieser Einladungslink ist ungültig oder nicht mehr aktiv.
            </p>
          ) : invite ? (
            <>
              <p className="text-muted-foreground">
                {invite.description ||
                  'Du wurdest eingeladen, gemeinsam im Studienplaner zu arbeiten.'}
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4 text-primary" /> {invite.memberCount}{' '}
                {invite.memberCount === 1 ? 'Mitglied' : 'Mitglieder'}
              </div>
              {joinedId ? (
                <Button
                  className="w-full gap-2"
                  onClick={() => setLocation(`/gruppen/${joinedId}`)}
                >
                  <Check className="h-4 w-4" /> Zur Gruppe
                </Button>
              ) : user ? (
                <Button
                  data-testid="button-join-group"
                  className="w-full gap-2"
                  onClick={handleJoin}
                  disabled={join.isPending}
                >
                  {join.isPending ? 'Beitritt wird vorbereitet …' : 'Gruppe beitreten'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button asChild className="w-full">
                  <Link href={`/login?redirect=/einladung/${token}`}>Anmelden und beitreten</Link>
                </Button>
              )}
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
