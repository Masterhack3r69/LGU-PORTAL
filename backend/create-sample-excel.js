// Create sample Excel file for import testing
const XLSX = require('xlsx');
const path = require('path');

function createSampleExcelFile() {
    console.log('📊 Creating sample Excel file for employee import...');
    
    // Create a new workbook
    const workbook = XLSX.utils.book_new();
    
    // Define headers exactly as expected by the import logic
    const headers = [
        'employee_number',
        'first_name', 
        'middle_name',
        'last_name',
        'suffix',
        'sex',
        'birth_date',
        'birth_place',
        'civil_status',
        'contact_number',
        'email_address',
        'current_address',
        'permanent_address',
        'tin',
        'gsis_number',
        'pagibig_number',
        'philhealth_number',
        'sss_number',
        'appointment_date',
        'plantilla_position',
        'plantilla_number',
        'salary_grade',
        'step_increment',
        'current_monthly_salary',
        'current_daily_rate',
        'employment_status'
    ];
    
    // Create sample employee data
    const sampleEmployees = [
        [
            'EMP001',
            'Juan',
            'Dela',
            'Cruz',
            'Jr.',
            'Male',
            '1990-01-15',
            'Manila, Philippines',
            'Single',
            '09123456789',
            'juan.cruz@company.com',
            '123 Main St, Quezon City',
            '456 Home Ave, Manila',
            '123-456-789-000',
            '1234567890',
            '1234567890123',
            '12-345678901-2',
            '03-4567890-1',
            '2023-01-15',
            'Administrative Assistant I',
            'PLANTILLA-001',
            '11',
            '1',
            '22000.00',
            '1000.00',
            'Active'
        ],
        [
            'EMP002',
            'Maria',
            'Santos',
            'Garcia',
            '',
            'Female',
            '1985-05-20',
            'Cebu City, Philippines',
            'Married',
            '09987654321',
            'maria.garcia@company.com',
            '789 Oak St, Makati City',
            '321 Pine St, Cebu City',
            '987-654-321-000',
            '0987654321',
            '9876543210987',
            '98-765432109-8',
            '07-6543210-9',
            '2023-02-01',
            'Administrative Assistant II',
            'PLANTILLA-002',
            '12',
            '2',
            '24000.00',
            '1100.00',
            'Active'
        ],
        [
            'EMP003',
            'Roberto',
            'Miguel',
            'Fernandez',
            'Sr.',
            'Male',
            '1978-12-10',
            'Davao City, Philippines',
            'Married',
            '09555123456',
            'roberto.fernandez@company.com',
            '456 Elm St, Pasig City',
            '789 Maple Ave, Davao City',
            '555-123-456-000',
            '5551234567',
            '5551234567890',
            '55-512345678-9',
            '05-5123456-7',
            '2022-06-15',
            'Senior Administrative Assistant',
            'PLANTILLA-003',
            '13',
            '3',
            '26000.00',
            '1200.00',
            'Active'
        ],
        [
            'EMP004',
            'Ana',
            'Rose',
            'Mendoza',
            '',
            'Female',
            '1992-08-25',
            'Iloilo City, Philippines',
            'Single',
            '09777888999',
            'ana.mendoza@company.com',
            '321 Cedar St, Taguig City',
            '654 Birch Ave, Iloilo City',
            '777-888-999-000',
            '7778889990',
            '7778889990123',
            '77-788899901-2',
            '07-7888999-0',
            '2023-03-01',
            'Administrative Officer I',
            'PLANTILLA-004',
            '14',
            '1',
            '28000.00',
            '1300.00',
            'Active'
        ],
        [
            'EMP005',
            'Carlos',
            'Antonio',
            'Reyes',
            'III',
            'Male',
            '1988-11-30',
            'Baguio City, Philippines',
            'Single',
            '09444555666',
            'carlos.reyes@company.com',
            '987 Willow St, Muntinlupa City',
            '123 Spruce Ave, Baguio City',
            '444-555-666-000',
            '4445556660',
            '4445556660987',
            '44-455566609-8',
            '04-4555666-0',
            '2022-09-15',
            'Administrative Officer II',
            'PLANTILLA-005',
            '15',
            '2',
            '30000.00',
            '1400.00',
            'Active'
        ]
    ];
    
    // Create worksheet data (headers + sample data)
    const wsData = [headers, ...sampleEmployees];
    
    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(wsData);
    
    // Set column widths for better readability
    const colWidths = headers.map(() => ({ wch: 20 }));
    worksheet['!cols'] = colWidths;
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Employee Data');
    
    // Create instructions sheet
    const instructions = [
        ['EMPLOYEE IMPORT TEMPLATE - INSTRUCTIONS'],
        [''],
        ['REQUIRED FIELDS (Must be filled for all employees):'],
        ['• employee_number - Unique identifier (e.g., EMP001, EMP002)'],
        ['• first_name - Employee\'s first name'],
        ['• last_name - Employee\'s last name'],
        ['• sex - Male or Female (or M/F)'],
        ['• birth_date - Date in YYYY-MM-DD format or Excel date'],
        ['• appointment_date - Date in YYYY-MM-DD format or Excel date'],
        [''],
        ['OPTIONAL FIELDS:'],
        ['• middle_name - Employee\'s middle name'],
        ['• suffix - Jr., Sr., III, etc.'],
        ['• birth_place - Place of birth'],
        ['• civil_status - Single, Married, Divorced, Widowed'],
        ['• contact_number - Philippine mobile number format'],
        ['• email_address - Valid email (required for user account creation)'],
        ['• current_address - Current residential address'],
        ['• permanent_address - Permanent address'],
        ['• tin - Tax Identification Number'],
        ['• gsis_number - GSIS number'],
        ['• pagibig_number - Pag-IBIG number'],
        ['• philhealth_number - PhilHealth number'],
        ['• sss_number - SSS number'],
        ['• plantilla_position - Job position/title'],
        ['• plantilla_number - Plantilla item number'],
        ['• salary_grade - Salary grade (numeric)'],
        ['• step_increment - Step increment (numeric, default: 1)'],
        ['• current_monthly_salary - Monthly salary amount'],
        ['• current_daily_rate - Daily rate amount'],
        ['• employment_status - Active, Resigned, Retired, Terminated (default: Active)'],
        [''],
        ['IMPORTANT NOTES:'],
        ['• Employee numbers must be unique across the system'],
        ['• Email addresses must be unique (if provided)'],
        ['• Dates can be in Excel date format or YYYY-MM-DD text format'],
        ['• Sex field accepts: Male, Female, M, F (case insensitive)'],
        ['• All employees will receive temporary passwords for first login'],
        ['• Invalid rows can be skipped during import process'],
        ['• Leave balances will be automatically initialized'],
        [''],
        ['COLUMN MAPPING ALTERNATIVES:'],
        ['The system can recognize these alternative column names:'],
        ['• employee_number: emp_no, employee no, empno'],
        ['• first_name: firstname, first name, fname'],
        ['• last_name: lastname, last name, lname, surname'],
        ['• birth_date: birthdate, birth date, date_of_birth, dob'],
        ['• appointment_date: appointmentdate, appointment date, date_appointed'],
        ['• contact_number: contactnumber, contact number, phone, mobile'],
        ['• email_address: email, email address'],
        ['• current_address: currentaddress, current address, address'],
        ['• salary_grade: salarygrade, salary grade, sg'],
        ['• step_increment: stepincrement, step increment, step'],
        ['• current_monthly_salary: monthly_salary, salary, basic_salary'],
        ['• employment_status: employmentstatus, employment status, status'],
        [''],
        ['PASSWORD GENERATION OPTIONS:'],
        ['1. Employee Number - Uses employee number as password'],
        ['2. Birth Date - Uses birth date (DDMMYYYY) as password'],
        ['3. Random - Generates secure random passwords'],
        ['4. Custom Pattern - Employee number + birth day/month (Recommended)'],
        ['   Example: EMP001 born March 15 = EMP0011503'],
        [''],
        ['SAMPLE DATA:'],
        ['The "Employee Data" sheet contains 5 sample employees that you can'],
        ['use as a reference or modify for your actual import.']
    ];
    
    const instructionsWs = XLSX.utils.aoa_to_sheet(instructions);
    instructionsWs['!cols'] = [{ wch: 70 }];
    XLSX.utils.book_append_sheet(workbook, instructionsWs, 'Instructions');
    
    // Create field mapping reference sheet
    const fieldMapping = [
        ['FIELD MAPPING REFERENCE'],
        [''],
        ['Database Field', 'Excel Column Alternatives'],
        ['employee_number', 'employee_number, emp_no, employee no, empno'],
        ['first_name', 'first_name, firstname, first name, fname'],
        ['middle_name', 'middle_name, middlename, middle name, mname'],
        ['last_name', 'last_name, lastname, last name, lname, surname'],
        ['suffix', 'suffix, name_suffix'],
        ['sex', 'sex, gender'],
        ['birth_date', 'birth_date, birthdate, birth date, date_of_birth, dob'],
        ['birth_place', 'birth_place, birthplace, birth place, place_of_birth'],
        ['civil_status', 'civil_status, civilstatus, civil status, marital_status'],
        ['contact_number', 'contact_number, contactnumber, contact number, phone, mobile'],
        ['email_address', 'email_address, email, email address'],
        ['current_address', 'current_address, currentaddress, current address, address'],
        ['permanent_address', 'permanent_address, permanentaddress, permanent address'],
        ['tin', 'tin, tax_identification_number'],
        ['gsis_number', 'gsis_number, gsisnumber, gsis number, gsis'],
        ['pagibig_number', 'pagibig_number, pagibibnumber, pagibig number, pagibig'],
        ['philhealth_number', 'philhealth_number, philhealthnumber, philhealth number, philhealth'],
        ['sss_number', 'sss_number, sssnumber, sss number, sss'],
        ['appointment_date', 'appointment_date, appointmentdate, appointment date, date_appointed'],
        ['plantilla_position', 'plantilla_position, position, job_title, designation'],
        ['plantilla_number', 'plantilla_number, plantillanumber, plantilla number'],
        ['salary_grade', 'salary_grade, salarygrade, salary grade, sg'],
        ['step_increment', 'step_increment, stepincrement, step increment, step'],
        ['current_monthly_salary', 'current_monthly_salary, monthly_salary, salary, basic_salary'],
        ['current_daily_rate', 'current_daily_rate, daily_rate, daily rate'],
        ['employment_status', 'employment_status, employmentstatus, employment status, status']
    ];
    
    const mappingWs = XLSX.utils.aoa_to_sheet(fieldMapping);
    mappingWs['!cols'] = [{ wch: 25 }, { wch: 60 }];
    XLSX.utils.book_append_sheet(workbook, mappingWs, 'Field Mapping');
    
    // Save the file
    const fileName = 'employee_import_sample.xlsx';
    const filePath = path.join(__dirname, fileName);
    
    XLSX.writeFile(workbook, filePath);
    
    console.log('✅ Sample Excel file created successfully!');
    console.log('📁 File location:', filePath);
    console.log('📊 Contains:');
    console.log('   • Employee Data sheet with 5 sample employees');
    console.log('   • Instructions sheet with detailed guidance');
    console.log('   • Field Mapping sheet with column alternatives');
    console.log('');
    console.log('🔍 File details:');
    console.log('   • Headers:', headers.length, 'columns');
    console.log('   • Sample data:', sampleEmployees.length, 'employees');
    console.log('   • All required fields included');
    console.log('   • Ready for import testing');
    
    return filePath;
}

// Create the sample file
if (require.main === module) {
    createSampleExcelFile();
}

module.exports = { createSampleExcelFile };