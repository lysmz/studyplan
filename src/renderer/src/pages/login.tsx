import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLogin, useGetMe } from "@/api";
import { useQueryClient } from "@tanstack/react-query";
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
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  username: z.string().min(1, "Benutzername ist erforderlich"),
  password: z.string().min(1, "Passwort ist erforderlich"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const loginMutation = useLogin();
  const { data: user, isLoading } = useGetMe();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  if (user) {
    setLocation("/");
    return null;
  }

  if (isLoading) {
    return null;
  }

  function onSubmit(values: LoginFormValues) {
    loginMutation.mutate(
      { data: values },
      {
        onSuccess: () => {
          queryClient.invalidateQueries();
          setLocation("/");
        },
        onError: () => {
          toast({
            title: "Fehler beim Anmelden",
            description: "Benutzername oder Passwort ist falsch.",
            variant: "destructive",
          });
        },
      }
    );
  }

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-background">
      <div className="flex flex-col justify-center px-8 md:px-16 lg:px-24">
        <div className="w-full max-w-sm mx-auto space-y-8">
          <div className="flex items-center gap-3 text-primary font-serif text-2xl font-bold">
            <BookOpen className="h-8 w-8" />
            <span>Studienplaner</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-serif font-semibold tracking-tight text-foreground">
              Willkommen zurück
            </h1>
            <p className="text-muted-foreground">
              Melde dich an, um deinen Studienalltag zu organisieren.
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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
              <Button 
                type="submit" 
                className="w-full font-medium" 
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Anmelden
              </Button>
            </form>
          </Form>

          <p className="text-center text-sm text-muted-foreground">
            Noch kein Konto?{" "}
            <Link href="/register" className="text-primary font-medium hover:underline">
              Jetzt registrieren
            </Link>
          </p>
        </div>
      </div>

      <div className="hidden md:flex flex-col justify-between bg-primary p-12 text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        <div className="relative z-10 flex-1 flex flex-col justify-center max-w-lg">
          <h2 className="text-4xl lg:text-5xl font-serif font-light leading-tight mb-6">
            Klarheit für<br />dein Studium.
          </h2>
          <p className="text-primary-foreground/80 text-lg leading-relaxed">
            Dein Cockpit für Vorlesungen, Prüfungen und Noten. Ein Ort, der mitdenkt, damit du dich aufs Wesentliche konzentrieren kannst.
          </p>
        </div>
      </div>
    </div>
  );
}
