import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRegister, useListStudyPrograms } from "@/api";
import { BookOpen, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const registerSchema = z.object({
  username: z.string().min(3, "Mindestens 3 Zeichen erforderlich"),
  password: z.string().min(6, "Mindestens 6 Zeichen erforderlich"),
  displayName: z.string().min(1, "Anzeigename ist erforderlich"),
  studyProgramId: z.string().optional(),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Register() {
  const [, setLocation] = useLocation();
  const registerMutation = useRegister();
  const { data: studyPrograms } = useListStudyPrograms();
  const { toast } = useToast();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      displayName: "",
      studyProgramId: "",
    },
  });

  function onSubmit(values: RegisterFormValues) {
    const payload = {
      username: values.username,
      password: values.password,
      displayName: values.displayName,
      studyProgramId: values.studyProgramId ? Number(values.studyProgramId) : undefined,
    };

    registerMutation.mutate(
      { data: payload },
      {
        onSuccess: () => {
          toast({
            title: "Willkommen beim Studienplaner!",
            description: "Dein Konto wurde erfolgreich erstellt.",
          });
          setLocation("/");
        },
        onError: () => {
          toast({
            title: "Registrierung fehlgeschlagen",
            description: "Bitte überprüfe deine Eingaben und versuche es erneut.",
            variant: "destructive",
          });
        },
      }
    );
  }

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-background">
      <div className="flex flex-col justify-center px-8 md:px-16 lg:px-24 py-12">
        <div className="w-full max-w-sm mx-auto space-y-8">
          <div className="flex items-center gap-3 text-primary font-serif text-2xl font-bold">
            <BookOpen className="h-8 w-8" />
            <span>Studienplaner</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-serif font-semibold tracking-tight text-foreground">
              Konto erstellen
            </h1>
            <p className="text-muted-foreground">
              Starte jetzt durch und organisiere dein Studium effektiv.
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Anzeigename</FormLabel>
                    <FormControl>
                      <Input placeholder="Max Mustermann" {...field} className="bg-card" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Benutzername</FormLabel>
                    <FormControl>
                      <Input placeholder="max.mustermann" {...field} className="bg-card" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Passwort</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} className="bg-card" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="studyProgramId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Studiengang (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-card">
                          <SelectValue placeholder="Wähle deinen Studiengang" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {studyPrograms?.map((program) => (
                          <SelectItem key={program.id} value={program.id.toString()}>
                            {program.name} ({program.faculty})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full font-medium mt-2" 
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Registrieren
              </Button>
            </form>
          </Form>

          <p className="text-center text-sm text-muted-foreground">
            Bereits ein Konto?{" "}
            <Link href="/login" className="text-primary font-medium hover:underline">
              Anmelden
            </Link>
          </p>
        </div>
      </div>

      <div className="hidden md:flex flex-col justify-between bg-accent p-12 text-accent-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        <div className="relative z-10 flex-1 flex flex-col justify-center max-w-lg">
          <h2 className="text-4xl lg:text-5xl font-serif font-light leading-tight mb-6">
            Ein Partner,<br />der mitdenkt.
          </h2>
          <p className="text-accent-foreground/90 text-lg leading-relaxed">
            Mehr Zeit für das Lernen, weniger Zeit für die Planung. Behalte den Überblick über Fristen, Prüfungen und deinen Schnitt.
          </p>
        </div>
      </div>
    </div>
  );
}
