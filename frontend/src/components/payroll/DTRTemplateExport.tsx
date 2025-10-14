import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { showToast } from '@/lib/toast';
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react';
import dtrService from '@/services/dtrService';

interface DTRTemplateExportProps {
  periodId: number;
  periodName: string;
  disabled?: boolean;
}

export function DTRTemplateExport({ periodId, periodName, disabled = false }: DTRTemplateExportProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportTemplate = async () => {
    try {
      setIsExporting(true);

      // Call the API to get the template
      const blob = await dtrService.exportTemplate(periodId);

      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const fileName = `DTR_Template_${periodName}_${timestamp}.xlsx`;
      link.download = fileName;

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Show success message
      showToast.success('Template exported successfully', `File: ${fileName}`);
    } catch (error) {
      console.error('Failed to export DTR template:', error);
      showToast.error(
        'Failed to export template',
        'Please try again or contact support if the problem persists.'
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={handleExportTemplate}
          disabled={disabled || isExporting}
          variant="outline"
          size="default"
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FileSpreadsheet className="h-4 w-4" />
              <Download className="h-4 w-4" />
              Export DTR Template
            </>
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs">
        <p>
          Download an Excel template pre-filled with employee information. 
          Fill in the working days and import it back to process payroll.
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
