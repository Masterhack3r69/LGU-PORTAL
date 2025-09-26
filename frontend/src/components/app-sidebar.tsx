import * as React from "react";
import {
  Users,
  Calendar,
  Settings,
  Building2,
  Shield,
  Home,
  GraduationCap,
  DollarSign,
  Award,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();

  const teams = [
    {
      name: "LGU Portal",
      logo: Building2,
      plan: "Management System",
    },
  ];

  // Build navigation based on user role
  const navMain = [];

  // Dashboard - Add for both admin and employee roles
  navMain.push({
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
    items: [],
  });

  // Employee Management - Only show for admins
  if (user?.role === "admin") {
    navMain.push({
      title: "Employee Management",
      url: "/employees",
      icon: Users,
      isActive: false,
      items: [
        {
          title: "All Employees",
          url: "/employees",
        },
        {
          title: "Add Employee",
          url: "/employees/new",
        },
        {
          title: "Employee Import",
          url: "/admin/import",
        },
        {
          title: "Document Approval",
          url: "/employees/documents",
        },
      ],
    });
  }
  // Note: Employee navigation is completely hidden for employee users

  // Leave Management - Different items for different roles
  navMain.push({
    title: "Leave Management",
    url: user?.role === "admin" ? "/leaves" : "/leaves/employee",
    icon: Calendar,
    items: [], // No dropdown items since everything is in tabs
  });

  // Training Management - Show for all users with dropdown
  navMain.push({
    title: "Training Management",
    url:
      user?.role === "admin" ? "/training/records" : "/training/my-trainings",
    icon: GraduationCap,
    items:
      user?.role === "admin"
        ? [
            {
              title: "Training Records",
              url: "/training/records",
            },
            {
              title: "Training Programs",
              url: "/training/programs",
            },
            {
              title: "Training Analytics",
              url: "/training/analytics",
            },
          ]
        : [
            {
              title: "My Trainings",
              url: "/training/my-trainings",
            },
            {
              title: "My Certificates",
              url: "/training/certificates",
            },
          ],
  });

  // Payroll Management - Show for all users with dropdown
  navMain.push({
    title: "Payroll Management",
    url: user?.role === "admin" ? "/payroll/periods" : "/payroll/employee",
    icon: DollarSign,
    items:
      user?.role === "admin"
        ? [
            {
              title: "Periods",
              url: "/payroll/periods",
            },
            {
              title: "Management",
              url: "/payroll/management",
            },
            {
              title: "Reports",
              url: "/payroll/reports",
            },
            {
              title: "Configuration",
              url: "/payroll/configuration",
            },
          ]
        : [], // Employee users don't get dropdown items
  });

  // Compensation & Benefits - Show for all users
  navMain.push({
    title: "Compensation & Benefits",
    url: user?.role === "admin" ? "/benefits" : "/benefits/employee",
    icon: Award,
    items: [], // No dropdown items for now
  });

  // // Reports - Only show for admins, hide completely for employees
  // if (user?.role === "admin") {
  //   navMain.push({
  //     title: "Reports & Analytics",
  //     url: "/reports",
  //     icon: BarChart3,
  //     items: [
  //       {
  //         title: "Employee Reports",
  //         url: "/reports/employees",
  //       },
  //       {
  //         title: "Leave Reports",
  //         url: "/reports/leaves",
  //       },
  //       {
  //         title: "Analytics Dashboard",
  //         url: "/reports/analytics",
  //       },
  //     ],
  //   });
  // }

  // Add admin-only sections
  if (user?.role === "admin") {
    // Payroll and Benefits removed - no payroll system

    // Keep System Administration
    navMain.push({
      title: "System Administration",
      url: "/admin",
      icon: Shield,
      items: [
        // {
        //   title: "User Management",
        //   url: "/admin/users",
        // },
        // {
        //   title: "System Settings",
        //   url: "/admin/settings",
        // },

        {
          title: "Audit Logs",
          url: "/admin/audit",
        },
        {
          title: "Backup & Restore",
          url: "/admin/backup",
        },
      ],
    });
  }

  // Settings for admins, direct Profile link for employees
  if (user?.role === "admin") {
    navMain.push({
      title: "Settings",
      url: "/settings",
      icon: Settings,
      items: [
        {
          title: "Profile",
          url: "/settings/profile",
        },
        // {
        //   title: "Preferences",
        //   url: "/settings/preferences",
        // },
        // {
        //   title: "Security",
        //   url: "/settings/security",
        // },
        {
          title: "System Settings",
          url: "/settings/system",
        },
      ],
    });
  } else {
    // For employees - direct link to profile without dropdown
    navMain.push({
      title: "My Profile",
      url: "/profile",
      icon: Settings,
      items: [], // No dropdown items
    });
  }

  const userData = {
    name: user?.full_name || user?.username || "User",
    email: user?.email || "",
    avatar: "/avatars/default.jpg",
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
