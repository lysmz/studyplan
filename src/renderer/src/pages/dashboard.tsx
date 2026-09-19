import { Link } from "wouter";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { 
  useGetDashboardStats, 
  useGetDashboardUpcoming, 
  useGetDashboardActivity 
  ,useGetGroupsActivity
} from "@/api";
import { 
  Plus, 
  GraduationCap, 
  Calendar as CalendarIcon, 
  Clock, 
  Trophy,
  ArrowRight,
  History,
  AlertCircle
  ,Users as UsersIcon
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: upcoming, isLoading: upcomingLoading } = useGetDashboardUpcoming();
  const { data: activity, isLoading: activityLoading } = useGetDashboardActivity();
  const { data: groupActivity, isLoading: groupActivityLoading } = useGetGroupsActivity();

  return (
    <div className="space-y-8 pb-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Cockpit</h1>
          <p className="text-muted-foreground mt-1">Willkommen zurück. Hier ist dein aktueller Stand.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="gap-2">
            <Link href="/noten">
              <GraduationCap className="w-4 h-4" />
              Note eintragen
            </Link>
          </Button>
          <Button asChild className="gap-2">
            <Link href="/kalender">
              <Plus className="w-4 h-4" />
              Neues Event
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Notenschnitt" 
          value={stats?.gpa ? stats.gpa.toFixed(2) : "—"} 
          icon={Trophy}
          description="Gewichteter Schnitt"
          loading={statsLoading}
          highlight={true}
        />
        <StatCard 
          title="ECTS Punkte" 
          value={stats?.totalEcts ?? 0} 
          icon={GraduationCap}
          description="Erreichte Credits"
          loading={statsLoading}
        />
        <StatCard 
          title="Nächste Fristen" 
          value={stats?.upcomingDeadlinesCount ?? 0} 
          icon={AlertCircle}
          description="In den nächsten 7 Tagen"
          loading={statsLoading}
          alert={(stats?.upcomingDeadlinesCount ?? 0) > 0}
        />
        <StatCard 
          title="Eingetragene Noten" 
          value={stats?.gradesCount ?? 0} 
          icon={History}
          description="Abgeschlossene Kurse"
          loading={statsLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content: Upcoming Events */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-md bg-card/50 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <CardTitle className="font-serif text-xl">Demnächst</CardTitle>
                <CardDescription>Deine Termine der nächsten 7 Tage</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
                <Link href="/kalender">
                  Kompletter Kalender <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {upcomingLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
                </div>
              ) : upcoming && upcoming.length > 0 ? (
                <div className="space-y-3">
                  {upcoming.map((event) => {
                    const date = event.startDate;
                    return (
                      <div key={event.id} className="flex gap-4 p-4 rounded-xl border bg-card hover:border-primary/20 transition-colors group">
                        <div className="flex flex-col items-center justify-center min-w-14 rounded-lg bg-primary/5 text-primary p-2">
                          <span className="text-xs font-medium uppercase">{format(date, 'MMM', { locale: de })}</span>
                          <span className="text-xl font-bold leading-none">{format(date, 'dd')}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-semibold text-foreground truncate">{event.title}</h4>
                            <EventTypeBadge type={event.type} importance={event.importance} />
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground mt-1 gap-3">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {format(date, 'HH:mm')}
                            </span>
                            {event.location && (
                              <span className="flex items-center gap-1 truncate">
                                <span className="w-1 h-1 rounded-full bg-muted-foreground/30"></span>
                                {event.location}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <div className="bg-primary/5 p-4 rounded-full mb-3">
                    <CalendarIcon className="w-8 h-8 text-primary/40" />
                  </div>
                  <p className="font-medium text-foreground">Keine anstehenden Termine</p>
                  <p className="text-sm mt-1">Die nächsten 7 Tage sind frei.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: Recent Activity */}
        <div className="space-y-6">
          <Card className="border-none shadow-md h-full">
            <CardHeader className="pb-4">
              <CardTitle className="font-serif text-xl flex items-center gap-2">
                <History className="w-5 h-5 text-primary" />
                Aktivität
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activityLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : activity && activity.length > 0 ? (
                <div className="relative space-y-4 before:absolute before:inset-y-0 before:right-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                  {activity.map((item) => (
                    <div key={item.id} className="relative flex items-center gap-4 py-2">
                      <div className="absolute right-0 z-10 h-4 w-4 translate-x-1/2 rounded-full border-2 border-background bg-primary/20" />
                      <div className="flex min-w-0 flex-1 flex-col pr-6">
                        <p className="text-sm text-foreground">{item.description}</p>
                        <span className="text-xs text-muted-foreground mt-0.5">
                          {format(item.createdAt, 'dd.MM.yyyy HH:mm')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Noch keine Aktivitäten.</p>
              )}
            </CardContent>
          </Card>
          <Card className="border-none shadow-md">
            <CardHeader className="pb-4">
              <CardTitle className="font-serif text-xl flex items-center gap-2">
                <UsersIcon className="w-5 h-5 text-primary" />
                Gruppenaktivität
              </CardTitle>
              <CardDescription>Was sich in deinen Gruppen bewegt</CardDescription>
            </CardHeader>
            <CardContent>
              {groupActivityLoading ? (
                <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : groupActivity && groupActivity.length > 0 ? (
                <div className="space-y-3">
                  {groupActivity.slice(0, 5).map((item) => (
                    <Link href={`/gruppen/${item.groupId}`} key={item.id} data-testid={`link-group-activity-${item.id}`} className="block rounded-lg p-2 transition-colors hover:bg-secondary/60">
                      <p className="text-sm font-medium">{item.description}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{item.groupName} · {item.actorName}</p>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="py-5 text-center text-sm text-muted-foreground">Noch keine Aktivitäten in deinen Gruppen.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, description, icon: Icon, loading, highlight, alert }: any) {
  return (
    <Card className={`border-none shadow-sm relative overflow-hidden transition-all hover:shadow-md ${highlight ? 'bg-primary text-primary-foreground' : 'bg-card'}`}>
      {highlight && <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />}
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className={`text-sm font-medium ${highlight ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
          {title}
        </CardTitle>
        <Icon className={`w-4 h-4 ${highlight ? 'text-primary-foreground/80' : alert ? 'text-destructive' : 'text-primary'}`} />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-16 mb-1" />
        ) : (
          <div className="text-3xl font-serif font-bold tracking-tight">
            {value}
          </div>
        )}
        <p className={`text-xs mt-1 ${highlight ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

function EventTypeBadge({ type, importance }: { type: string, importance: string }) {
  const getColors = () => {
    switch (type) {
      case 'exam': return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800";
      case 'deadline': return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800";
      case 'registration': return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800";
      case 'lecture': return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800";
      default: return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800";
    }
  };

  const getLabel = () => {
    switch (type) {
      case 'exam': return "Prüfung";
      case 'deadline': return "Frist";
      case 'registration': return "Anmeldung";
      case 'lecture': return "Vorlesung";
      default: return "Sonstiges";
    }
  };

  return (
    <Badge variant="outline" className={`font-normal ${getColors()} ${importance === 'high' ? 'font-bold' : ''}`}>
      {getLabel()}
    </Badge>
  );
}
