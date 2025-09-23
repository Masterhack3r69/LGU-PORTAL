// utils/helpers.js - General utility functions
const moment = require('moment');

// Date formatting utilities
const formatDate = (date, format = 'YYYY-MM-DD') => {
    if (!date) return null;
    return moment(date).format(format);
};

const formatDateTime = (date, format = 'YYYY-MM-DD HH:mm:ss') => {
    if (!date) return null;
    return moment(date).format(format);
};

const formatDateForDisplay = (date) => {
    if (!date) return 'N/A';
    return moment(date).format('MMM DD, YYYY');
};

const formatDateTimeForDisplay = (date) => {
    if (!date) return 'N/A';
    return moment(date).format('MMM DD, YYYY h:mm A');
};

// Calculate age from birth date
const calculateAge = (birthDate) => {
    if (!birthDate) return null;
    return moment().diff(moment(birthDate), 'years');
};

// Calculate years of service
const calculateYearsOfService = (appointmentDate, separationDate = null) => {
    if (!appointmentDate) return 0;
    const endDate = separationDate ? moment(separationDate) : moment();
    return endDate.diff(moment(appointmentDate), 'years', true);
};

// Calculate working days between dates (excluding weekends)
const calculateWorkingDays = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    
    const start = moment(startDate);
    const end = moment(endDate);
    let workingDays = 0;

    for (let date = start.clone(); date.isSameOrBefore(end); date.add(1, 'day')) {
        if (date.day() !== 0 && date.day() !== 6) { // Not Sunday (0) or Saturday (6)
            workingDays++;
        }
    }

    return workingDays;
};

// Format currency (Philippine Peso)
const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return 'N/A';
    return '₱' + parseFloat(amount).toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};

// Format number with commas
const formatNumber = (number, decimals = 0) => {
    if (number === null || number === undefined) return 'N/A';
    return parseFloat(number).toLocaleString('en-PH', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
};

// Capitalize first letter of each word
const capitalizeWords = (str) => {
    if (!str) return '';
    return str.replace(/\w\S*/g, (txt) => 
        txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
};

// Generate employee number (if not provided)
const generateEmployeeNumber = (appointmentDate, sequence) => {
    const year = moment(appointmentDate).format('YYYY');
    const paddedSequence = sequence.toString().padStart(4, '0');
    return `EMP${year}${paddedSequence}`;
};

// Validate email format
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Validate phone number (Philippine format)
const isValidPhoneNumber = (phone) => {
    const phoneRegex = /^(\+63|0)?9\d{9}$/;
    return phoneRegex.test(phone.replace(/\s|-/g, ''));
};

// Sanitize string for database
const sanitizeString = (str) => {
    if (!str) return str;
    return str.trim().replace(/\s+/g, ' ');
};

// Generate pagination object
const generatePagination = (page, limit, totalRecords) => {
    const currentPage = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 10;
    const totalPages = Math.ceil(totalRecords / pageSize);
    const offset = (currentPage - 1) * pageSize;

    return {
        currentPage,
        pageSize,
        totalPages,
        totalRecords,
        offset,
        hasNext: currentPage < totalPages,
        hasPrevious: currentPage > 1
    };
};

// Get fiscal year from date
const getFiscalYear = (date = new Date()) => {
    const year = moment(date).year();
    const month = moment(date).month() + 1; // moment months are 0-indexed
    
    // Philippine government fiscal year starts in January
    return year;
};



// Generate random password
const generateRandomPassword = (length = 8) => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@$!%*?&';
    let password = '';
    
    // Ensure at least one of each required character type
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
    password += '0123456789'[Math.floor(Math.random() * 10)];
    password += '@$!%*?&'[Math.floor(Math.random() * 7)];
    
    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
        password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
};

// Convert file size to bytes
const parseFileSize = (sizeString) => {
    const units = {
        'B': 1,
        'KB': 1024,
        'MB': 1024 * 1024,
        'GB': 1024 * 1024 * 1024
    };
    
    const match = sizeString.match(/^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB)$/i);
    if (!match) return 0;
    
    const value = parseFloat(match[1]);
    const unit = match[2].toUpperCase();
    
    return Math.floor(value * (units[unit] || 1));
};

