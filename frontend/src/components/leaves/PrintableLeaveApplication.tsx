import React from 'react';
import type { LeaveApplication } from '@/types/leave';

interface PrintableLeaveApplicationProps {
  leave: LeaveApplication;
}

const PrintableLeaveApplication: React.FC<PrintableLeaveApplicationProps> = ({ leave }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="print-content hidden">
      <style>{`
        @media print {
          .print-content {
            display: block !important;
            padding: 40px;
            font-family: Arial, sans-serif;
            color: #000;
            background: white;
          }
          .print-header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #000;
            padding-bottom: 20px;
          }
          .print-title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .print-section {
            margin-bottom: 25px;
          }
          .print-label {
            font-weight: bold;
            display: inline-block;
            width: 150px;
          }
          .print-value {
            display: inline-block;
          }
          .print-row {
            margin-bottom: 12px;
            line-height: 1.6;
          }
          .print-status {
            display: inline-block;
            padding: 4px 12px;
            border: 2px solid #000;
            border-radius: 4px;
            font-weight: bold;
          }
          .print-footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #ccc;
          }
          .signature-line {
            margin-top: 40px;
            border-top: 1px solid #000;
            width: 250px;
            padding-top: 5px;
          }
        }
      `}</style>
      
      <div className="print-header">
        <div className="print-title">LEAVE APPLICATION FORM</div>
        <div>Application ID: #{leave.id}</div>
      </div>

      <div className="print-section">
        <h3 style={{ fontSize: '18px', marginBottom: '15px', fontWeight: 'bold' }}>Employee Information</h3>
        <div className="print-row">
          <span className="print-label">Employee Name:</span>
          <span className="print-value">{leave.employee_name}</span>
        </div>
        <div className="print-row">
          <span className="print-label">Employee Number:</span>
          <span className="print-value">{leave.employee_number}</span>
        </div>
      </div>

      <div className="print-section">
        <h3 style={{ fontSize: '18px', marginBottom: '15px', fontWeight: 'bold' }}>Leave Details</h3>
        <div className="print-row">
          <span className="print-label">Leave Type:</span>
          <span className="print-value">{leave.leave_type_name}</span>
        </div>
        <div className="print-row">
          <span className="print-label">Start Date:</span>
          <span className="print-value">{formatDate(leave.start_date)}</span>
        </div>
        <div className="print-row">
          <span className="print-label">End Date:</span>
          <span className="print-value">{formatDate(leave.end_date)}</span>
        </div>
        <div className="print-row">
          <span className="print-label">Duration:</span>
          <span className="print-value">{leave.days_requested} day(s)</span>
        </div>
        <div className="print-row">
          <span className="print-label">Status:</span>
          <span className="print-status">{leave.status}</span>
        </div>
      </div>

      {leave.reason && (
        <div className="print-section">
          <h3 style={{ fontSize: '18px', marginBottom: '15px', fontWeight: 'bold' }}>Reason for Leave</h3>
          <div style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}>
            {leave.reason}
          </div>
        </div>
      )}

      <div className="print-section">
        <h3 style={{ fontSize: '18px', marginBottom: '15px', fontWeight: 'bold' }}>Application Timeline</h3>
        <div className="print-row">
          <span className="print-label">Applied On:</span>
          <span className="print-value">{formatDate(leave.applied_at)}</span>
        </div>
        {leave.reviewed_at && (
          <div className="print-row">
            <span className="print-label">Reviewed On:</span>
            <span className="print-value">{formatDate(leave.reviewed_at)}</span>
          </div>
        )}
        {leave.reviewed_by_name && (
          <div className="print-row">
            <span className="print-label">Reviewed By:</span>
            <span className="print-value">{leave.reviewed_by_name}</span>
          </div>
        )}
      </div>

      {leave.review_notes && (
        <div className="print-section">
          <h3 style={{ fontSize: '18px', marginBottom: '15px', fontWeight: 'bold' }}>Review Notes</h3>
          <div style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}>
            {leave.review_notes}
          </div>
        </div>
      )}

      <div className="print-footer">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '60px' }}>
          <div>
            <div className="signature-line">Employee Signature</div>
            <div style={{ marginTop: '5px', fontSize: '12px' }}>Date: _________________</div>
          </div>
          <div>
            <div className="signature-line">Supervisor Signature</div>
            <div style={{ marginTop: '5px', fontSize: '12px' }}>Date: _________________</div>
          </div>
        </div>
        <div style={{ marginTop: '40px', fontSize: '12px', textAlign: 'center', color: '#666' }}>
          This is a computer-generated document. Printed on {new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>
    </div>
  );
};

export default PrintableLeaveApplication;
