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
import employeeService from "@/services/employeeService";
import LeaveCard from "./LeaveCard";
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

  const handlePrint = async (application: LeaveApplication) => {
    // Fetch employee details to get position and salary
    let employeePosition = "";
    let employeeSalary = 0;
    
    try {
      const employee = await employeeService.getEmployee(application.employee_id);
      employeePosition = employee.position || "";
      employeeSalary = employee.salary || 0;
    } catch (error) {
      console.error("Error fetching employee details:", error);
      // Continue with printing even if employee fetch fails
    }
    
    const formatDateRange = () => {
      const start = new Date(application.start_date);
      const end = new Date(application.end_date);
      const options: Intl.DateTimeFormatOptions = {
        month: "long",
        day: "numeric",
        year: "numeric",
      };

      if (start.toDateString() === end.toDateString()) {
        return start.toLocaleDateString("en-US", options);
      }
      return `${start.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
      })}-${end.toLocaleDateString("en-US", {
        day: "numeric",
        year: "numeric",
      })}`;
    };

    const getLeaveTypeCheckbox = (type: string) => {
      const leaveType = application.leave_type_name?.toLowerCase() || "";
      return leaveType.includes(type.toLowerCase()) ? "checked" : "";
    };

    const formatSalary = (salary?: number) => {
      if (!salary || salary === 0) return "";
      return `P${salary.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    };
    
    // Use fetched employee data
    const position = employeePosition;
    const salary = formatSalary(employeeSalary);

    // Create a temporary container for the printable content
    const printContainer = document.createElement("div");
    printContainer.innerHTML = `
      <style>
        @media print {
          @page {
            size: letter;
            margin: 0.3in;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            height: 100%;
            overflow: hidden;
          }
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
        .print-content {
          font-family: Arial, sans-serif;
          font-size: 9px;
          background-color: #fff;
          box-sizing: border-box;
          padding: 10px;
        }
        .print-header {
          text-align: center;
          position: relative;
          padding-bottom: 5px;
          margin-bottom: 5px;
        }
        .print-header-left {
          position: absolute;
          left: 0;
          top: 0;
          font-size: 8px;
          text-align: left;
        }
        .print-header-right {
          position: absolute;
          right: 0;
          top: 0;
          border: 1px dashed #666;
          padding: 5px 10px;
          font-size: 8px;
          text-align: center;
          height: 40px;
        }
        .print-logo {
          border: 1px solid #000;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 8px;
          font-weight: bold;
          background-color: #4a90e2;
          color: white;
          flex-shrink: 0;
        }
        .print-form-title {
          font-size: 12px;
          font-weight: bold;
          text-align: center;
          margin: 5px 0 8px 0;
          clear: both;
          width: 100%;
          display: block;
        }
        .print-main-table {
          width: 100%;
          border-collapse: collapse;
          border: 1px solid #000;
        }
        .print-main-table th,
        .print-main-table td {
          border: 1px solid #000;
          padding: 2px 4px;
          vertical-align: top;
        }
        .print-section-title {
          background-color: #dbdbdb;
          text-align: center;
          font-weight: bold;
          font-size: 10px;
          padding: 3px;
        }
        .print-field-label {
          font-size: 8px;
          color: #333;
          margin-bottom: 1px;
        }
        .print-field-value {
          font-weight: bold;
          font-family: 'Consolas', 'Courier New', monospace;
          font-size: 9px;
          min-height: 12px;
        }
        .print-checkbox-label {
          display: flex;
          align-items: center;
          margin-bottom: 2px;
          font-size: 8px;
        }
        .print-checkbox-label input[type="checkbox"] {
          margin-right: 3px;
          vertical-align: middle;
        }
        .print-signature-box {
          text-align: center;
          padding-top: 15px;
        }
        .print-signature-line {
          border-top: 1px solid #000;
          margin: 0 auto;
          width: 200px;
          padding-top: 2px;
          font-size: 8px;
        }
      </style>
      <div class="print-content">
        <div class="print-header">
          <div class="print-header-left">
            Civil Service Form No. 6<br>
            Revised 2020
          </div>
          <div class="print-header-right">
            Stamp of Date of Receipt
          </div>
          <div style="display: flex; flex-direction: row; align-items: center; justify-content: center; gap: 15px; padding-top: 45px;">
            <div class="print-logo">AGENCY<br>LOGO</div>
            <div style="text-align: center; font-size: 9px;">
              Republic of the Philippines<br>
              <strong>(Agency Name)</strong><br>
              (Agency Address)
            </div>
          </div>
        </div>

        <div class="print-form-title">APPLICATION FOR LEAVE</div>

        <table class="print-main-table">
          <tbody>
            <tr>
              <td style="width: 50%;">
                <div class="print-field-label">1. OFFICE/DEPARTMENT</div>
                <div class="print-field-value">LGU Department</div>
              </td>
              <td style="width: 50%;" colspan="2">
                <div class="print-field-label">2. NAME: (Last) (First) (Middle)</div>
                <div class="print-field-value">${(
                  application.employee_name || "N/A"
                ).toUpperCase()}</div>
              </td>
            </tr>
            <tr>
              <td style="width: 33.3%;">
                <div class="print-field-label">3. DATE OF FILING</div>
                <div class="print-field-value">${new Date(
                  application.applied_at
                ).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}</div>
              </td>
              <td style="width: 33.3%;">
                <div class="print-field-label">4. POSITION</div>
                <div class="print-field-value">${position}</div>
              </td>
              <td style="width: 33.3%;">
                <div class="print-field-label">5. SALARY</div>
                <div class="print-field-value">${salary}</div>
              </td>
            </tr>
          </tbody>
        </table>

        <table class="print-main-table" style="margin-top: -1px;">
          <thead>
            <tr>
              <th class="print-section-title" colspan="2">6. DETAILS OF APPLICATION</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="width: 50%; vertical-align: top;">
                <div style="padding: 5px;">
                  <strong>6.A TYPE OF LEAVE TO BE AVAILED OF</strong><br><br>
                  <label class="print-checkbox-label">
                    <input type="checkbox" ${getLeaveTypeCheckbox("vacation")}>
                    <strong>Vacation Leave</strong> (Sec. 51, Rule XVI, Omnibus Rules Implementing E.O. No. 292)
                  </label>
                  <label class="print-checkbox-label">
                    <input type="checkbox" ${getLeaveTypeCheckbox("mandatory")}>
                    Mandatory/Forced Leave (Sec. 25, Rule XVI, Omnibus Rules Implementing EO. No. 292)
                  </label>
                  <label class="print-checkbox-label">
                    <input type="checkbox" ${getLeaveTypeCheckbox("sick")}>
                    <strong>Sick Leave</strong> (Sec. 43, Rule XVI, Omnibus Rules Implementing E.O. No. 292)
                  </label>
                  <label class="print-checkbox-label">
                    <input type="checkbox" ${getLeaveTypeCheckbox("maternity")}>
                    Maternity Leave (R.A. No. 11210/IRR issued by CSC, DOLE and SSS)
                  </label>
                  <label class="print-checkbox-label">
                    <input type="checkbox" ${getLeaveTypeCheckbox("paternity")}>
                    Paternity Leave (R.A. No. 8187/CSC MC No. 71, s. 1998, as amended)
                  </label>
                  <label class="print-checkbox-label">
                    <input type="checkbox" ${getLeaveTypeCheckbox(
                      "special privilege"
                    )}>
                    Special Privilege Leave (Sec. 21, Rule XVI, Omnibus Rules Implementing E.O. No. 292)
                  </label>
                  <label class="print-checkbox-label">
                    <input type="checkbox" ${getLeaveTypeCheckbox(
                      "solo parent"
                    )}>
                    Solo Parent Leave (RA No. 8972/CSC MC No. 8, s. 2004)
                  </label>
                  <label class="print-checkbox-label">
                    <input type="checkbox" ${getLeaveTypeCheckbox("study")}>
                    Study Leave (Sec. 68, Rule XVI, Omnibus Rules Implementing E.O. No. 292)
                  </label>
                  <label class="print-checkbox-label">
                    <input type="checkbox" ${getLeaveTypeCheckbox("vawc")}>
                    10-Day VAWC Leave (RA No. 9262/CSC MC No. 15. s. 2005)
                  </label>
                  <label class="print-checkbox-label">
                    <input type="checkbox" ${getLeaveTypeCheckbox(
                      "rehabilitation"
                    )}>
                    Rehabilitation Privilege (Sec. 55, Rule XVI, Omnibus Rules Implementing E.O. No. 292)
                  </label>
                  <label class="print-checkbox-label">
                    <input type="checkbox" ${getLeaveTypeCheckbox(
                      "special leave benefits for women"
                    )}>
                    Special Leave Benefits for Women (RA No. 9710/CSC MC No. 25, s. 2010)
                  </label>
                  <label class="print-checkbox-label">
                    <input type="checkbox" ${getLeaveTypeCheckbox("calamity")}>
                    Special Emergency (Calamity) Leave (CSC MC No. 2, s. 2012, as amended)
                  </label>
                  <label class="print-checkbox-label">
                    <input type="checkbox" ${getLeaveTypeCheckbox("adoption")}>
                    Adoption Leave (R.A. No. 8552)
                  </label>
                  <br>
                  <div class="print-field-label">Others:</div>
                  <div style="border-bottom: 1px solid #000; min-height: 14px;"></div>
                </div>

                <hr style="border: none; border-top: 1px solid #000; margin: 0;">

                <div style="padding: 5px;">
                  <strong>6.C NUMBER OF WORKING DAYS APPLIED FOR</strong>
                  <div class="print-field-value" style="margin-top: 5px;">${
                    application.days_requested
                  } day(s)</div>
                  <br>
                  <div class="print-field-label">INCLUSIVE DATES</div>
                  <div class="print-field-value">${formatDateRange()}</div>
                </div>
              </td>

              <td style="width: 50%; vertical-align: top; border-left: 1px solid #000;">
                <div style="padding: 5px;">
                  <strong>6.B DETAILS OF LEAVE</strong>

                  <div style="border-bottom: 1px solid #000; padding-bottom: 5px; margin-bottom: 5px;">
                    In case of Vacation/Special Privilege Leave:
                    <label class="print-checkbox-label" style="margin-left: 10px; margin-top: 5px;">
                      <input type="checkbox" ${
                        getLeaveTypeCheckbox("vacation") ? "checked" : ""
                      }>
                      Within the Philippines
                    </label>
                    <div class="print-field-value" style="margin-left: 32px;">Residence</div>
                    <label class="print-checkbox-label" style="margin-left: 10px; margin-top: 5px;">
                      <input type="checkbox">
                      Abroad (Specify)
                    </label>
                    <div style="border-bottom: 1px solid #000; margin-left: 32px; min-height: 14px;"></div>
                  </div>

                  <div style="border-bottom: 1px solid #000; padding-bottom: 5px; margin-bottom: 5px;">
                    In case of Sick Leave:
                    <label class="print-checkbox-label" style="margin-left: 10px; margin-top: 5px;">
                      <input type="checkbox">
                      In Hospital (Specify Illness)
                    </label>
                    <div style="border-bottom: 1px solid #000; margin-left: 32px; min-height: 14px;">${
                      getLeaveTypeCheckbox("sick")
                        ? application.reason || ""
                        : ""
                    }</div>
                    <label class="print-checkbox-label" style="margin-left: 10px; margin-top: 5px;">
                      <input type="checkbox">
                      Out Patient (Specify Illness)
                    </label>
                    <div style="border-bottom: 1px solid #000; margin-left: 32px; min-height: 14px;"></div>
                  </div>

                  <div style="border-bottom: 1px solid #000; padding-bottom: 5px; margin-bottom: 5px;">
                    In case of Special Leave Benefits for Women:<br>
                    <label style="display: block; margin-left: 22px; font-size: 9px;">(Specify Illness)</label>
                    <div style="border-bottom: 1px solid #000; margin-left: 22px; min-height: 14px;"></div>
                  </div>

                  <div style="padding-bottom: 5px;">
                    In case of Study Leave:
                    <label class="print-checkbox-label" style="margin-left: 10px; margin-top: 5px;">
                      <input type="checkbox">
                      Completion of Master's Degree
                    </label>
                    <label class="print-checkbox-label" style="margin-left: 10px; margin-top: 5px;">
                      <input type="checkbox">
                      BAR/Board Examination Review
                    </label>
                    <div class="print-field-label" style="margin-left: 10px; margin-top: 5px;">Other purpose:</div>
                    <label class="print-checkbox-label" style="margin-left: 10px; margin-top: 5px;">
                      <input type="checkbox">
                      Monetization of Leave Credits
                    </label>
                    <label class="print-checkbox-label" style="margin-left: 10px; margin-top: 5px;">
                      <input type="checkbox">
                      Terminal Leave
                    </label>
                  </div>
                </div>
                
                <hr style="border: none; border-top: 1px solid #000; margin: 0;">

                <div style="padding: 5px;">
                  <strong>6.D COMMUTATION</strong>
                  <label class="print-checkbox-label" style="margin-left: 10px; margin-top: 5px;">
                    <input type="checkbox" checked>
                    Not Requested
                  </label>
                  <label class="print-checkbox-label" style="margin-left: 10px; margin-top: 5px;">
                    <input type="checkbox">
                    Requested
                  </label>
                </div>
                
                <div class="print-signature-box">
                  <div class="print-signature-line">(Signature of Applicant)</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <table class="print-main-table" style="margin-top: -1px;">
          <thead>
            <tr>
              <th class="print-section-title" colspan="2">7. DETAILS OF ACTION ON APPLICATION</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="width: 50%; vertical-align: top;">
                <div style="padding: 5px;">
                  <strong>7.A CERTIFICATION OF LEAVE CREDITS</strong><br>
                  As of <strong>${new Date().toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}</strong>
                  <table class="print-main-table" style="margin-top: 5px; text-align: center; font-size: 9px;">
                    <thead>
                      <tr>
                        <th></th>
                        <th>Vacation Leave</th>
                        <th>Sick Leave</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style="text-align: left;">Total Earned</td>
                        <td></td>
                        <td></td>
                      </tr>
                      <tr>
                        <td style="text-align: left;">Less this application</td>
                        <td></td>
                        <td></td>
                      </tr>
                      <tr>
                        <td style="text-align: left;">Balance</td>
                        <td></td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                  <div class="print-signature-box" style="padding-top: 20px;">
                    <div class="print-signature-line">(Authorized Officer)</div>
                  </div>
                </div>
                
                <hr style="border: none; border-top: 1px solid #000; margin: 0;">

                <div style="padding: 5px;">
                  <strong>7.C APPROVED FOR:</strong><br>
                  <div style="margin-top: 5px;">
                    <span style="display: inline-block; width: 40px; text-align: center; border-bottom: 1px solid #000; font-weight: bold;">${
                      application.status === "Approved"
                        ? application.days_requested
                        : ""
                    }</span>
                    days with pay
                  </div>
                  <div style="margin-top: 5px;">
                    <span style="display: inline-block; width: 40px; border-bottom: 1px solid #000;"></span>
                    days without pay
                  </div>
                  <div style="margin-top: 5px;">
                    <span style="display: inline-block; width: 40px; border-bottom: 1px solid #000;"></span>
                    others (Specify)
                  </div>
                </div>
              </td>

              <td style="width: 50%; vertical-align: top; border-left: 1px solid #000;">
                <div style="padding: 5px;">
                  <strong>7.B RECOMMENDATION</strong>
                  <label class="print-checkbox-label" style="margin-left: 10px; margin-top: 5px;">
                    <input type="checkbox" ${
                      application.status === "Approved" ? "checked" : ""
                    }>
                    For approval
                  </label>
                  <label class="print-checkbox-label" style="margin-left: 10px; margin-top: 5px;">
                    <input type="checkbox" ${
                      application.status === "Rejected" ? "checked" : ""
                    }>
                    For disapproval due to
                  </label>
                  <div style="margin-left: 32px; border-bottom: 1px solid #000; min-height: 14px;">${
                    application.status === "Rejected"
                      ? application.review_notes || ""
                      : ""
                  }</div>
                  
                  <div class="print-signature-box" style="padding-top: 61px;">
                    <div class="print-signature-line">${
                      application.reviewed_by_name || "(Authorized Officer)"
                    }</div>
                  </div>
                </div>

                <hr style="border: none; border-top: 1px solid #000; margin: 0;">

                <div style="padding: 5px;">
                  <strong>7.D DISAPPROVED DUE TO:</strong><br>
                  <div style="margin-top: 5px; border-bottom: 1px solid #000; min-height: 14px;">${
                    application.status === "Rejected"
                      ? application.review_notes || ""
                      : ""
                  }</div>
                  <div style="margin-top: 5px; border-bottom: 1px solid #000; min-height: 14px;"></div>
                  
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        
        <div style="display: flex; justify-content: space-between; padding-top: 25px; gap: 30px;">
          <div style="flex: 1; text-align: center;">
            <div class="print-signature-line" style="width: 100%;">(Authorized Official)</div>
            <div style="margin-top: 3px; font-size: 8px;">Name and Signature</div>
          </div>
          <div style="flex: 1; text-align: center;">
            <div class="print-signature-line" style="width: 100%;">(Authorized Official)</div>
            <div style="margin-top: 3px; font-size: 8px;">Name and Signature</div>
          </div>
           <div style="flex: 1; text-align: center;">
            <div class="print-signature-line" style="width: 100%;">(Authorized Official)</div>
            <div style="margin-top: 3px; font-size: 8px;">Name and Signature</div>
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
