// models/EmployeePDS.js - Models for PDS-related data
const { executeQuery, findOne } = require('../config/database');

// II. FAMILY BACKGROUND
class FamilyBackground {
    constructor(data = {}) {
        this.id = data.id || null;
        this.employee_id = data.employee_id || null;
        
        // Spouse
        this.spouse_surname = data.spouse_surname || null;
        this.spouse_first_name = data.spouse_first_name || null;
        this.spouse_middle_name = data.spouse_middle_name || null;
        this.spouse_name_extension = data.spouse_name_extension || null;
        this.spouse_occupation = data.spouse_occupation || null;
        this.spouse_employer_name = data.spouse_employer_name || null;
        this.spouse_business_address = data.spouse_business_address || null;
        this.spouse_telephone_no = data.spouse_telephone_no || null;
        
        // Father
        this.father_surname = data.father_surname || null;
        this.father_first_name = data.father_first_name || null;
        this.father_middle_name = data.father_middle_name || null;
        this.father_name_extension = data.father_name_extension || null;
        
        // Mother
        this.mother_maiden_surname = data.mother_maiden_surname || null;
        this.mother_first_name = data.mother_first_name || null;
        this.mother_middle_name = data.mother_middle_name || null;
    }

    async save() {
        if (this.id) {
            return await this.update();
        } else {
            return await this.create();
        }
    }

