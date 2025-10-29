// controllers/pdsController.js - PDS data management controller
const { FamilyBackground, Child, Education, WorkExperience, VoluntaryWork, OtherInfo } = require('../models/EmployeePDS');
const { asyncHandler, ValidationError, NotFoundError } = require('../middleware/errorHandler');

// Get complete PDS data for an employee
const getEmployeePDS = asyncHandler(async (req, res) => {
    const { employeeId } = req.params;
    
    const [familyBg, children, education, workExp, voluntaryWork, otherInfo] = await Promise.all([
        FamilyBackground.findByEmployeeId(employeeId),
        Child.findByEmployeeId(employeeId),
        Education.findByEmployeeId(employeeId),
        WorkExperience.findByEmployeeId(employeeId),
        VoluntaryWork.findByEmployeeId(employeeId),
        OtherInfo.findByEmployeeId(employeeId)
    ]);
    
    res.json({
        success: true,
        data: {
            familyBackground: familyBg.data || null,
            children: children.data || [],
            education: education.data || [],
            workExperience: workExp.data || [],
            voluntaryWork: voluntaryWork.data || [],
            otherInfo: otherInfo.data || null
        }
    });
});

// Save/Update Family Background
const saveFamilyBackground = asyncHandler(async (req, res) => {
    const { employeeId } = req.params;
    const familyBg = new FamilyBackground({ ...req.body, employee_id: employeeId });
    
    const result = await familyBg.save();
    if (!result.success) {
        throw new Error(result.error || 'Failed to save family background');
    }
    
    res.json({ success: true, data: familyBg, message: 'Family background saved successfully' });
});

// Save/Update Children
const saveChildren = asyncHandler(async (req, res) => {
    const { employeeId } = req.params;
    const { children } = req.body;
    
    if (!Array.isArray(children)) {
        throw new ValidationError('Children must be an array');
    }
    
    // Delete existing children and insert new ones
    await Child.deleteByEmployeeId(employeeId);
    
    const savedChildren = [];
    for (const childData of children) {
        const child = new Child({ ...childData, employee_id: employeeId });
        const result = await child.save();
        if (result.success) {
            savedChildren.push(child);
        }
    }
    
    res.json({ success: true, data: savedChildren, message: 'Children saved successfully' });
});

// Save/Update Education
const saveEducation = asyncHandler(async (req, res) => {
    const { employeeId } = req.params;
    const { education } = req.body;
    
    if (!Array.isArray(education)) {
        throw new ValidationError('Education must be an array');
    }
    
    await Education.deleteByEmployeeId(employeeId);
    
    const savedEducation = [];
    for (const eduData of education) {
        const edu = new Education({ ...eduData, employee_id: employeeId });
        const result = await edu.save();
        if (result.success) {
            savedEducation.push(edu);
        }
    }
    
    res.json({ success: true, data: savedEducation, message: 'Education saved successfully' });
});

// Save/Update Work Experience
const saveWorkExperience = asyncHandler(async (req, res) => {
    const { employeeId } = req.params;
    const { workExperience } = req.body;
    
    if (!Array.isArray(workExperience)) {
        throw new ValidationError('Work experience must be an array');
    }
    
    await WorkExperience.deleteByEmployeeId(employeeId);
    
    const savedWorkExp = [];
    for (const workData of workExperience) {
        const work = new WorkExperience({ ...workData, employee_id: employeeId });
        const result = await work.save();
        if (result.success) {
            savedWorkExp.push(work);
        }
    }
    
    res.json({ success: true, data: savedWorkExp, message: 'Work experience saved successfully' });
});

// Save/Update Voluntary Work
const saveVoluntaryWork = asyncHandler(async (req, res) => {
    const { employeeId } = req.params;
    const { voluntaryWork } = req.body;
    
    if (!Array.isArray(voluntaryWork)) {
        throw new ValidationError('Voluntary work must be an array');
    }
    
    await VoluntaryWork.deleteByEmployeeId(employeeId);
    
    const savedVoluntaryWork = [];
    for (const volData of voluntaryWork) {
        const vol = new VoluntaryWork({ ...volData, employee_id: employeeId });
        const result = await vol.save();
        if (result.success) {
            savedVoluntaryWork.push(vol);
        }
    }
    
    res.json({ success: true, data: savedVoluntaryWork, message: 'Voluntary work saved successfully' });
});

// Save/Update Other Info
const saveOtherInfo = asyncHandler(async (req, res) => {
    const { employeeId } = req.params;
    const otherInfo = new OtherInfo({ ...req.body, employee_id: employeeId });
    
    const result = await otherInfo.save();
    if (!result.success) {
        throw new Error(result.error || 'Failed to save other information');
    }
    
    res.json({ success: true, data: otherInfo, message: 'Other information saved successfully' });
});

module.exports = {
    getEmployeePDS,
    saveFamilyBackground,
    saveChildren,
    saveEducation,
    saveWorkExperience,
    saveVoluntaryWork,
    saveOtherInfo
};
