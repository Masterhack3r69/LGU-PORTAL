import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import payrollService from '@/services/payrollService';

/**
 * Debug Component for Employee Payroll
 * 
 * This component helps debug why finalized payroll items are not showing
 * by displaying raw API responses and filtering steps.
 * 
 * Usage: Add <PayrollDebugInfo /> to EmployeePayrollPage temporarily
 */
export function PayrollDebugInfo() {
  const [debugData, setDebugData] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const runDebugTests = async () => {
    setLoading(true);
    const results: any = {};

    try {
      // Test 1: Get employee payroll periods
      console.log('🧪 Testing getEmployeePayrollPeriods...');
      const periodsResponse = await payrollService.getEmployeePayrollPeriods();
      results.periods = {
        success: periodsResponse.success,
        dataType: Array.isArray(periodsResponse.data) ? 'Array' : typeof periodsResponse.data,
        count: Array.isArray(periodsResponse.data) ? periodsResponse.data.length : 0,
        data: periodsResponse.data,
        message: periodsResponse.message
      };
      console.log('Periods response:', periodsResponse);

      // Test 2: Get employee payroll items (all)
      console.log('🧪 Testing getEmployeePayrollItems (all)...');
      const itemsResponse = await payrollService.getEmployeePayrollItems();
      results.allItems = {
        success: itemsResponse.success,
        dataType: Array.isArray(itemsResponse.data) ? 'Array' : typeof itemsResponse.data,
        count: Array.isArray(itemsResponse.data) ? itemsResponse.data.length : 0,
        data: itemsResponse.data,
        message: itemsResponse.message
      };
      console.log('All items response:', itemsResponse);

      // Test 3: Filter items (simulate frontend logic)
      if (Array.isArray(itemsResponse.data)) {
        const finalizedItems = itemsResponse.data.filter(item => 
          item.status?.toLowerCase() === 'finalized' || 
          item.status?.toLowerCase() === 'paid'
        );
        
        results.filteredItems = {
          originalCount: itemsResponse.data.length,
          finalizedCount: finalizedItems.length,
          finalizedItems: finalizedItems,
          statusDistribution: itemsResponse.data.reduce((acc: any, item: any) => {
            acc[item.status] = (acc[item.status] || 0) + 1;
            return acc;
          }, {})
        };
        console.log('Filtered items:', finalizedItems);
      }

      // Test 4: Test with specific period if periods exist
      if (Array.isArray(periodsResponse.data) && periodsResponse.data.length > 0) {
        const firstPeriod = periodsResponse.data[0];
        console.log(`🧪 Testing getEmployeePayrollItems for period ${firstPeriod.id}...`);
        const periodItemsResponse = await payrollService.getEmployeePayrollItems({ 
          period_id: firstPeriod.id 
        });
        
        results.periodItems = {
          periodId: firstPeriod.id,
          success: periodItemsResponse.success,
          count: Array.isArray(periodItemsResponse.data) ? periodItemsResponse.data.length : 0,
          data: periodItemsResponse.data,
          message: periodItemsResponse.message
        };
        console.log('Period items response:', periodItemsResponse);
      }

    } catch (error) {
      console.error('Debug test error:', error);
      results.error = {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      };
    }

    setDebugData(results);
    setLoading(false);
  };

  useEffect(() => {
    runDebugTests();
  }, []);

  const formatJson = (obj: any) => {
    return JSON.stringify(obj, null, 2);
  };

  return (
    <Card className="mb-6 border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="text-orange-800 flex items-center gap-2">
          🐛 Payroll Debug Information
          <Badge variant="outline" className="text-xs">
            Remove in production
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={runDebugTests} 
            disabled={loading}
            variant="outline"
            size="sm"
          >
            {loading ? 'Running Tests...' : 'Run Debug Tests'}
          </Button>
        </div>

        {Object.keys(debugData).length > 0 && (
          <div className="space-y-4">
            {/* Periods Test */}
            {debugData.periods && (
              <div className="p-3 bg-white rounded border">
                <h4 className="font-semibold text-sm mb-2">
                  1. Employee Payroll Periods
                  <Badge variant={debugData.periods.success ? "default" : "destructive"} className="ml-2">
                    {debugData.periods.success ? 'Success' : 'Failed'}
                  </Badge>
                </h4>
                <div className="text-xs space-y-1">
                  <div>Count: {debugData.periods.count}</div>
                  <div>Type: {debugData.periods.dataType}</div>
                  <div>Message: {debugData.periods.message}</div>
                  {debugData.periods.count > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-blue-600">Show periods data</summary>
                      <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-32">
                        {formatJson(debugData.periods.data)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            )}

            {/* All Items Test */}
            {debugData.allItems && (
              <div className="p-3 bg-white rounded border">
                <h4 className="font-semibold text-sm mb-2">
                  2. All Employee Payroll Items
                  <Badge variant={debugData.allItems.success ? "default" : "destructive"} className="ml-2">
                    {debugData.allItems.success ? 'Success' : 'Failed'}
                  </Badge>
                </h4>
                <div className="text-xs space-y-1">
                  <div>Count: {debugData.allItems.count}</div>
                  <div>Type: {debugData.allItems.dataType}</div>
                  <div>Message: {debugData.allItems.message}</div>
                  {debugData.allItems.count > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-blue-600">Show items data</summary>
                      <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-32">
                        {formatJson(debugData.allItems.data)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            )}

            {/* Filtered Items Test */}
            {debugData.filteredItems && (
              <div className="p-3 bg-white rounded border">
                <h4 className="font-semibold text-sm mb-2">
                  3. Filtered Items (Finalized/Paid Only)
                  <Badge variant={debugData.filteredItems.finalizedCount > 0 ? "default" : "destructive"} className="ml-2">
                    {debugData.filteredItems.finalizedCount} items
                  </Badge>
                </h4>
                <div className="text-xs space-y-1">
                  <div>Original: {debugData.filteredItems.originalCount} items</div>
                  <div>Finalized/Paid: {debugData.filteredItems.finalizedCount} items</div>
                  <div className="mt-2">
                    <strong>Status Distribution:</strong>
                    <div className="ml-2">
                      {Object.entries(debugData.filteredItems.statusDistribution).map(([status, count]) => (
                        <div key={status}>{status}: {count as number}</div>
                      ))}
                    </div>
                  </div>
                  {debugData.filteredItems.finalizedCount > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-blue-600">Show finalized items</summary>
                      <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-32">
                        {formatJson(debugData.filteredItems.finalizedItems)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            )}

            {/* Period Items Test */}
            {debugData.periodItems && (
              <div className="p-3 bg-white rounded border">
                <h4 className="font-semibold text-sm mb-2">
                  4. Items for Period {debugData.periodItems.periodId}
                  <Badge variant={debugData.periodItems.success ? "default" : "destructive"} className="ml-2">
                    {debugData.periodItems.success ? 'Success' : 'Failed'}
                  </Badge>
                </h4>
                <div className="text-xs space-y-1">
                  <div>Count: {debugData.periodItems.count}</div>
                  <div>Message: {debugData.periodItems.message}</div>
                </div>
              </div>
            )}

            {/* Error */}
            {debugData.error && (
              <div className="p-3 bg-red-50 rounded border border-red-200">
                <h4 className="font-semibold text-sm mb-2 text-red-800">Error</h4>
                <div className="text-xs text-red-700">
                  <div>{debugData.error.message}</div>
                  {debugData.error.stack && (
                    <details className="mt-2">
                      <summary className="cursor-pointer">Show stack trace</summary>
                      <pre className="mt-2 p-2 bg-red-100 rounded text-xs overflow-auto max-h-32">
                        {debugData.error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            )}

            {/* Recommendations */}
            <div className="p-3 bg-blue-50 rounded border border-blue-200">
              <h4 className="font-semibold text-sm mb-2 text-blue-800">Recommendations</h4>
              <div className="text-xs text-blue-700 space-y-1">
                {debugData.filteredItems?.finalizedCount === 0 && (
                  <div>❌ No finalized items found - Admin needs to finalize payroll items</div>
                )}
                {debugData.allItems?.count === 0 && (
                  <div>❌ No payroll items found - Admin needs to process payroll for this employee</div>
                )}
                {debugData.periods?.count === 0 && (
                  <div>❌ No payroll periods found - Admin needs to create and process payroll periods</div>
                )}
                {debugData.filteredItems?.finalizedCount > 0 && (
                  <div>✅ Finalized items exist - Check frontend filtering logic</div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}