    async create() {
        const query = `
            INSERT INTO employee_family_background (
                employee_id, spouse_surname, spouse_first_name, spouse_middle_name,
                spouse_name_extension, spouse_occupation, spouse_employer_name,
                spouse_business_address, spouse_telephone_no,
                father_surname, father_first_name, father_middle_name, father_name_extension,
                mother_maiden_surname, mother_first_name, mother_middle_name
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const params = [
            this.employee_id, this.spouse_surname, this.spouse_first_name, this.spouse_middle_name,
            this.spouse_name_extension, this.spouse_occupation, this.spouse_employer_name,
            this.spouse_business_address, this.spouse_telephone_no,
            this.father_surname, this.father_first_name, this.father_middle_name,
            this.father_name_extension, this.mother_maiden_surname, this.mother_first_name,
            this.mother_middle_name
        ];

        const result = await executeQuery(query, params);
        if (result.success) {
            this.id = result.data.insertId;
        }
        return result;
    }

    async update() {
        const query = `
            UPDATE employee_family_background SET
                spouse_surname = ?, spouse_first_name = ?, spouse_middle_name = ?,
                spouse_name_extension = ?, spouse_occupation = ?, spouse_employer_name = ?,
                spouse_business_address = ?, spouse_telephone_no = ?,
                father_surname = ?, father_first_name = ?, father_middle_name = ?,
                father_name_extension = ?, mother_maiden_surname = ?, mother_first_name = ?,
                mother_middle_name = ?
            WHERE id = ?
        `;

        const params = [
            this.spouse_surname, this.spouse_first_name, this.spouse_middle_name,
            this.spouse_name_extension, this.spouse_occupation, this.spouse_employer_name,
            this.spouse_business_address, this.spouse_telephone_no,
            this.father_surname, this.father_first_name, this.father_middle_name,
            this.father_name_extension, this.mother_maiden_surname, this.mother_first_name,
            this.mother_middle_name, this.id
        ];

        return await executeQuery(query, params);
    }

    static async findByEmployeeId(employeeId) {
        const query = 'SELECT * FROM employee_family_background WHERE employee_id = ?';
        const result = await findOne(query, [employeeId]);
        if (result.success && result.data) {
            return { success: true, data: new FamilyBackground(result.data) };
        }
        return result;
    }

    static async deleteByEmployeeId(employeeId) {
        const query = 'DELETE FROM employee_family_background WHERE employee_id = ?';
        return await executeQuery(query, [employeeId]);
    }
}

// Children
class Child {
    constructor(data = {}) {
        this.id = data.id || null;
        this.employee_id = data.employee_id || null;
        this.full_name = data.full_name || null;
        this.birth_date = data.birth_date || null;
    }

    async save() {
        if (this.id) {
            return await this.update();
        } else {
            return await this.create();
        }
    }

    async create() {
        const query = `
            INSERT INTO employee_children (employee_id, full_name, birth_date)
            VALUES (?, ?, ?)
        `;
        const params = [this.employee_id, this.full_name, this.birth_date];
        const result = await executeQuery(query, params);
        if (result.success) {
            this.id = result.data.insertId;
        }
        return result;
    }

    async update() {
        const query = `
            UPDATE employee_children SET full_name = ?, birth_date = ?
            WHERE id = ?
        `;
        const params = [this.full_name, this.birth_date, this.id];
        return await executeQuery(query, params);
    }

    static async findByEmployeeId(employeeId) {
        const query = 'SELECT * FROM employee_children WHERE employee_id = ? ORDER BY birth_date';
        const result = await executeQuery(query, [employeeId]);
        if (result.success) {
            return { success: true, data: result.data.map(row => new Child(row)) };
        }
        return result;
    }

    static async delete(id) {
        const query = 'DELETE FROM employee_children WHERE id = ?';
        return await executeQuery(query, [id]);
    }

    static async deleteByEmployeeId(employeeId) {
        const query = 'DELETE FROM employee_children WHERE employee_id = ?';
        return await executeQuery(query, [employeeId]);
    }
}

// III. EDUCATIONAL BACKGROUND
class Education {
    constructor(data = {}) {
        this.id = data.id || null;
        this.employee_id = data.employee_id || null;
        this.level = data.level || null;
        this.school_name = data.school_name || null;
        this.degree_course = data.degree_course || null;
        this.period_from = data.period_from || null;
        this.period_to = data.period_to || null;
        this.highest_level_units = data.highest_level_units || null;
        this.year_graduated = data.year_graduated || null;
        this.scholarship_honors = data.scholarship_honors || null;
    }

    async save() {
        if (this.id) {
            return await this.update();
        } else {
            return await this.create();
        }
    }

    async create() {
        const query = `
            INSERT INTO employee_education (
                employee_id, level, school_name, degree_course, period_from, period_to,
                highest_level_units, year_graduated, scholarship_honors
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const params = [
            this.employee_id, this.level, this.school_name, this.degree_course,
            this.period_from, this.period_to, this.highest_level_units,
            this.year_graduated, this.scholarship_honors
        ];
        const result = await executeQuery(query, params);
        if (result.success) {
            this.id = result.data.insertId;
        }
        return result;
    }

    async update() {
        const query = `
            UPDATE employee_education SET
                level = ?, school_name = ?, degree_course = ?, period_from = ?, period_to = ?,
                highest_level_units = ?, year_graduated = ?, scholarship_honors = ?
            WHERE id = ?
        `;
        const params = [
            this.level, this.school_name, this.degree_course, this.period_from,
            this.period_to, this.highest_level_units, this.year_graduated,
            this.scholarship_honors, this.id
        ];
        return await executeQuery(query, params);
    }

    static async findByEmployeeId(employeeId) {
        const query = `
            SELECT * FROM employee_education 
            WHERE employee_id = ? 
            ORDER BY FIELD(level, 'ELEMENTARY', 'SECONDARY', 'VOCATIONAL', 'COLLEGE', 'GRADUATE_STUDIES')
        `;
        const result = await executeQuery(query, [employeeId]);
        if (result.success) {
            return { success: true, data: result.data.map(row => new Education(row)) };
        }
        return result;
    }

    static async delete(id) {
        const query = 'DELETE FROM employee_education WHERE id = ?';
        return await executeQuery(query, [id]);
    }

    static async deleteByEmployeeId(employeeId) {
        const query = 'DELETE FROM employee_education WHERE employee_id = ?';
        return await executeQuery(query, [employeeId]);
    }
}

// V. WORK EXPERIENCE
class WorkExperience {
    constructor(data = {}) {
        this.id = data.id || null;
        this.employee_id = data.employee_id || null;
        this.date_from = data.date_from || null;
        this.date_to = data.date_to || null;
        this.position_title = data.position_title || null;
        this.department_agency = data.department_agency || null;
        this.monthly_salary = data.monthly_salary || null;
        this.salary_grade = data.salary_grade || null;
        this.status_of_appointment = data.status_of_appointment || null;
        this.is_government_service = data.is_government_service || false;
    }

    async save() {
        if (this.id) {
            return await this.update();
        } else {
            return await this.create();
        }
    }

