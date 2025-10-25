import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  CheckCircle,
  XCircle,
  RefreshCw,
  FileText,
  Clock,
  CheckSquare,
  AlertCircle,
  Printer,
} from "lucide-react";
import leaveService from "@/services/leaveService";
import LeaveCard from "./LeaveCard";
import PrintableLeaveApplication from "./PrintableLeaveApplication";
import { showToast } from "@/lib/toast";
import type { LeaveApplication } from "@/types/leave";

const AdminLeaveApplications: React.FC = () => {
  const [applications, setApplications] = useState<LeaveApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [leaveTypeFilter, setLeaveTypeFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);

  const loadApplications = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await leaveService.getLeaveApplications({
        page: currentPage,
        limit: 20,
        status:
          statusFilter !== "all"
            ? (statusFilter as
                | "Pending"
                | "Approved"
                | "Rejected"
                | "Cancelled")
            : undefined,
        leave_type_id:
          leaveTypeFilter !== "all" ? parseInt(leaveTypeFilter) : undefined,
        search: debouncedSearchTerm || undefined,
      });
      setApplications(response.applications);
      setTotalPages(response.totalPages);
    } catch (error) {
      showToast.error("Failed to load leave applications");
      console.error("Error loading applications:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, statusFilter, leaveTypeFilter, debouncedSearchTerm]);

  const loadLeaveTypes = useCallback(async () => {
    try {
      const types = await leaveService.getLeaveTypes();
      setLeaveTypes(types);
    } catch (error) {
      console.error("Error loading leave types:", error);
    }
  }, []);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  useEffect(() => {
    loadLeaveTypes();
  }, [loadLeaveTypes]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to first page when searching
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleApprove = async (application: LeaveApplication) => {
    try {
      await leaveService.approveLeaveApplication(application.id, {
        review_notes: "Approved",
      });
      showToast.success("Leave application approved successfully");
      loadApplications();
    } catch {
      showToast.error("Failed to approve leave application");
    }
  };

  const handleReject = async (application: LeaveApplication) => {
    const reason = prompt("Please provide a reason for rejection:");
    if (!reason) return;

    try {
      await leaveService.rejectLeaveApplication(application.id, {
        review_notes: reason,
      });
      showToast.success("Leave application rejected");
      loadApplications();
    } catch {
      showToast.error("Failed to reject leave application");
    }
  };

  const handlePrint = (application: LeaveApplication) => {
    // Create a temporary container for the printable content
    const printContainer = document.createElement("div");
    printContainer.innerHTML = `
      <style>
        @media print {
          body * {
            visibility: hidden;
          }
          .print-content, .print-content * {
            visibility: visible;
          }
          .print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      </style>
      <div class="print-content" style="padding: 40px; font-family: Arial, sans-serif;">
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 20px;">
          <div style="font-size: 24px; font-weight: bold; margin-bottom: 10px;">LEAVE APPLICATION FORM</div>
          <div>Application ID: #${application.id}</div>
        </div>

        <div style="margin-bottom: 25px;">
          <h3 style="font-size: 18px; margin-bottom: 15px; font-weight: bold;">Employee Information</h3>
          <div style="margin-bottom: 12px;">
            <span style="font-weight: bold; display: inline-block; width: 150px;">Employee Name:</span>
            <span>${application.employee_name}</span>
          </div>
          <div style="margin-bottom: 12px;">
            <span style="font-weight: bold; display: inline-block; width: 150px;">Employee Number:</span>
            <span>${application.employee_number}</span>
          </div>
        </div>

        <div style="margin-bottom: 25px;">
          <h3 style="font-size: 18px; margin-bottom: 15px; font-weight: bold;">Leave Details</h3>
          <div style="margin-bottom: 12px;">
            <span style="font-weight: bold; display: inline-block; width: 150px;">Leave Type:</span>
            <span>${application.leave_type_name}</span>
          </div>
          <div style="margin-bottom: 12px;">
            <span style="font-weight: bold; display: inline-block; width: 150px;">Start Date:</span>
            <span>${new Date(application.start_date).toLocaleDateString(
              "en-US",
              { year: "numeric", month: "long", day: "numeric" }
            )}</span>
          </div>
          <div style="margin-bottom: 12px;">
            <span style="font-weight: bold; display: inline-block; width: 150px;">End Date:</span>
            <span>${new Date(application.end_date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}</span>
          </div>
          <div style="margin-bottom: 12px;">
            <span style="font-weight: bold; display: inline-block; width: 150px;">Duration:</span>
            <span>${application.days_requested} day(s)</span>
          </div>
          <div style="margin-bottom: 12px;">
            <span style="font-weight: bold; display: inline-block; width: 150px;">Status:</span>
            <span style="display: inline-block; padding: 4px 12px; border: 2px solid #000; border-radius: 4px; font-weight: bold;">${
              application.status
            }</span>
          </div>
        </div>

        ${
          application.reason
            ? `
        <div style="margin-bottom: 25px;">
          <h3 style="font-size: 18px; margin-bottom: 15px; font-weight: bold;">Reason for Leave</h3>
          <div style="padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
            ${application.reason}
          </div>
        </div>
        `
            : ""
        }

        <div style="margin-bottom: 25px;">
          <h3 style="font-size: 18px; margin-bottom: 15px; font-weight: bold;">Application Timeline</h3>
          <div style="margin-bottom: 12px;">
            <span style="font-weight: bold; display: inline-block; width: 150px;">Applied On:</span>
            <span>${new Date(application.applied_at).toLocaleDateString(
              "en-US",
              { year: "numeric", month: "long", day: "numeric" }
            )}</span>
          </div>
          ${
            application.reviewed_at
              ? `
          <div style="margin-bottom: 12px;">
            <span style="font-weight: bold; display: inline-block; width: 150px;">Reviewed On:</span>
            <span>${new Date(application.reviewed_at).toLocaleDateString(
              "en-US",
              { year: "numeric", month: "long", day: "numeric" }
            )}</span>
          </div>
          `
              : ""
          }
          ${
            application.reviewed_by
              ? `
          <div style="margin-bottom: 12px;">
            <span style="font-weight: bold; display: inline-block; width: 150px;">Reviewed By:</span>
            <span>${application.reviewed_by}</span>
          </div>
          `
              : ""
          }
        </div>

        ${
          application.review_notes
            ? `
        <div style="margin-bottom: 25px;">
          <h3 style="font-size: 18px; margin-bottom: 15px; font-weight: bold;">Review Notes</h3>
          <div style="padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
            ${application.review_notes}
          </div>
        </div>
        `
            : ""
        }

        <div style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #ccc;">
          <div style="display: flex; justify-content: space-between; margin-top: 60px;">
            <div>
              <div style="margin-top: 40px; border-top: 1px solid #000; width: 250px; padding-top: 5px;">Employee Signature</div>
              <div style="margin-top: 5px; font-size: 12px;">Date: _________________</div>
            </div>
            <div>
              <div style="margin-top: 40px; border-top: 1px solid #000; width: 250px; padding-top: 5px;">Supervisor Signature</div>
              <div style="margin-top: 5px; font-size: 12px;">Date: _________________</div>
            </div>
          </div>
          <div style="margin-top: 40px; font-size: 12px; text-align: center; color: #666;">
            This is a computer-generated document. Printed on ${new Date().toLocaleDateString(
              "en-US",
              {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }
            )}
          </div>
        </div>
      </div>
    `;

    // Append to body, print, and remove
    document.body.appendChild(printContainer);
    window.print();
    document.body.removeChild(printContainer);
  };

  // Remove client-side filtering since we're now doing server-side filtering
  const filteredApplications = applications;

  const getStatusStats = () => {
    return {
      total: applications.length,
      pending: applications.filter((app) => app.status === "Pending").length,
      approved: applications.filter((app) => app.status === "Approved").length,
      rejected: applications.filter((app) => app.status === "Rejected").length,
    };
  };

  const stats = getStatusStats();

  if (isLoading && applications.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading applications...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Total
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl sm:text-3xl font-bold text-blue-600">
              {stats.total}
            </div>
            <p className="text-xs text-muted-foreground mt-1">all requests</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Pending
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
              <Clock className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl sm:text-3xl font-bold text-orange-600">
              {stats.pending}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              awaiting review
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Approved
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
              <CheckSquare className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl sm:text-3xl font-bold text-green-600">
              {stats.approved}
            </div>
            <p className="text-xs text-muted-foreground mt-1">accepted</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Rejected
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl sm:text-3xl font-bold text-red-600">
              {stats.rejected}
            </div>
            <p className="text-xs text-muted-foreground mt-1">declined</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-5">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search by employee, leave type, or reason..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-10"
                  />
                </div>
              </div>

              <div className="md:col-span-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full h-10">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-3">
                <Select
                  value={leaveTypeFilter}
                  onValueChange={setLeaveTypeFilter}
                >
                  <SelectTrigger className="w-full h-10">
                    <SelectValue placeholder="Filter by leave type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Leave Types</SelectItem>
                    {leaveTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id.toString()}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-1">
                <Button
                  variant="outline"
                  onClick={loadApplications}
                  disabled={isLoading}
                  className="w-full h-10"
                  size="sm"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                  />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Applications List */}
      {filteredApplications.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              {applications.length === 0
                ? "No leave applications found."
                : "No applications match your search criteria."}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredApplications.map((application) => (
            <LeaveCard
              key={application.id}
              leave={application}
              showEmployee={true}
              actions={
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePrint(application)}
                    className="border-blue-300 hover:bg-blue-50"
                  >
                    <Printer className="h-4 w-4 mr-1" />
                    Print
                  </Button>
                  {application.status === "Pending" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleApprove(application)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(application)}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              }
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminLeaveApplications;
