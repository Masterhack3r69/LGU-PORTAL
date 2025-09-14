import * as React from "react"
import {
  Users,
  Calendar,
  DollarSign,
  FileText,
  BarChart3,
  Settings,
  Building2,
  Award,
  Shield,
  Home,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useAuth } from "@/contexts/AuthContext"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();

  const teams = [
    {
      name: "Employee Management System",
      logo: Building2,
      plan: "Enterprise",
    },
  ];

  // Build navigation based on user role
  const navMain = [];

  // Dashboard - Add for employees only
  if (user?.role === 'employee') {
    navMain.push({
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
      items: [],
    });
  }

  // Employee Management - Only show for admins
  if (user?.role === 'admin') {
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
      ],
    });
  }
  // Note: Employee navigation is completely hidden for employee users

  // Leave Management - Different items for different roles
  navMain.push({
    title: "Leave Management",
    url: "/leaves",
    icon: Calendar,
    items: user?.role === 'admin' ? [
      {
        title: "Leave Applications",
        url: "/leaves/applications",
      },
      {
        title: "Leave Approvals",
        url: "/leaves/approvals",
      },
      {
        title: "Leave Balances",
        url: "/leaves/balances",
      },
      {
        title: "Leave Types",
        url: "/leaves/types",
      },
    ] : [
      // Employees only see their own applications and balances
      {
        title: "My Applications",
        url: "/leaves/applications",
      },
      {
        title: "My Leave Balance",
        url: "/leaves/balances",
      },
    ],
  });

  // Benefits - Always shown but with different access levels
  navMain.push({
    title: "Benefits",
    url: "/benefits",
    icon: Award,
    items: user?.role === 'admin' ? [
      {
        title: "Employee Benefits",
        url: "/benefits/employee",
      },
      {
        title: "Benefit Types",
        url: "/benefits/types",
      },
      {
        title: "Annual Benefits",
        url: "/benefits/annual",
      }
    ] : [
      // Employees only see their own benefits
      {
        title: "My Benefits",
        url: "/benefits/employee",
      },
    ],
  });

  // Documents - Only show for admins
  if (user?.role === 'admin') {
    navMain.push({
      title: "Document Management",
      url: "/documents",
      icon: FileText,
      items: [
        {
          title: "Document Review",
          url: "/admin/documents",
        },
        {
          title: "Document Types",
          url: "/admin/document-types",
        },
        {
          title: "All Documents",
          url: "/documents",
        }
      ],
    });
  }

  // Reports - Only show for admins, hide completely for employees
  if (user?.role === 'admin') {
    navMain.push({
      title: "Reports & Analytics",
      url: "/reports",
      icon: BarChart3,
      items: [
        {
          title: "Employee Reports",
          url: "/reports/employees",
        },
        {
          title: "Leave Reports",
          url: "/reports/leaves",
        },
        {
          title: "Payroll Reports",
          url: "/reports/payroll",
        },
        {
          title: "Analytics Dashboard",
          url: "/reports/analytics",
        },
      ],
    });
  }

  // Add admin-only sections
  if (user?.role === 'admin') {
    // Add Payroll Management for admins only
    navMain.push({
      title: "Payroll Management",
      url: "/payroll",
      icon: DollarSign,
      items: [
        {
          title: "Payroll Periods",
          url: "/payroll/periods",
        },
        {
          title: "Generate Payroll",
          url: "/payroll/generate",
        },
        {
          title: "Payroll History",
          url: "/payroll/history",
        },
        {
          title: "Compensation",
          url: "/payroll/compensation",
        },
      ],
    });

    // Add System Administration for admins only
    navMain.push({
      title: "System Administration",
      url: "/admin",
      icon: Shield,
      items: [
        {
          title: "User Management",
          url: "/admin/users",
        },
        {
          title: "System Settings",
          url: "/admin/settings",
        },
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
  if (user?.role === 'admin') {
    navMain.push({
      title: "Settings",
      url: "/settings",
      icon: Settings,
      items: [
        {
          title: "Profile",
          url: "/settings/profile",
        },
        {
          title: "Preferences",
          url: "/settings/preferences",
        },
        {
          title: "Security",
          url: "/settings/security",
        },
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
    name: user?.full_name || user?.username || 'User',
    email: user?.email || '',
    avatar: '/avatars/default.jpg',
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
  )
}
