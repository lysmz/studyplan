import { Link, useLocation } from "wouter";
import { 
  useGetMe, 
  useLogout
} from "@/api";
import { 
  BookOpen, 
  CalendarDays, 
  GraduationCap, 
  LayoutDashboard, 
  LogOut,
  Table as TableIcon,
  Users
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useEffect } from "react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading, isError } = useGetMe();
  const [, setLocation] = useLocation();
  const logout = useLogout();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isError) {
      setLocation("/login");
    }
  }, [isError, setLocation]);

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        queryClient.clear();
        setLocation("/login");
      }
    });
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-pulse flex items-center gap-2"><BookOpen className="h-6 w-6 text-primary" /><span className="text-xl font-serif text-primary">Studienplaner</span></div></div>;
  }

  if (!user) return null;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background/50">
        <AppSidebar user={user} onLogout={handleLogout} />
        <main className="flex-1 flex flex-col min-w-0">
          <header className="h-16 flex items-center gap-4 px-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
            <SidebarTrigger />
            <h2 className="font-serif text-lg text-foreground/80 font-medium">Semester im Blick</h2>
          </header>
          <div className="flex-1 p-6 md:p-8 overflow-auto">
            <div className="max-w-6xl mx-auto w-full">
              {children}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

function AppSidebar({ user, onLogout }: { user: any, onLogout: () => void }) {
  const [location] = useLocation();

  const navigation = [
    { name: "Cockpit", href: "/", icon: LayoutDashboard },
    { name: "Kalender", href: "/kalender", icon: CalendarDays },
    { name: "Stundenplan", href: "/stundenplan", icon: TableIcon },
    { name: "Noten & ECTS", href: "/noten", icon: GraduationCap },
    { name: "Studium", href: "/studie", icon: BookOpen },
    { name: "Gruppen", href: "/gruppen", icon: Users },
  ];

  return (
    <Sidebar variant="inset">
      <SidebarHeader className="h-16 flex items-center px-4 border-b">
        <div className="flex items-center gap-2 font-serif text-xl text-primary font-semibold tracking-tight w-full">
          <BookOpen className="h-6 w-6" />
          <span>Studienplaner</span>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-3 py-4 gap-1">
        <SidebarMenu>
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={item.name}
                  className="rounded-lg transition-all"
                >
                  <Link href={item.href} className="flex items-center gap-3">
                    <item.icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="border-t p-4">
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="h-9 w-9 border border-primary/10">
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {user.displayName.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-medium truncate">{user.displayName}</span>
            <span className="text-xs text-muted-foreground truncate">@{user.username}</span>
          </div>
        </div>
        <Button variant="outline" className="w-full justify-start gap-2" onClick={onLogout}>
          <LogOut className="h-4 w-4" />
          Abmelden
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
