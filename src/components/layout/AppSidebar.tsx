import { NavLink, useLocation } from "react-router-dom";
import {
  TrendingUp,
  Target,
  Briefcase,
  Search,
  History,
  Settings,
  BarChart3,
  Brain,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

const navigationItems = [
  { title: "Dashboard", url: "/", icon: TrendingUp },
  { title: "AI Predictions", url: "/predictions", icon: Brain },
  { title: "Portfolio", url: "/portfolio", icon: Briefcase },
  { title: "Opportunities", url: "/opportunities", icon: Target },
  { title: "Trading History", url: "/history", icon: History },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Scanner", url: "/scanner", icon: Search },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar className="w-64" collapsible="none">
      <SidebarHeader className="border-b border-border">
        <div className="flex items-center gap-2 px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-primary">
            <TrendingUp className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">AI TradingBot</span>
            <span className="text-xs text-muted-foreground">Pro Terminal</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Trading</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive: active }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 ${
                          active
                            ? "bg-primary text-primary-foreground shadow-lg"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent"
                        }`
                      }
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      <span className="text-sm">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
