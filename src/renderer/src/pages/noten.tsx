import { useState, useMemo } from 'react'
import {
  useListGrades,
  useCreateGrade,
  useUpdateGrade,
  useDeleteGrade,
  useGetGradeStats,
  useImportGradesCsv,
  getListGradesQueryKey,
  getGetGradeStatsQueryKey
} from '@/api'
import { useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  Upload,
  Trash2,
  Edit,
  TrendingUp,
  BookOpen,
  GraduationCap,
  Trophy
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
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
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'

const gradeSchema = z.object({
  courseName: z.string().min(1, 'Kursname ist erforderlich'),
  grade: z.coerce.number<string | number>().min(1).max(5).optional().or(z.literal('')),
  ects: z.coerce.number<string | number>().min(0),
  semester: z.string().min(1, 'Semester ist erforderlich'),
  passed: z.boolean().default(true),
  notes: z.string().optional()
})

type GradeFormValues = z.infer<typeof gradeSchema>
type GradeFormInput = z.input<typeof gradeSchema>

export default function Noten() {
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)

  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: grades = [] } = useListGrades()
  const { data: stats } = useGetGradeStats()

  const createGrade = useCreateGrade()
  const updateGrade = useUpdateGrade()
  const deleteGrade = useDeleteGrade()
  const importGradesCsv = useImportGradesCsv({
    mutation: {
      onSuccess: (result) => {
        if (result.status === 'cancelled') return
        queryClient.invalidateQueries({ queryKey: getListGradesQueryKey() })
        queryClient.invalidateQueries({ queryKey: getGetGradeStatsQueryKey() })
        toast({
          title: `${result.importedCount} Noten importiert`,
          description:
            result.skippedCount > 0
              ? `${result.skippedCount} ungültige Zeilen wurden übersprungen.`
              : undefined
        })
      },
      onError: (error) => {
        toast({
          title: 'Fehler beim Import',
          description: error instanceof Error ? error.message : undefined,
          variant: 'destructive'
        })
      }
    }
  })

  const form = useForm<GradeFormInput, unknown, GradeFormValues>({
    resolver: zodResolver(gradeSchema),
    defaultValues: {
      courseName: '',
      grade: '',
      ects: 0,
      semester: '',
      passed: true,
      notes: ''
    }
  })

  const openEdit = (grade: any) => {
    setEditId(grade.id)
    form.reset({
      courseName: grade.courseName,
      grade: grade.grade || '',
      ects: grade.ects,
      semester: grade.semester,
      passed: grade.passed,
      notes: grade.notes || ''
    })
    setIsAddOpen(true)
  }

  const onSubmit = (values: GradeFormValues) => {
    const payload = {
      ...values,
      grade: values.grade === '' ? undefined : Number(values.grade)
    }

    const action = editId
      ? updateGrade.mutateAsync({ id: editId, data: payload })
      : createGrade.mutateAsync({ data: payload })

    action.then(() => {
      queryClient.invalidateQueries({ queryKey: getListGradesQueryKey() })
      queryClient.invalidateQueries({ queryKey: getGetGradeStatsQueryKey() })
      setIsAddOpen(false)
      setEditId(null)
      form.reset()
      toast({ title: editId ? 'Note aktualisiert' : 'Note hinzugefügt' })
    })
  }

  const handleDelete = (id: number) => {
    deleteGrade.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListGradesQueryKey() })
          queryClient.invalidateQueries({ queryKey: getGetGradeStatsQueryKey() })
          toast({ title: 'Eintrag gelöscht' })
        }
      }
    )
  }

  const groupedGrades = useMemo(() => {
    const groups: Record<string, typeof grades> = {}
    grades.forEach((g) => {
      if (!groups[g.semester]) groups[g.semester] = []
      groups[g.semester].push(g)
    })
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0])) // Sort desc loosely
  }, [grades])

  const chartData = useMemo(() => {
    if (!stats?.bySemester) return []
    return stats.bySemester
      .map((s) => ({
        name: s.semester,
        gpa: s.gpa ? Number(s.gpa.toFixed(2)) : null,
        ects: s.ects
      }))
      .reverse() // Oldest first for chart
  }, [stats])

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Noten & ECTS</h1>
          <p className="text-muted-foreground mt-1">
            Verwalte deine Leistungen und behalte den Schnitt im Blick.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={importGradesCsv.isPending}
            onClick={() => importGradesCsv.mutate()}
          >
            <Upload className="w-4 h-4" />
            {importGradesCsv.isPending ? 'Importiere …' : 'CSV Upload'}
          </Button>

          <Dialog
            open={isAddOpen}
            onOpenChange={(v) => {
              setIsAddOpen(v)
              if (!v) {
                setEditId(null)
                form.reset()
              }
            }}
          >
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Note eintragen
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editId ? 'Note bearbeiten' : 'Neue Note eintragen'}</DialogTitle>
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
                      name="grade"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Note (1.0 - 5.0)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.1" {...field} value={field.value ?? ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="ects"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ECTS</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="semester"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Semester (z.B. WS23/24)</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="passed"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Bestanden</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notizen (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full">
                    {editId ? 'Aktualisieren' : 'Speichern'}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-primary text-primary-foreground border-none shadow-md overflow-hidden relative">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-primary-foreground/80 flex items-center gap-2">
              <Trophy className="w-4 h-4" /> Gesamtschnitt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-serif font-bold">
              {stats?.overallGpa ? stats.overallGpa.toFixed(2) : '—'}
            </div>
            <p className="text-xs text-primary-foreground/70 mt-1">Gewichtet nach ECTS</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-primary" /> Gesamt ECTS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-serif font-bold">{stats?.totalEcts ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Erreichte Credit Points</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" /> Absolvierte Kurse
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-serif font-bold">{grades.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Eingetragene Leistungen</p>
          </CardContent>
        </Card>
      </div>

      {chartData.length > 1 && (
        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle className="font-serif text-xl flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" /> Notenentwicklung
            </CardTitle>
            <CardDescription>Dein gewichteter Schnitt über den Studienverlauf</CardDescription>
          </CardHeader>
          <CardContent className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorGpa" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  dy={10}
                />
                <YAxis
                  reversed
                  domain={['dataMin - 0.2', 'dataMax + 0.2']}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                  formatter={(value: any) => [value, 'Schnitt']}
                />
                <Area
                  type="monotone"
                  dataKey="gpa"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorGpa)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        {groupedGrades.length === 0 ? (
          <Card className="border-none shadow-md border-dashed bg-card/50">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="bg-primary/5 p-4 rounded-full mb-4">
                <GraduationCap className="w-8 h-8 text-primary/40" />
              </div>
              <p className="text-lg font-medium text-foreground">Noch keine Noten eingetragen</p>
              <p className="text-muted-foreground mt-1 max-w-sm">
                Füge deine ersten Leistungen hinzu oder lade sie bequem als CSV-Datei hoch.
              </p>
              <Button className="mt-6 gap-2" onClick={() => setIsAddOpen(true)}>
                <Plus className="w-4 h-4" /> Erste Note eintragen
              </Button>
            </CardContent>
          </Card>
        ) : (
          groupedGrades.map(([semester, semesterGrades]) => {
            const semStat = stats?.bySemester.find((s) => s.semester === semester)
            return (
              <Card key={semester} className="border-none shadow-md overflow-hidden">
                <CardHeader className="bg-muted/30 py-4 border-b">
                  <div className="flex justify-between items-center">
                    <CardTitle className="font-serif text-xl">{semester}</CardTitle>
                    <div className="flex gap-4 text-sm font-medium">
                      <span className="text-muted-foreground">
                        ECTS: <span className="text-foreground">{semStat?.ects ?? 0}</span>
                      </span>
                      <span className="text-muted-foreground">
                        Schnitt:{' '}
                        <span className="text-primary">
                          {semStat?.gpa ? semStat.gpa.toFixed(2) : '—'}
                        </span>
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kurs</TableHead>
                      <TableHead className="w-[100px] text-center">ECTS</TableHead>
                      <TableHead className="w-[100px] text-center">Note</TableHead>
                      <TableHead className="w-[120px] text-center">Status</TableHead>
                      <TableHead className="w-[100px] text-right">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {semesterGrades.map((grade) => (
                      <TableRow key={grade.id} className="group">
                        <TableCell className="font-medium">
                          {grade.courseName}
                          {grade.notes && (
                            <div className="text-xs text-muted-foreground font-normal mt-0.5">
                              {grade.notes}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-center">{grade.ects}</TableCell>
                        <TableCell className="text-center font-bold">
                          {grade.grade || '—'}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={grade.passed ? 'outline' : 'destructive'}
                            className={
                              grade.passed
                                ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
                                : ''
                            }
                          >
                            {grade.passed ? 'Bestanden' : 'Nicht bestanden'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-primary"
                              onClick={() => openEdit(grade)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDelete(grade.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