    async create() {
        const query = `
            INSERT INTO employee_work_experience (
                employee_id, date_from, date_to, position_title, department_agency,
                monthly_salary, salary_grade, status_of_appointment, is_government_service
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const params = [
            this.employee_id, this.date_from, this.date_to, this.position_title,
            this.department_agency, this.monthly_salary, this.salary_grade,
            this.status_of_appointment, this.is_government_service
        ];
        const result = await executeQuery(query, params);
        if (result.success) {
            this.id = result.data.insertId;
        }
        return result;
    }

    async update() {
        const query = `
            UPDATE employee_work_experience SET
                date_from = ?, date_to = ?, position_title = ?, department_agency = ?,
                monthly_salary = ?, salary_grade = ?, status_of_appointment = ?,
                is_government_service = ?
            WHERE id = ?
        `;
        const params = [
            this.date_from, this.date_to, this.position_title, this.department_agency,
            this.monthly_salary, this.salary_grade, this.status_of_appointment,
            this.is_government_service, this.id
        ];
        return await executeQuery(query, params);
    }

    static async findByEmployeeId(employeeId) {
        const query = `
            SELECT * FROM employee_work_experience 
            WHERE employee_id = ? 
            ORDER BY date_from DESC
        `;
        const result = await executeQuery(query, [employeeId]);
        if (result.success) {
            return { success: true, data: result.data.map(row => new WorkExperience(row)) };
        }
        return result;
    }

    static async delete(id) {
        const query = 'DELETE FROM employee_work_experience WHERE id = ?';
        return await executeQuery(query, [id]);
    }

    static async deleteByEmployeeId(employeeId) {
        const query = 'DELETE FROM employee_work_experience WHERE employee_id = ?';
        return await executeQuery(query, [employeeId]);
    }
}

// VI. VOLUNTARY WORK
class VoluntaryWork {
    constructor(data = {}) {
        this.id = data.id || null;
        this.employee_id = data.employee_id || null;
        this.organization_name = data.organization_name || null;
        this.organization_address = data.organization_address || null;
        this.date_from = data.date_from || null;
        this.date_to = data.date_to || null;
        this.number_of_hours = data.number_of_hours || null;
        this.position_nature = data.position_nature || null;
    }

    async save() {
        if (this.id) {
            return await this.update();
        } else {
            return await this.create();
        }
    }

    async create() {
        const query = `
            INSERT INTO employee_voluntary_work (
                employee_id, organization_name, organization_address, date_from, date_to,
                number_of_hours, position_nature
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const params = [
            this.employee_id, this.organization_name, this.organization_address,
            this.date_from, this.date_to, this.number_of_hours, this.position_nature
        ];
        const result = await executeQuery(query, params);
        if (result.success) {
            this.id = result.data.insertId;
        }
        return result;
    }

    async update() {
        const query = `
            UPDATE employee_voluntary_work SET
                organization_name = ?, organization_address = ?, date_from = ?, date_to = ?,
                number_of_hours = ?, position_nature = ?
            WHERE id = ?
        `;
        const params = [
            this.organization_name, this.organization_address, this.date_from,
            this.date_to, this.number_of_hours, this.position_nature, this.id
        ];
        return await executeQuery(query, params);
    }

    static async findByEmployeeId(employeeId) {
        const query = `
            SELECT * FROM employee_voluntary_work 
            WHERE employee_id = ? 
            ORDER BY date_from DESC
        `;
        const result = await executeQuery(query, [employeeId]);
        if (result.success) {
            return { success: true, data: result.data.map(row => new VoluntaryWork(row)) };
        }
        return result;
    }

    static async delete(id) {
        const query = 'DELETE FROM employee_voluntary_work WHERE id = ?';
        return await executeQuery(query, [id]);
    }

    static async deleteByEmployeeId(employeeId) {
        const query = 'DELETE FROM employee_voluntary_work WHERE employee_id = ?';
        return await executeQuery(query, [employeeId]);
    }
}

// VIII. OTHER INFORMATION
class OtherInfo {
    constructor(data = {}) {
        this.id = data.id || null;
        this.employee_id = data.employee_id || null;
        this.special_skills = data.special_skills || null;
        this.non_academic_distinctions = data.non_academic_distinctions || null;
        this.membership_associations = data.membership_associations || null;
    }

    async save() {
        if (this.id) {
            return await this.update();
        } else {
            return await this.create();
        }
    }

    async create() {
        const query = `
            INSERT INTO employee_other_info (
                employee_id, special_skills, non_academic_distinctions, membership_associations
            ) VALUES (?, ?, ?, ?)
        `;
        const params = [
            this.employee_id, this.special_skills, this.non_academic_distinctions,
            this.membership_associations
        ];
        const result = await executeQuery(query, params);
        if (result.success) {
            this.id = result.data.insertId;
        }
        return result;
    }

    async update() {
        const query = `
            UPDATE employee_other_info SET
                special_skills = ?, non_academic_distinctions = ?, membership_associations = ?
            WHERE id = ?
        `;
        const params = [
            this.special_skills, this.non_academic_distinctions,
            this.membership_associations, this.id
        ];
        return await executeQuery(query, params);
    }

    static async findByEmployeeId(employeeId) {
        const query = 'SELECT * FROM employee_other_info WHERE employee_id = ?';
        const result = await findOne(query, [employeeId]);
        if (result.success && result.data) {
            return { success: true, data: new OtherInfo(result.data) };
        }
        return result;
    }

    static async deleteByEmployeeId(employeeId) {
        const query = 'DELETE FROM employee_other_info WHERE employee_id = ?';
        return await executeQuery(query, [employeeId]);
    }
}

module.exports = {
    FamilyBackground,
    Child,
    Education,
    WorkExperience,
    VoluntaryWork,
    OtherInfo
};
