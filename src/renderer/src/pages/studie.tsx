import { useState } from 'react'
import {
  useListStudyPrograms,
  useListStudyProgramCourses,
  getListStudyProgramCoursesQueryKey
} from '@/api'
import { GraduationCap, Building2, Search } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
import { Skeleton } from '@/components/ui/skeleton'

export default function Studie() {
  const [searchTerm, setSearchTerm] = useState('')
  const { data: programs, isLoading: programsLoading } = useListStudyPrograms()

  const filteredPrograms = programs?.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.faculty.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Studiengänge</h1>
          <p className="text-muted-foreground mt-1">Nachschlagewerk für Curricula und Module.</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Suchen..."
            className="pl-9 bg-card"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {programsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
        ) : filteredPrograms && filteredPrograms.length > 0 ? (
          <Accordion type="single" collapsible className="w-full space-y-4">
            {filteredPrograms.map((program) => (
              <ProgramAccordionItem key={program.id} program={program} />
            ))}
          </Accordion>
        ) : (
          <Card className="border-none shadow-md border-dashed bg-card/50">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="bg-primary/5 p-4 rounded-full mb-4">
                <Search className="w-8 h-8 text-primary/40" />
              </div>
              <p className="text-lg font-medium text-foreground">Keine Ergebnisse gefunden</p>
              <p className="text-muted-foreground mt-1">
                Versuche es mit einem anderen Suchbegriff.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function ProgramAccordionItem({ program }: { program: any }) {
  const { data: courses, isLoading } = useListStudyProgramCourses(program.id, {
    query: { enabled: true, queryKey: getListStudyProgramCoursesQueryKey(program.id) }
  })

  const groupedBySemester = courses?.reduce((acc: any, course) => {
    if (!acc[course.semester]) acc[course.semester] = []
    acc[course.semester].push(course)
    return acc
  }, {})

  const semesters = groupedBySemester ? Object.keys(groupedBySemester).sort() : []

  return (
    <AccordionItem
      value={program.id.toString()}
      className="border rounded-xl bg-card shadow-sm overflow-hidden data-[state=open]:ring-2 ring-primary/20"
    >
      <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/30 transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full pr-4 text-left gap-4">
          <div>
            <h3 className="font-serif text-xl font-bold text-primary">{program.name}</h3>
            <div className="flex items-center text-sm text-muted-foreground mt-1 gap-4">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4" /> {program.faculty}
              </span>
            </div>
          </div>
          <Badge
            variant="secondary"
            className="w-fit text-sm whitespace-nowrap bg-primary/10 text-primary hover:bg-primary/20"
          >
            {program.totalEcts} ECTS
          </Badge>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-6 pb-6 pt-2 bg-muted/10 border-t">
        {isLoading ? (
          <div className="space-y-2 py-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : courses && courses.length > 0 ? (
          <div className="space-y-8 mt-4">
            {semesters.map((semester) => (
              <div key={semester} className="space-y-3">
                <h4 className="font-medium text-foreground border-b pb-2 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-primary" />
                  Semester {semester}
                </h4>
                <div className="border rounded-lg bg-background overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead>Modul / Kurs</TableHead>
                        <TableHead className="w-[120px] text-center">Typ</TableHead>
                        <TableHead className="w-[100px] text-right">ECTS</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupedBySemester[semester].map((course: any) => (
                        <TableRow key={course.id}>
                          <TableCell className="font-medium">{course.name}</TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant="outline"
                              className={
                                course.isRequired
                                  ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
                                  : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
                              }
                            >
                              {course.isRequired ? 'Pflicht' : 'Wahl'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-bold">{course.ects}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            Keine Kurse für diesen Studiengang hinterlegt.
          </p>
        )}
      </AccordionContent>
    </AccordionItem>
  )
}
