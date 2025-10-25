import React, { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileText,
  Edit,
  Trash2,
  Search,
  Clock,
  CalendarIcon,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import leaveService from "@/services/leaveService";
import LeaveCard from "./LeaveCard";
import { showToast } from "@/lib/toast";
import type { LeaveApplication } from "@/types/leave";
import {
  dateStringToDateObject,
  dateObjectToDateString,
} from "@/utils/helpers";

const editLeaveSchema = z
  .object({
    start_date: z.date(),
    end_date: z.date(),
    reason: z.string().min(1, "Reason is required"),
  })
  .refine((data) => data.end_date >= data.start_date, {
    message: "End date must be after or equal to start date",
    path: ["end_date"],
  });

type EditLeaveFormData = z.infer<typeof editLeaveSchema>;

interface EmployeeLeaveApplicationsProps {
  employeeId: number;
}

const EmployeeLeaveApplications: React.FC<EmployeeLeaveApplicationsProps> = ({
  employeeId,
}) => {
  const [applications, setApplications] = useState<LeaveApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedApplication, setSelectedApplication] =
    useState<LeaveApplication | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<EditLeaveFormData>({
    resolver: zodResolver(editLeaveSchema),
  });

  const loadApplications = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log(`Loading applications for employee ${employeeId}`);
      const response = await leaveService.getLeaveApplications({
        employee_id: employeeId,
        page: 1,
        limit: 100,
      });
      console.log("Received applications:", response);
      setApplications(response.applications);
    } catch (error) {
      showToast.error("Failed to load leave applications");
      console.error("Error loading applications:", error);
    } finally {
      setIsLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const handleEdit = (application: LeaveApplication) => {
    if (application.status !== "Pending") {
      showToast.error("Only pending applications can be edited");
      return;
    }
    setSelectedApplication(application);

    // Set form values
    form.reset({
      start_date: dateStringToDateObject(application.start_date),
      end_date: dateStringToDateObject(application.end_date),
      reason: application.reason,
    });

    setShowEditDialog(true);
  };

  const handleEditSubmit = async (data: EditLeaveFormData) => {
    if (!selectedApplication) return;

    setIsSubmitting(true);
    try {
      await leaveService.updateLeaveApplication(selectedApplication.id, {
        start_date: dateObjectToDateString(data.start_date),
        end_date: dateObjectToDateString(data.end_date),
        reason: data.reason,
      });

      showToast.success("Leave application updated successfully");
      setShowEditDialog(false);
      loadApplications();
    } catch (error) {
      showToast.error("Failed to update leave application");
      console.error("Error updating application:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateDays = (startDate?: Date, endDate?: Date) => {
    if (!startDate || !endDate) return 0;
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const handleCancel = async (application: LeaveApplication) => {
    if (application.status !== "Pending") {
      showToast.error("Only pending applications can be cancelled");
      return;
    }

    try {
      await leaveService.cancelLeaveApplication(application.id);
      showToast.success("Leave application cancelled successfully");
      loadApplications();
    } catch {
      showToast.error("Failed to cancel leave application");
    }
  };

  const handleDelete = async (application: LeaveApplication) => {
    if (application.status !== "Pending") {
      showToast.error("Only pending applications can be deleted");
      return;
    }

    if (!confirm("Are you sure you want to delete this leave application?")) {
      return;
    }

    try {
      await leaveService.deleteLeaveApplication(application.id);
      showToast.success("Leave application deleted successfully");
      loadApplications();
    } catch {
      showToast.error("Failed to delete leave application");
    }
  };

  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      !searchTerm ||
      app.leave_type_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.reason.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || app.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading applications...</div>
        </CardContent>
      </Card>
    );
  }

  const getStatusStats = () => {
    return {
      total: applications.length,
      pending: applications.filter((app) => app.status === "Pending").length,
      approved: applications.filter((app) => app.status === "Approved").length,
      rejected: applications.filter((app) => app.status === "Rejected").length,
    };
  };

  const stats = getStatusStats();

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Applications
            </CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">all your requests</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">awaiting approval</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approved}</div>
            <p className="text-xs text-muted-foreground">
              successfully approved
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rejected}</div>
            <p className="text-xs text-muted-foreground">needs revision</p>
          </CardContent>
        </Card>
      </div>

      {/* Header and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search applications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
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
        </CardContent>
      </Card>

      {/* Applications List */}
      {filteredApplications.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              {applications.length === 0
                ? "No leave applications found. Create your first application!"
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
              actions={
                <div className="flex space-x-2">
                  {application.status === "Pending" && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(application)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCancel(application)}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(application)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              }
            />
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      {showEditDialog && selectedApplication && (
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Leave Application</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={form.handleSubmit(handleEditSubmit)}
              className="space-y-6 p-4"
            >
              {/* Leave Type Display */}
              <div className="space-y-2">
                <Label>Leave Type</Label>
                <div className="p-2 bg-muted rounded text-sm">
                  {selectedApplication.leave_type_name} (
                  {selectedApplication.leave_type_code})
                </div>
                <p className="text-xs text-muted-foreground">
                  Leave type cannot be changed after submission
                </p>
              </div>

              {/* Date Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Start Date */}
                <div className="space-y-2">
                  <Label>Start Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={`w-full justify-start text-left font-normal ${
                          !form.watch("start_date") && "text-muted-foreground"
                        }`}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.watch("start_date")
                          ? format(form.watch("start_date"), "PPP")
                          : "Pick a start date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={form.watch("start_date")}
                        onSelect={(date) => form.setValue("start_date", date!)}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {form.formState.errors.start_date && (
                    <p className="text-sm text-red-600">
                      {form.formState.errors.start_date.message}
                    </p>
                  )}
                </div>

                {/* End Date */}
                <div className="space-y-2">
                  <Label>End Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={`w-full justify-start text-left font-normal ${
                          !form.watch("end_date") && "text-muted-foreground"
                        }`}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.watch("end_date")
                          ? format(form.watch("end_date"), "PPP")
                          : "Pick an end date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={form.watch("end_date")}
                        onSelect={(date) => form.setValue("end_date", date!)}
                        disabled={(date) =>
                          !form.watch("start_date") ||
                          date < form.watch("start_date")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {form.formState.errors.end_date && (
                    <p className="text-sm text-red-600">
                      {form.formState.errors.end_date.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Days Calculation */}
              {form.watch("start_date") && form.watch("end_date") && (
                <div className="flex items-center space-x-2 text-sm">
                  <Clock className="h-4 w-4" />
                  <span>
                    Duration:{" "}
                    {calculateDays(
                      form.watch("start_date"),
                      form.watch("end_date")
                    )}{" "}
                    day(s)
                  </span>
                </div>
              )}

              {/* Reason */}
              <div className="space-y-2">
                <Label htmlFor="reason">Reason *</Label>
                <Textarea
                  {...form.register("reason")}
                  placeholder="Please provide a reason for your leave request..."
                  className="min-h-[100px]"
                />
                {form.formState.errors.reason && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.reason.message}
                  </p>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex space-x-2">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? "Updating..." : "Update Application"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditDialog(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default EmployeeLeaveApplications;
