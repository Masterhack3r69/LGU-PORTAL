import * as React from "react";
import {
  Users,
  Calendar,
  Settings,
  Building2,
  Shield,
  Home,
  GraduationCap,
  Banknote,
  Award,
  UserCheck,
  CalendarDays,
  BookOpen,
  Wallet,
  Gift,
  BarChart3,
  User,
  Cog,
} from "lucide-react";
import logo from "@/assets/logo.png";

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
import { employeeService } from "@/services/employeeService";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();
  const [departments, setDepartments] = React.useState<string[]>([]);

  const teams = [
    {
      name: "LGU Portal",
      logo: logo,
      plan: "Management System",
    },
  ];

  // Fetch departments on mount
  React.useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const depts = await employeeService.getDepartments();
        setDepartments(depts);
      } catch (error) {
        console.error("Failed to fetch departments:", error);
      }
    };

    if (user?.role === "admin") {
      fetchDepartments();
    }
  }, [user?.role]);

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
    // Build "All Employees" sub-items with departments
    const allEmployeesSubItems = [
      {
        title: "View All",
        url: "/employees",
      },
      // Add department subsections under "All Employees"
      ...departments.map((dept) => ({
        title: dept,
        url: `/employees?department=${encodeURIComponent(dept)}`,
      })),
    ];

    const employeeItems = [
      {
        title: "All Employees",
        url: "/employees",
        items: allEmployeesSubItems,
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
    ];

    navMain.push({
      title: "Employee Management",
      url: "/employees",
      icon: UserCheck,
      isActive: false,
      items: employeeItems,
    });
  }
  // Note: Employee navigation is completely hidden for employee users

  // Leave Management - Different items for different roles
  navMain.push({
    title: "Leave Management",
    url: user?.role === "admin" ? "/leaves/applications" : "/leaves/employee",
    icon: CalendarDays,
    items: user?.role === "admin" 
      ? [
          {
            title: "Applications",
            url: "/leaves/applications",
          },
          {
            title: "Balances",
            url: "/leaves/balances",
          },
          {
            title: "Leave Types",
            url: "/leaves/types",
          },
        ]
      : [
          {
            title: "My Applications",
            url: "/leaves/employee",
          },
          {
            title: "My Balances",
            url: "/leaves/balances",
          },
        ],
  });

  // Training Management - Show for all users with dropdown
  navMain.push({
    title: "Training Management",
    url:
      user?.role === "admin" ? "/training/records" : "/training/my-trainings",
    icon: BookOpen,
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
        : [], // Employees only see main link, no dropdown items
  });

  // Payroll Management - DISABLED (Hidden from sidebar)
  // navMain.push({
  //   title: "Payroll Management",
  //   url: user?.role === "admin" ? "/payroll/periods" : "/payroll/employee",
  //   icon: Wallet,
  //   items:
  //     user?.role === "admin"
  //       ? [
  //           {
  //             title: "Periods",
  //             url: "/payroll/periods",
  //           },
  //           {
  //             title: "Management",
  //             url: "/payroll/management",
  //           },
  //           {
  //             title: "Reports",
  //             url: "/payroll/reports",
  //           },
  //           {
  //             title: "Configuration",
  //             url: "/payroll/configuration",
  //           },
  //         ]
  //       : [], // Employee users don't get dropdown items
  // });

  // Compensation & Benefits - DISABLED (Hidden from sidebar)
  // navMain.push({
  //   title: "Compensation & Benefits",
  //   url: user?.role === "admin" ? "/benefits" : "/benefits/employee",
  //   icon: Gift,
  //   items: [], // No dropdown items for now
  // });

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

  // Settings and Profile for all users (hide My Profile for admin)
  if (user?.role !== "admin") {
    navMain.push({
      title: "My Profile",
      url: "/profile",
      icon: User,
      items: [], // No dropdown items
    });
  }

  navMain.push({
    title: "Settings",
    url: "/settings",
    icon: Cog,
    items: [], // No dropdown items - direct link to account settings
  });

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
