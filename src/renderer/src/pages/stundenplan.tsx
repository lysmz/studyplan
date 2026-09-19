import { useState } from 'react'
import {
  useListTimetableEntries,
  useAddTimetableEntry,
  useRemoveTimetableEntry,
  useClearTimetable,
  useListTimetablePresets,
  useGetTimetablePresetEntries,
  getListTimetableEntriesQueryKey,
  getGetTimetablePresetEntriesQueryKey
} from '@/api'
import { useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Download, Clock } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'

const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const
const TIMESLOTS = [
  { id: 'slot1', label: '08:00 - 09:30' },
  { id: 'slot2', label: '09:45 - 11:15' },
  { id: 'slot3', label: '11:30 - 13:00' },
  { id: 'slot4', label: '14:00 - 15:30' },
  { id: 'slot5', label: '15:45 - 17:15' },
  { id: 'slot6', label: '17:30 - 19:00' }
] as const

const COLORS = [
  {
    value:
      'bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-800',
    label: 'Blau'
  },
  {
    value:
      'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800',
    label: 'Grün'
  },
  {
    value:
      'bg-purple-100 dark:bg-purple-900/40 text-purple-900 dark:text-purple-200 border-purple-200 dark:border-purple-800',
    label: 'Lila'
  },
  {
    value:
      'bg-orange-100 dark:bg-orange-900/40 text-orange-900 dark:text-orange-200 border-orange-200 dark:border-orange-800',
    label: 'Orange'
  },
  {
    value:
      'bg-pink-100 dark:bg-pink-900/40 text-pink-900 dark:text-pink-200 border-pink-200 dark:border-pink-800',
    label: 'Pink'
  }
]

const entrySchema = z.object({
  courseName: z.string().min(1, 'Kursname ist erforderlich'),
  room: z.string().optional(),
  professor: z.string().optional(),
  color: z.string().optional()
})

type EntryFormValues = z.infer<typeof entrySchema>

