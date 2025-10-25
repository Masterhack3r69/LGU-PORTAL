// models/ExamCertificate.js - Exam Certificate model
const { executeQuery, findOne } = require('../config/database');

class ExamCertificate {
    constructor(data = {}) {
        this.id = data.id || null;
        this.employee_id = data.employee_id || null;
        this.exam_name = data.exam_name || null;
        this.exam_type = data.exam_type || null;
        this.rating = data.rating || null;
        this.date_taken = data.date_taken || null;
        this.place_of_examination = data.place_of_examination || null;
        this.license_number = data.license_number || null;
        this.validity_date = data.validity_date || null;
        this.created_at = data.created_at || null;
        this.updated_at = data.updated_at || null;
    }

    // Validate exam certificate data
    validate() {
        const errors = [];

        if (!this.employee_id) {
            errors.push('Employee ID is required');
        }

        if (!this.exam_name || this.exam_name.trim().length === 0) {
            errors.push('Exam name is required');
        }

        if (this.exam_name && this.exam_name.length > 255) {
            errors.push('Exam name must not exceed 255 characters');
        }

        if (this.exam_type && this.exam_type.length > 100) {
            errors.push('Exam type must not exceed 100 characters');
        }

        if (this.rating && (isNaN(this.rating) || this.rating < 0 || this.rating > 100)) {
            errors.push('Rating must be a number between 0 and 100');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Save exam certificate (create or update)
    async save() {
        const validation = this.validate();
        if (!validation.isValid) {
            return {
                success: false,
                error: 'Validation failed',
                details: validation.errors
            };
        }

        try {
            if (this.id) {
                return await this.update();
            } else {
                return await this.create();
            }
        } catch (error) {
            return {
                success: false,
                error: 'Failed to save exam certificate',
                details: error.message
            };
        }
    }

    // Create new exam certificate
    async create() {
        const query = `
            INSERT INTO exam_certificates (
                employee_id, exam_name, exam_type, rating, date_taken,
                place_of_examination, license_number, validity_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const params = [
            this.employee_id,
            this.exam_name,
            this.exam_type,
            this.rating,
            this.date_taken,
            this.place_of_examination,
            this.license_number,
            this.validity_date
        ];

        const result = await executeQuery(query, params);
        if (result.success) {
            this.id = result.data.insertId;
            return {
                success: true,
                data: this,
                message: 'Exam certificate created successfully'
            };
        }

        return result;
    }

    // Update existing exam certificate
    async update() {
        const query = `
            UPDATE exam_certificates SET
                employee_id = ?,
                exam_name = ?,
                exam_type = ?,
                rating = ?,
                date_taken = ?,
                place_of_examination = ?,
                license_number = ?,
                validity_date = ?
            WHERE id = ?
        `;

        const params = [
            this.employee_id,
            this.exam_name,
            this.exam_type,
            this.rating,
            this.date_taken,
            this.place_of_examination,
            this.license_number,
            this.validity_date,
            this.id
        ];

        const result = await executeQuery(query, params);
        if (result.success) {
            return {
                success: true,
                data: this,
                message: 'Exam certificate updated successfully'
            };
        }

        return result;
    }

    // Static methods

    // Find exam certificate by ID
    static async findById(id) {
        const query = 'SELECT * FROM exam_certificates WHERE id = ?';
        const result = await findOne(query, [id]);
        
        if (result.success && result.data) {
            return {
                success: true,
                data: new ExamCertificate(result.data)
            };
        }
        
        return result;
    }

    // Find all exam certificates for an employee
    static async findByEmployeeId(employeeId) {
        const query = `
            SELECT * FROM exam_certificates 
            WHERE employee_id = ?
            ORDER BY date_taken DESC
        `;
        
        const result = await executeQuery(query, [employeeId]);
        
        if (result.success) {
            const certificates = result.data.map(row => new ExamCertificate(row));
            return {
                success: true,
                data: certificates
            };
        }
        
        return result;
    }

    // Delete exam certificate
    static async delete(id) {
        const query = 'DELETE FROM exam_certificates WHERE id = ?';
        const result = await executeQuery(query, [id]);
        
        if (result.success && result.data.affectedRows === 0) {
            return {
                success: false,
                error: 'Exam certificate not found'
            };
        }
        
        return result;
    }

    // Delete all exam certificates for an employee
    static async deleteByEmployeeId(employeeId) {
        const query = 'DELETE FROM exam_certificates WHERE employee_id = ?';
        return await executeQuery(query, [employeeId]);
    }
}

module.exports = ExamCertificate;
