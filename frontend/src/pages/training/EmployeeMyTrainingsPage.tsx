import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RefreshCw, Search } from "lucide-react";
import TrainingCard from "@/components/training/TrainingCard";
import TrainingFilters from "@/components/training/TrainingFilters";
import TrainingDetailView from "@/components/training/TrainingDetailView";
import trainingService from "@/services/trainingService";
import { useAuth } from "@/contexts/AuthContext";
import type {
  Training,
  TrainingFilters as TrainingFiltersType,
} from "@/types/training";

const EmployeeMyTrainingsPage: React.FC = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState<Partial<TrainingFiltersType>>({
    page: 1,
    limit: 12,
    sort_by: "start_date",
    sort_order: "desc",
    employee_id: user?.employee_id,
  });
  const [selectedTraining, setSelectedTraining] = useState<Training | null>(
    null
  );
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Fetch my training records
  const {
    data: myTrainingData,
    isLoading: isLoadingTrainings,
    error: trainingError,
    refetch: refetchTrainings,
  } = useQuery({
    queryKey: ["my-trainings", filters],
    queryFn: () =>
      trainingService.getTrainings({
        ...filters,
        employee_id: user?.employee_id,
      }),
    enabled: !!user?.employee_id,
    staleTime: 5 * 60 * 1000,
  });

  const handleFiltersChange = (newFilters: Partial<TrainingFiltersType>) => {
    setFilters({
      ...newFilters,
      employee_id: user?.employee_id,
    });
  };

  const openViewForm = (training: Training) => {
    setSelectedTraining(training);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setSelectedTraining(null);
    setIsFormOpen(false);
  };

  const myTrainings = myTrainingData?.trainings || [];
  const pagination = myTrainingData?.pagination;

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  if (trainingError) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Failed to load your training records</p>
            <Button onClick={() => refetchTrainings()} className="mt-2">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="container mx-auto space-y-6">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background pb-4 pt-2 border-b border-border">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">My Training Records</h1>
            <p className="text-muted-foreground">
              View your training history assigned by admin
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <TrainingFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />

      {/* Loading State */}
      {isLoadingTrainings && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span>Loading your training records...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Training Records */}
      {!isLoadingTrainings && (
        <>
          {myTrainings.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myTrainings.map((training) => (
                  <TrainingCard
                    key={training.id}
                    training={training}
                    onView={() => openViewForm(training)}
                    showEmployeeInfo={false}
                    readOnly={true}
                  />
                ))}
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex justify-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrevPage}
                  >
                    Previous
                  </Button>
                  {Array.from(
                    { length: Math.min(5, pagination.totalPages) },
                    (_, i) => {
                      const page = Math.max(1, pagination.currentPage - 2) + i;
                      if (page <= pagination.totalPages) {
                        return (
                          <Button
                            key={page}
                            variant={
                              page === pagination.currentPage
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            onClick={() => handlePageChange(page)}
                          >
                            {page}
                          </Button>
                        );
                      }
                      return null;
                    }
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasNextPage}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">
                  No training records found
                </h3>
                <p className="text-muted-foreground">
                  Your training records will appear here once assigned by an
                  administrator
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Enhanced Training View Dialog */}
      <Dialog open={isFormOpen} onOpenChange={closeForm}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 py-5 border-b bg-gradient-to-r from-primary/5 to-background">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <svg
                  className="w-5 h-5 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">
                  Training Details
                </DialogTitle>
                <DialogDescription className="text-sm mt-1">
                  Complete information about your training record
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {selectedTraining && (
              <TrainingDetailView training={selectedTraining} />
            )}
          </div>
          <div className="px-6 py-4 border-t bg-background flex justify-end gap-2">
            <Button
              onClick={closeForm}
              variant="default"
              className="min-w-[120px] font-medium"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeeMyTrainingsPage;