export default function Stundenplan() {
  const [selectedSlot, setSelectedSlot] = useState<{ day: string; slot: string } | null>(null)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState<string>('')

  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: entries = [] } = useListTimetableEntries()
  const { data: presets = [] } = useListTimetablePresets()
  const { data: presetEntries, refetch: refetchPresetEntries } = useGetTimetablePresetEntries(
    Number(selectedPreset),
    {
      query: {
        enabled: !!selectedPreset,
        queryKey: getGetTimetablePresetEntriesQueryKey(Number(selectedPreset))
      }
    }
  )

  const addEntry = useAddTimetableEntry()
  const removeEntry = useRemoveTimetableEntry()
  const clearTimetable = useClearTimetable()

  const form = useForm<EntryFormValues>({
    resolver: zodResolver(entrySchema),
    defaultValues: {
      courseName: '',
      room: '',
      professor: '',
      color: COLORS[0].value
    }
  })

  const handleOpenAdd = (day: string, slot: string) => {
    setSelectedSlot({ day, slot })
    form.reset({ color: COLORS[Math.floor(Math.random() * COLORS.length)].value })
    setIsAddOpen(true)
  }

  const onSubmit = (values: EntryFormValues) => {
    if (!selectedSlot) return

    addEntry.mutate(
      {
        data: {
          ...values,
          weekDay: selectedSlot.day as any,
          timeSlot: selectedSlot.slot as any,
          isCustom: true
        }
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTimetableEntriesQueryKey() })
          setIsAddOpen(false)
          toast({ title: 'Eingetragen' })
        }
      }
    )
  }

  const handleDelete = (id: number) => {
    removeEntry.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTimetableEntriesQueryKey() })
          toast({ title: 'Gelöscht' })
        }
      }
    )
  }

  const handleClearAll = () => {
    clearTimetable.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTimetableEntriesQueryKey() })
        toast({ title: 'Stundenplan geleert' })
      }
    })
  }

  const handleImportPreset = async () => {
    if (!presetEntries || presetEntries.length === 0) return

    let successCount = 0

    // Simple sequential adding to avoid overwhelming backend
    for (const entry of presetEntries) {
      try {
        await addEntry.mutateAsync({
          data: {
            courseName: entry.courseName,
            weekDay: entry.weekDay,
            timeSlot: entry.timeSlot,
            room: entry.room || '',
            professor: entry.professor || '',
            isCustom: false
          }
        })
        successCount++
      } catch (e) {
        console.error(e)
      }
    }

    queryClient.invalidateQueries({ queryKey: getListTimetableEntriesQueryKey() })
    toast({ title: `${successCount} Kurse importiert` })
    setSelectedPreset('')
  }

  const translateDay = (day: string) => {
    const map: Record<string, string> = {
      monday: 'Montag',
      tuesday: 'Dienstag',
      wednesday: 'Mittwoch',
      thursday: 'Donnerstag',
      friday: 'Freitag'
    }
    return map[day]
  }

  const getEntryForSlot = (day: string, slot: string) => {
    return entries.find((e) => e.weekDay === day && e.timeSlot === slot)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Stundenplan</h1>
          <p className="text-muted-foreground mt-1">
            Dein wöchentlicher Vorlesungsplan im Überblick.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {entries.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="text-destructive gap-2">
                  <Trash2 className="w-4 h-4" />
                  Alles löschen
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Stundenplan leeren?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Möchtest du wirklich alle Einträge aus deinem Stundenplan löschen? Diese Aktion
                    kann nicht rückgängig gemacht werden.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleClearAll}
                    className="bg-destructive text-destructive-foreground"
                  >
                    Leeren
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondary" className="gap-2">
                <Download className="w-4 h-4" />
                Vorgabe laden
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Stundenplan-Vorgabe laden</DialogTitle>
                <DialogDescription>
                  Importiere alle Standard-Vorlesungen für deinen Studiengang.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Select
                  value={selectedPreset}
                  onValueChange={(v) => {
                    setSelectedPreset(v)
                    setTimeout(refetchPresetEntries, 100)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wähle einen Plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {presets.map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.name} ({p.faculty})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {presetEntries && presetEntries.length > 0 && (
                  <div className="bg-muted p-4 rounded-md text-sm">
                    <p className="font-medium mb-2">Folgende Kurse werden importiert:</p>
                    <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                      {presetEntries.slice(0, 5).map((e) => (
                        <li key={e.id}>{e.courseName}</li>
                      ))}
                      {presetEntries.length > 5 && (
                        <li>... und {presetEntries.length - 5} weitere</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  onClick={handleImportPreset}
                  disabled={!presetEntries || presetEntries.length === 0}
                  className="w-full"
                >
                  Plan importieren
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kurs eintragen</DialogTitle>
            <DialogDescription>
              {selectedSlot &&
                `${translateDay(selectedSlot.day)}, ${TIMESLOTS.find((s) => s.id === selectedSlot.slot)?.label}`}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="courseName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kursname</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="room"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Raum (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="professor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dozent (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Farbe</FormLabel>
                    <div className="flex gap-2">
                      {COLORS.map((c) => (
                        <div
                          key={c.value}
                          className={`w-8 h-8 rounded-full cursor-pointer border-2 transition-all ${c.value} ${field.value === c.value ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                          onClick={() => field.onChange(c.value)}
                          title={c.label}
                        />
                      ))}
                    </div>
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">
                Eintragen
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <div className="overflow-x-auto pb-4">
        <div className="min-w-[800px] border rounded-xl bg-card shadow-sm overflow-hidden">
          <div className="grid grid-cols-[100px_repeat(5,1fr)] border-b bg-muted/30">
            <div className="p-4 flex items-center justify-center border-r">
              <Clock className="w-5 h-5 text-muted-foreground" />
            </div>
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="p-4 text-center font-medium font-serif border-r last:border-0"
              >
                {translateDay(day)}
              </div>
            ))}
          </div>

          {TIMESLOTS.map((slot) => (
            <div
              key={slot.id}
              className="grid grid-cols-[100px_repeat(5,1fr)] border-b last:border-0"
            >
              <div className="p-3 text-xs font-medium text-muted-foreground flex items-center justify-center border-r bg-muted/10 text-center">
                {slot.label.split(' - ').map((t, i) => (
                  <span key={i} className="block">
                    {t}
                  </span>
                ))}
              </div>

              {WEEKDAYS.map((day) => {
                const entry = getEntryForSlot(day, slot.id)
                return (
                  <div
                    key={`${day}-${slot.id}`}
                    className="p-2 border-r last:border-0 relative group min-h-[100px]"
                  >
                    {entry ? (
                      <div
                        className={`h-full rounded-lg p-3 border shadow-sm flex flex-col justify-between transition-all ${entry.isCustom ? entry.color : 'bg-secondary border-secondary-border text-secondary-foreground'}`}
                      >
                        <div>
                          <p className="font-semibold text-sm leading-tight line-clamp-2">
                            {entry.courseName}
                          </p>
                          {(entry.room || entry.professor) && (
                            <div className="mt-2 text-xs opacity-80 space-y-0.5">
                              {entry.room && <p>📍 {entry.room}</p>}
                              {entry.professor && <p>👤 {entry.professor}</p>}
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 absolute top-3 right-3 opacity-0 group-hover:opacity-100 bg-background/50 hover:bg-destructive text-destructive hover:text-white transition-all backdrop-blur-sm"
                          onClick={() => handleDelete(entry.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <div
                        className="h-full rounded-lg border-2 border-dashed border-transparent hover:border-primary/30 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-all bg-muted/20 hover:bg-muted/50"
                        onClick={() => handleOpenAdd(day, slot.id)}
                      >
                        <Plus className="w-6 h-6 text-primary/50" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
