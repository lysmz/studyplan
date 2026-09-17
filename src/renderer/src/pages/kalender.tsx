import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, addMonths, subMonths, isSameDay } from "date-fns";
import { de } from "date-fns/locale";
import { useListEvents, useCreateEvent, useDeleteEvent, getListEventsQueryKey, useListAllGroupEvents, getListAllGroupEventsQueryKey } from "@/api";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, List, LayoutGrid, Plus, Upload, Trash2, Clock, MapPin } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const eventSchema = z.object({
  title: z.string().min(1, "Titel ist erforderlich"),
  description: z.string().optional(),
  startDate: z.string().min(1, "Startdatum ist erforderlich"),
  endDate: z.string().min(1, "Enddatum ist erforderlich"),
  type: z.enum(["exam", "deadline", "registration", "lecture", "other"]),
  importance: z.enum(["high", "medium", "low"]),
  location: z.string().optional(),
});

type EventFormValues = z.infer<typeof eventSchema>;

export default function Kalender() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"grid" | "list">("grid");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const monthParams = { month: currentDate.getMonth() + 1, year: currentDate.getFullYear() };
  const { data: events = [] } = useListEvents(monthParams);
  const groupWindow = useMemo(() => ({
    from: startOfMonth(currentDate),
    to: endOfMonth(currentDate),
  }), [currentDate]);
  const { data: groupEvents = [] } = useListAllGroupEvents(groupWindow);
  const createEvent = useCreateEvent();
  const deleteEvent = useDeleteEvent();

  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      description: "",
      startDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      endDate: format(new Date(new Date().getTime() + 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm"),
      type: "lecture",
      importance: "medium",
      location: "",
    },
  });

  const onSubmit = (values: EventFormValues) => {
    createEvent.mutate({
      data: {
        ...values,
        startDate: new Date(values.startDate),
        endDate: new Date(values.endDate),
      },
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListAllGroupEventsQueryKey(groupWindow) });
        setIsAddOpen(false);
        toast({ title: "Event erstellt" });
        form.reset();
      }
    });
  };

  const handleDelete = (id: number) => {
    deleteEvent.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() });
        toast({ title: "Event gelöscht" });
      }
    });
  };

  const handleICSImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch('/api/events/import-ical', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() });
        toast({ title: "Kalender importiert" });
      } else {
        throw new Error();
      }
    } catch (err) {
      toast({ title: "Fehler beim Import", variant: "destructive" });
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const getEventColor = (type: string) => {
    switch(type) {
      case 'exam':
      case 'deadline': return 'bg-red-500';
      case 'registration': return 'bg-yellow-500';
      case 'lecture': return 'bg-blue-500';
      default: return 'bg-green-500';
    }
  };

  const eventsForDay = (date: Date) => {
    return calendarEvents.filter((e: any) => {
      const start = new Date(e.startDate);
      const end = new Date(e.endDate);
      const isMulti = e.isMultiDay;
      if (isMulti) {
        return date >= new Date(start.setHours(0,0,0,0)) && date <= new Date(end.setHours(23,59,59,999));
      }
      return isSameDay(date, start);
    });
  };

  const calendarEvents = useMemo(() => [
    ...events.map((event) => ({ ...event, isGroupEvent: false as const })),
    ...groupEvents.map((event) => ({
      ...event,
      id: -event.id,
      groupEventId: event.id,
      isGroupEvent: true as const,
      importance: "medium" as const,
      isMultiDay: false,
    })),
  ], [events, groupEvents]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Kalender</h1>
          <p className="text-muted-foreground mt-1">Behalte deine Termine und Fristen im Blick.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-muted rounded-md p-1">
            <Button variant={view === "grid" ? "secondary" : "ghost"} size="sm" onClick={() => setView("grid")} className="h-8">
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button variant={view === "list" ? "secondary" : "ghost"} size="sm" onClick={() => setView("list")} className="h-8">
              <List className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="relative">
            <Button variant="outline" size="sm" className="gap-2" disabled={isUploading}>
              <Upload className="w-4 h-4" />
              ICS Upload
            </Button>
            <input 
              type="file" 
              accept=".ics" 
              className="absolute inset-0 opacity-0 cursor-pointer" 
              onChange={handleICSImport}
              disabled={isUploading}
            />
          </div>

          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Neues Event
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Neues Event erstellen</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem><FormLabel>Titel</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="startDate" render={({ field }) => (
                      <FormItem><FormLabel>Start</FormLabel><FormControl><Input type="datetime-local" {...field} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="endDate" render={({ field }) => (
                      <FormItem><FormLabel>Ende</FormLabel><FormControl><Input type="datetime-local" {...field} /></FormControl></FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="type" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Typ</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="lecture">Vorlesung</SelectItem>
                            <SelectItem value="exam">Prüfung</SelectItem>
                            <SelectItem value="deadline">Frist</SelectItem>
                            <SelectItem value="registration">Anmeldung</SelectItem>
                            <SelectItem value="other">Sonstiges</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="importance" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Wichtigkeit</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="low">Niedrig</SelectItem>
                            <SelectItem value="medium">Mittel</SelectItem>
                            <SelectItem value="high">Hoch</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="location" render={({ field }) => (
                    <FormItem><FormLabel>Ort (Optional)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem><FormLabel>Beschreibung (Optional)</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>
                  )} />
                  <Button type="submit" className="w-full">Speichern</Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="border-none shadow-md">
        <CardHeader className="flex flex-row items-center justify-between py-4 border-b">
          <Button variant="ghost" size="icon" onClick={prevMonth}><ChevronLeft className="w-5 h-5" /></Button>
          <CardTitle className="font-serif text-xl">{format(currentDate, "MMMM yyyy", { locale: de })}</CardTitle>
          <Button variant="ghost" size="icon" onClick={nextMonth}><ChevronRight className="w-5 h-5" /></Button>
        </CardHeader>
        
        {view === "grid" ? (
          <CardContent className="p-0">
            <div className="grid grid-cols-7 border-b bg-muted/30">
              {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(day => (
                <div key={day} className="py-2 text-center text-sm font-medium text-muted-foreground">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 auto-rows-[100px]">
              {Array.from({ length: (daysInMonth[0].getDay() + 6) % 7 }).map((_, i) => (
                <div key={`empty-${i}`} className="border-r border-b bg-muted/10 p-2" />
              ))}
              {daysInMonth.map((date) => {
                const dayEvents = eventsForDay(date);
                const isCurrentToday = isToday(date);
                
                return (
                  <Dialog key={date.toISOString()}>
                    <DialogTrigger asChild>
                      <div className="border-r border-b p-2 cursor-pointer hover:bg-muted/50 transition-colors relative overflow-hidden group">
                        <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${isCurrentToday ? 'bg-primary text-primary-foreground' : 'text-foreground group-hover:text-primary'}`}>
                          {format(date, 'd')}
                        </span>
                        <div className="mt-1 flex flex-wrap gap-1">
                           {dayEvents.slice(0, 4).map((e: any) => (
                             <div key={`${e.isGroupEvent ? "group" : "personal"}-${e.id}`} className={`w-2 h-2 rounded-full ${e.isGroupEvent ? "bg-primary" : getEventColor(e.type)}`} title={e.isGroupEvent ? `Gruppe: ${e.title}` : e.title} />
                          ))}
                          {dayEvents.length > 4 && <span className="text-[10px] text-muted-foreground">+{dayEvents.length - 4}</span>}
                        </div>
                      </div>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{format(date, "EEEE, d. MMMM", { locale: de })}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        {dayEvents.length === 0 ? (
                          <p className="text-center text-muted-foreground py-8">Keine Termine an diesem Tag.</p>
                        ) : (
                           dayEvents.map((e: any) => (
                            <div key={e.id} className="flex justify-between items-start border p-3 rounded-lg bg-card">
                              <div>
                                <div className="flex items-center gap-2">
                                   <div className={`w-2.5 h-2.5 rounded-full ${e.isGroupEvent ? "bg-primary" : getEventColor(e.type)}`} />
                                  <h4 className="font-semibold">{e.title}</h4>
                                   {e.isGroupEvent && <Badge variant="secondary">Gruppe · {e.groupId}</Badge>}
                                </div>
                                <div className="text-sm text-muted-foreground mt-1 flex flex-col gap-1">
                                  <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {format(e.startDate, 'HH:mm')} - {format(e.endDate, 'HH:mm')}</span>
                                  {e.location && <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {e.location}</span>}
                                </div>
                              </div>
                              {!e.isGroupEvent && <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDelete(e.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>}
                            </div>
                          ))
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                );
              })}
            </div>
          </CardContent>
        ) : (
          <CardContent className="p-6 space-y-4">
             {calendarEvents.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">Keine Termine in diesem Monat.</div>
            ) : (
               [...calendarEvents].sort((a,b) => a.startDate.getTime() - b.startDate.getTime()).map((e) => (
                <div key={e.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border p-4 rounded-xl bg-card hover:border-primary/20 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center min-w-16 p-2 rounded-lg bg-primary/5 text-primary">
                      <span className="text-xs uppercase font-medium">{format(e.startDate, 'MMM', { locale: de })}</span>
                      <span className="text-xl font-bold">{format(e.startDate, 'dd')}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                         <h4 className="font-semibold text-lg">{e.title}</h4>
                         {e.isGroupEvent && <Badge variant="secondary">Gruppe · {e.groupId}</Badge>}
                        <Badge variant="outline" className={`font-normal border-opacity-50 ${e.importance === 'high' ? 'font-bold' : ''}`}>
                          {e.type}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center text-sm text-muted-foreground mt-1 gap-x-4 gap-y-1">
                        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {format(e.startDate, 'HH:mm')}</span>
                        {e.location && <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {e.location}</span>}
                      </div>
                      {e.description && <p className="text-sm mt-2 text-foreground/80">{e.description}</p>}
                    </div>
                  </div>
                   {!e.isGroupEvent && <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(e.id)}>
                     <Trash2 className="w-4 h-4" />
                   </Button>}
                </div>
              ))
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
