import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { getListGroupsQueryKey, useCreateGroup, useListGroups } from "@workspace/api-client-react";
import { ArrowRight, FolderKanban, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function Gruppen() {
  const { data: groups, isLoading, isError, refetch } = useListGroups();
  const createGroup = useCreateGroup();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    createGroup.mutate({ data: { name: name.trim(), description: description.trim() || undefined } }, {
      onSuccess: (group) => {
        queryClient.invalidateQueries({ queryKey: getListGroupsQueryKey() });
        setOpen(false); setName(""); setDescription("");
        toast({ title: "Gruppe angelegt", description: "Der gemeinsame Arbeitsraum ist bereit." });
        setLocation(`/gruppen/${group.id}`);
      },
      onError: () => toast({ title: "Gruppe konnte nicht angelegt werden", variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-500">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">Gemeinsam studieren</p>
          <h1 className="mt-2 font-serif text-4xl font-bold tracking-tight">Studiengruppen</h1>
          <p className="mt-2 max-w-xl text-muted-foreground">Orte für Absprachen, Lerntermine und den kleinen Schubs zur richtigen Zeit.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button data-testid="button-create-group" className="gap-2"><Plus className="h-4 w-4" /> Gruppe anlegen</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-serif text-2xl">Neue Studiengruppe</DialogTitle></DialogHeader>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2"><Label htmlFor="group-name">Name</Label><Input id="group-name" data-testid="input-group-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="z. B. Statistik Lerngruppe" required /></div>
              <div className="space-y-2"><Label htmlFor="group-description">Beschreibung <span className="text-muted-foreground">(optional)</span></Label><Textarea id="group-description" data-testid="input-group-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Woran arbeitet ihr gerade?" rows={4} /></div>
              <Button data-testid="button-submit-group" className="w-full" disabled={createGroup.isPending || !name.trim()}>{createGroup.isPending ? "Wird angelegt …" : "Gruppe anlegen"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {isLoading ? <div className="grid gap-4 md:grid-cols-2"><Skeleton className="h-44 rounded-2xl" /><Skeleton className="h-44 rounded-2xl" /></div> :
        isError ? <Card className="border-destructive/30"><CardContent className="flex flex-col items-center gap-3 py-14 text-center"><p>Die Gruppen konnten nicht geladen werden.</p><Button variant="outline" onClick={() => refetch()}>Erneut versuchen</Button></CardContent></Card> :
        groups && groups.length > 0 ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {groups.map((group) => <Link key={group.id} href={`/gruppen/${group.id}`} data-testid={`link-group-${group.id}`} className="group block">
            <Card className="h-full overflow-hidden border-primary/10 transition-all duration-300 group-hover:-translate-y-1 group-hover:border-primary/35 group-hover:shadow-lg">
              <div className="h-2 bg-primary" />
              <CardHeader><div className="flex items-start justify-between gap-4"><div className="rounded-xl bg-secondary p-3 text-primary"><FolderKanban className="h-5 w-5" /></div><ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" /></div><CardTitle className="pt-2 font-serif text-2xl">{group.name}</CardTitle><CardDescription className="line-clamp-2 min-h-10">{group.description || "Ein gemeinsamer Platz für euren Studienalltag."}</CardDescription></CardHeader>
              <CardContent className="flex items-center justify-between border-t bg-muted/20 pt-4 text-sm text-muted-foreground"><span className="flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> {group.memberCount} {group.memberCount === 1 ? "Mitglied" : "Mitglieder"}</span><span className="capitalize">{group.myRole === "owner" ? "Eigentümer" : "Mitglied"}</span></CardContent>
            </Card>
          </Link>)}
        </div> :
        <Card className="border-dashed border-primary/25 bg-primary/[0.025]"><CardContent className="flex flex-col items-center justify-center py-20 text-center"><div className="mb-5 rounded-2xl bg-secondary p-4 text-primary"><Users className="h-8 w-8" /></div><h2 className="font-serif text-2xl font-semibold">Noch keine Studiengruppe</h2><p className="mt-2 max-w-sm text-muted-foreground">Gründe einen Raum für dein nächstes gemeinsames Lernprojekt oder tritt über einen Einladungslink bei.</p><Button data-testid="button-empty-create-group" onClick={() => setOpen(true)} className="mt-6 gap-2"><Plus className="h-4 w-4" /> Erste Gruppe anlegen</Button></CardContent></Card>}
    </div>
  );
}