// Format file size from bytes
const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    
    const units = ['B', 'KB', 'MB', 'GB'];
    const base = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(base));
    
    return `${(bytes / Math.pow(base, i)).toFixed(1)} ${units[i]}`;
};

// Validate required fields
const validateRequiredFields = (data, requiredFields) => {
    const errors = [];
    
    for (const field of requiredFields) {
        if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
            errors.push(`${field} is required`);
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

// Deep clone object
const deepClone = (obj) => {
    return JSON.parse(JSON.stringify(obj));
};

// Remove sensitive data from object
const removeSensitiveData = (obj, sensitiveFields = ['password', 'password_hash', 'token']) => {
    const cleaned = deepClone(obj);
    
    sensitiveFields.forEach(field => {
        if (cleaned[field]) {
            delete cleaned[field];
        }
    });
    
    return cleaned;
};

// Generate audit trail entry
const generateAuditEntry = (action, tableName, recordId, oldValues, newValues, userId) => {
    return {
        action,
        table_name: tableName,
        record_id: recordId,
        old_values: oldValues ? JSON.stringify(oldValues) : null,
        new_values: newValues ? JSON.stringify(newValues) : null,
        user_id: userId,
        timestamp: new Date()
    };
};

// Status badge helper
const getStatusBadgeClass = (status) => {
    const statusMap = {
        'Active': 'success',
        'Pending': 'warning',
        'Approved': 'success',
        'Rejected': 'danger',
        'Cancelled': 'secondary',
        'Completed': 'success',
        'Draft': 'info',
        'Processing': 'warning'
    };
    
    return statusMap[status] || 'secondary';
};

// Calculate next step increment date
const getNextStepIncrementDate = (appointmentDate, currentStep) => {
    const appointment = moment(appointmentDate);
    const yearsToAdd = currentStep * 3; // Step increment every 3 years
    return appointment.add(yearsToAdd, 'years').format('YYYY-MM-DD');
};

// Calculate daily rate from monthly salary
const calculateDailyRate = (monthlySalary) => {
    if (!monthlySalary || monthlySalary <= 0) return 0;
    // Standard calculation: Monthly salary / 22 working days per month
    return parseFloat((monthlySalary / 22).toFixed(2));
};

// Calculate monthly salary from daily rate
const calculateMonthlySalary = (dailyRate) => {
    if (!dailyRate || dailyRate <= 0) return 0;
    // Standard calculation: Daily rate * 22 working days per month
    return parseFloat((dailyRate * 22).toFixed(2));
};

// Calculate annual salary from daily rate
const calculateAnnualSalaryFromDaily = (dailyRate) => {
    if (!dailyRate || dailyRate <= 0) return 0;
    // 261 working days per year (22 days * 12 months - holidays)
    return parseFloat((dailyRate * 261).toFixed(2));
};

module.exports = {
    // Date utilities
    formatDate,
    formatDateTime,
    formatDateForDisplay,
    formatDateTimeForDisplay,
    calculateAge,
    calculateYearsOfService,
    calculateWorkingDays,
    getFiscalYear,
    
    // Number and currency utilities
    formatCurrency,
    formatNumber,
    
    // String utilities
    capitalizeWords,
    sanitizeString,
    isValidEmail,
    isValidPhoneNumber,
    
    // Employee utilities
    generateEmployeeNumber,
    getNextStepIncrementDate,
    calculateDailyRate,
    calculateMonthlySalary,
    calculateAnnualSalaryFromDaily,
    
    // File utilities
    parseFileSize,
    formatFileSize,
    
    // General utilities
    generatePagination,
    generateRandomPassword,
    validateRequiredFields,
    deepClone,
    removeSensitiveData,
    generateAuditEntry,
    getStatusBadgeClass
};