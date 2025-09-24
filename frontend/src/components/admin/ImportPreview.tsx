// components/admin/ImportPreview.tsx - Preview component for Excel import
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Users,
  FileText,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff
} from 'lucide-react';
import type { ImportPreviewData } from '@/types/import';

interface ImportPreviewProps {
  data: ImportPreviewData;
  onProceed: () => void;
  onBack: () => void;
}

const ImportPreview: React.FC<ImportPreviewProps> = ({ data, onProceed, onBack }) => {
  const [showAllRows, setShowAllRows] = useState(false);
  const [selectedTab, setSelectedTab] = useState('summary');

  const displayRows = showAllRows ? data.previewData : data.previewData.slice(0, 10);
  const hasMoreRows = data.previewData.length > 10;

  // Render field mapping
  const renderFieldMapping = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Field Mapping
        </CardTitle>
        <CardDescription>
          Excel columns mapped to database fields
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(data.fieldMapping).map(([field, excelColumn]) => (
            <div key={field} className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="font-medium">{field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
              <Badge variant="secondary">{excelColumn}</Badge>
            </div>
          ))}
        </div>
        
        {data.unmappedColumns.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Unmapped Columns (will be ignored):</h4>
            <div className="flex flex-wrap gap-2">
              {data.unmappedColumns.map((col, index) => (
                <Badge key={index} variant="outline" className="text-muted-foreground">
                  {col.column}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Render validation errors
  const renderValidationErrors = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <XCircle className="h-5 w-5 text-destructive" />
          Validation Errors ({data.validationErrors.length})
        </CardTitle>
        <CardDescription>
          Issues that need to be resolved before import
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.validationErrors.length === 0 ? (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span>No validation errors found</span>
          </div>
        ) : (
          <ScrollArea className="h-64">
            <div className="space-y-2">
              {data.validationErrors.map((error, index) => (
                <Alert key={index} variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );

  // Render data preview
  const renderDataPreview = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Data Preview
          </div>
          {hasMoreRows && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAllRows(!showAllRows)}
            >
              {showAllRows ? (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Show Less
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Show All ({data.previewData.length})
                </>
              )}
            </Button>
          )}
        </CardTitle>
        <CardDescription>
          Preview of employee data to be imported
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-4">
            {displayRows.map((row) => (
              <div
                key={row.rowNumber}
                className={`p-4 border rounded-lg ${
                  row.hasErrors ? 'border-destructive bg-destructive/5' : 'border-border'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Row {row.rowNumber}</Badge>
                    {row.hasErrors ? (
                      <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" />
                        Has Errors
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Valid
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Employee Data */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-sm">
                  {Object.entries(row.data).map(([field, value]) => (
                    <div key={field} className="space-y-1">
                      <span className="text-muted-foreground text-xs">
                        {field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                      <div className="font-medium truncate" title={String(value)}>
                        {value || '-'}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Row Errors */}
                {row.hasErrors && (
                  <div className="mt-3 pt-3 border-t border-destructive/20">
                    <div className="space-y-1">
                      {row.errors.map((error, index) => (
                        <div key={index} className="text-sm text-destructive flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <FileText className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{data.totalRows}</p>
                <p className="text-xs text-muted-foreground">Total Rows</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-green-600">{data.validRows}</p>
                <p className="text-xs text-muted-foreground">Valid Rows</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <XCircle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-red-600">{data.invalidRows}</p>
                <p className="text-xs text-muted-foreground">Invalid Rows</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold text-purple-600">{data.previewRows}</p>
                <p className="text-xs text-muted-foreground">Preview Rows</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Import Status Alert */}
      {data.validationErrors.length > 0 ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Validation Issues Found:</strong> {data.validationErrors.length} errors need to be resolved. 
            You can choose to skip invalid rows during import or fix the issues in your Excel file.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Ready for Import:</strong> All {data.validRows} rows passed validation and are ready to be imported.
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs for detailed view */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="summary">Field Mapping</TabsTrigger>
          <TabsTrigger value="errors">
            Validation Errors
            {data.validationErrors.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {data.validationErrors.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="preview">Data Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-4">
          {renderFieldMapping()}
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          {renderValidationErrors()}
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          {renderDataPreview()}
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Upload
        </Button>

        <div className="flex items-center gap-2">
          {data.validRows > 0 && (
            <Button onClick={onProceed}>
              Configure Import Options
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportPreview;