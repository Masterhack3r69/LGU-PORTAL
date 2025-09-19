// models/payroll/index.js - Unified payroll models export
const PayrollPeriod = require('./PayrollPeriod');
const AllowanceType = require('./AllowanceType');
const DeductionType = require('./DeductionType');
const PayrollItem = require('./PayrollItem');
const { EmployeeAllowanceOverride, EmployeeDeductionOverride } = require('./EmployeeOverride');

module.exports = {
    PayrollPeriod,
    AllowanceType,
    DeductionType,
    PayrollItem,
    EmployeeAllowanceOverride,
    EmployeeDeductionOverride
};