import React from 'react';
import { Input } from '@/components/ui/input';  
import { Button } from '@/components/ui/button';
import { Search, RotateCcw } from 'lucide-react';
import { Card, CardContent} from '@/components/ui/card';
import type { TrainingFilters } from '@/types/training';

interface TrainingFiltersComponentProps {
  filters: Partial<TrainingFilters>;
  onFiltersChange: (filters: Partial<TrainingFilters>) => void;
  className?: string;
}

const TrainingFiltersComponent: React.FC<TrainingFiltersComponentProps> = ({
  filters,
  onFiltersChange,
  className = ''
}) => {

  const handleFilterChange = (key: keyof TrainingFilters, value: unknown) => {
    onFiltersChange({
      ...filters,
      [key]: value,
      page: 1,
    });
  };

  const handleReset = () => {
    onFiltersChange({
      page: 1,
    });
  };

  return (
    <Card className={className}>
      <CardContent>
        <div className="space-y-2">
          <div className='flex items-center justify-between'>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search by training program, employee name, or employee ID..."
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="ml-2"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset
            </Button>
          </div>
          
        </div>
      </CardContent>
    </Card>
  );
};

export default TrainingFiltersComponent;