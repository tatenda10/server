const db = require('../../db/db'); // Adjust this to your actual db module path


const calculateGrade = (averageMark, form) => {
    console.log(averageMark)
    if (form >= 1 && form <= 4) { // O Level
        if (averageMark >= 70) return 'A';
        if (averageMark >= 60) return 'B';
        if (averageMark >= 50) return 'C';
        if (averageMark >= 45) return 'D';
        if (averageMark >= 40) return 'E';
        return 'U';
    } else if (form >= 5 && form <= 6) { // A Level
        if (averageMark >= 70) return 'A';
        if (averageMark >= 60) return 'B';
        if (averageMark >= 50) return 'C';
        if (averageMark >= 45) return 'D';
        if (averageMark >= 40) return 'E';
        if (averageMark >= 35) return 'O';
        return 'F';
    }
};
// Function to add paper marks and calculate the total for a subject result
const addPaperMarksAndCalculateTotal = async (subjectResultData, paperMarks) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const { StudentRegNumber, SubjectName, TermID, Year, ClassID, SubjectClassID, Comment, form } = subjectResultData;

        // Insert the subject result
        const subjectResultQuery = `
            INSERT INTO subjectresults (StudentRegNumber, SubjectName, TermID, Year, ClassID, SubjectClassID, Comment) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const subjectResultValues = [StudentRegNumber, SubjectName, TermID, Year, ClassID, SubjectClassID, Comment];
        const [subjectResult] = await connection.query(subjectResultQuery, subjectResultValues);
        const ResultID = subjectResult.insertId;

        // Insert paper marks and calculate the total
        let totalMark = 0;
        for (const paper of paperMarks) {
            const { PaperName, Mark } = paper;
            totalMark += Mark;

            const paperMarkQuery = `
                INSERT INTO papermarks (ResultID, PaperName, Mark) 
                VALUES (?, ?, ?)
            `;
            const paperMarkValues = [ResultID, PaperName, Mark];
            await connection.query(paperMarkQuery, paperMarkValues);
        }

        // Update the subject result with the total mark
        const updateTotalMarkQuery = `
            UPDATE subjectresults 
            SET TotalMark = ? 
            WHERE ResultID = ?
        `;
        await connection.query(updateTotalMarkQuery, [totalMark, ResultID]);

        // Check if grade level result already exists
        const checkGradeLevelResultQuery = `
            SELECT TotalMark FROM gradelevelresults 
            WHERE ClassID = ? AND TermID = ? AND Year = ? AND RegNumber = ? AND form = ?
        `;
        const [existingGradeLevelResult] = await connection.query(checkGradeLevelResultQuery, [ClassID, TermID, Year, StudentRegNumber, form]);

        if (existingGradeLevelResult.length > 0) {
            // Update the existing grade level result
            const newTotalMark = existingGradeLevelResult[0].TotalMark + totalMark;
            const updateGradeLevelResultQuery = `
                UPDATE gradelevelresults 
                SET TotalMark = ? 
                WHERE ClassID = ? AND TermID = ? AND Year = ? AND RegNumber = ? AND form = ?
            `;
            await connection.query(updateGradeLevelResultQuery, [newTotalMark, ClassID, TermID, Year, StudentRegNumber, form]);
        } else {
            // Insert a new grade level result
            const insertGradeLevelResultQuery = `
                INSERT INTO gradelevelresults (ClassID, TermID, Year, TotalMark, RegNumber, form)
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            await connection.query(insertGradeLevelResultQuery, [ClassID, TermID, Year, totalMark, StudentRegNumber, form]);
        }

        await connection.commit();
        return { ResultID, totalMark };
    } catch (err) {
        await connection.rollback();
        console.error('Error adding subject result and calculating total: ', err);
        throw err;
    } finally {
        connection.release();
    }
};

const getAllResultsForSubjectClass = async (subjectClassID, termID, year,form) => {
    try {
        const query = `
            SELECT sr.ResultID, sr.StudentRegNumber, s.Name, s.Surname, sr.SubjectName, sr.TotalMark, sr.Comment, glr.ClassPosition, glr.FormPosition
            FROM subjectresults sr
            JOIN students s ON sr.StudentRegNumber = s.RegNumber
            JOIN gradelevelresults glr ON sr.StudentRegNumber = glr.RegNumber AND sr.ClassID = glr.ClassID AND sr.TermID = glr.TermID AND sr.Year = glr.Year
            WHERE sr.SubjectClassID = ? AND sr.TermID = ? AND sr.Year = ?
            ORDER BY glr.ClassPosition
        `;
        const [results] = await db.query(query, [subjectClassID, termID, year]);

        // Fetch paper marks for each result and calculate the grades
        for (const result of results) {
            const paperMarksQuery = `
                SELECT PaperName, Mark
                FROM papermarks
                WHERE ResultID = ?
            `;
            const [paperMarks] = await db.query(paperMarksQuery, [result.ResultID]);

            // Calculate average mark and grade
            const totalMarks = paperMarks.reduce((sum, paper) => sum + paper.Mark, 0);
            const averageMark = paperMarks.length > 0 ? totalMarks / paperMarks.length : 0;
            result.AverageMark = averageMark;
            result.Grade = calculateGrade(averageMark, form);
            result.PaperMarks = paperMarks;
        }
        console.log(form)
        return results;
    } catch (err) {
        console.error('Error retrieving results for subject class: ', err);
        throw err;
    }
};







// Function to retrieve results and calculate positions
const getResultsAndCalculatePositions = async (ClassID, TermID, Year, form) => {
    try {
        // Retrieve all grade level results for the given class, term, year, and form along with student names
        const gradeLevelResultsQuery = `
            SELECT glr.*, s.Name, s.Surname
            FROM gradelevelresults glr
            JOIN students s ON glr.RegNumber = s.RegNumber
            WHERE glr.ClassID = ? AND glr.TermID = ? AND glr.Year = ? AND glr.form = ?
            ORDER BY glr.TotalMark DESC
        `;
        const [gradeLevelResults] = await db.query(gradeLevelResultsQuery, [ClassID, TermID, Year, form]);

        // Calculate class positions, handling ties
        gradeLevelResults.forEach((result, index, arr) => {
            if (index > 0 && arr[index - 1].TotalMark === result.TotalMark) {
                result.ClassPosition = arr[index - 1].ClassPosition;
            } else {
                result.ClassPosition = index + 1;
            }
        });

        // Retrieve all grade level results for the form, term, and year along with student names
        const formResultsQuery = `
            SELECT glr.*, s.Name, s.Surname
            FROM gradelevelresults glr
            JOIN students s ON glr.RegNumber = s.RegNumber
            WHERE glr.TermID = ? AND glr.Year = ? AND glr.form = ?
            ORDER BY glr.TotalMark DESC
        `;
        const [formResults] = await db.query(formResultsQuery, [TermID, Year, form]);

        // Calculate form positions, handling ties
        formResults.forEach((result, index, arr) => {
            if (index > 0 && arr[index - 1].TotalMark === result.TotalMark) {
                result.FormPosition = arr[index - 1].FormPosition;
            } else {
                result.FormPosition = index + 1;
            }

            // Update the form position in the original gradeLevelResults array
            const gradeResult = gradeLevelResults.find(r => r.RegNumber === result.RegNumber);
            if (gradeResult) {
                gradeResult.FormPosition = result.FormPosition;
            }
        });

        return gradeLevelResults;
    } catch (err) {
        console.error('Error retrieving results and calculating positions: ', err);
        throw err;
    }
};




const getAllSubjectResultsForStudent = async (studentRegNumber, termID, year, classID, form) => {
    try {
        const subjectResultsQuery = `
            SELECT sr.*, pm.PaperName, pm.Mark
            FROM subjectresults sr
            LEFT JOIN papermarks pm ON sr.ResultID = pm.ResultID
            WHERE sr.StudentRegNumber = ? AND sr.TermID = ? AND sr.Year = ?
        `;
        const [subjectResults] = await db.query(subjectResultsQuery, [studentRegNumber, termID, year]);

        // Organize the results to group paper marks under each subject result
        const organizedSubjectResults = subjectResults.reduce((acc, row) => {
            const { ResultID, StudentRegNumber, SubjectName, TermID, Year, ClassID, SubjectClassID, Comment, TotalMark, PaperName, Mark } = row;
            if (!acc[ResultID]) {
                acc[ResultID] = {
                    ResultID,
                    StudentRegNumber,
                    SubjectName,
                    TermID,
                    Year,
                    ClassID,
                    SubjectClassID,
                    Comment,
                    TotalMark,
                    PaperMarks: [],
                    AverageMark: 0,
                    Grade: '', // Grade will be calculated later
                };
            }
            if (PaperName && Mark !== null) {
                acc[ResultID].PaperMarks.push({ PaperName, Mark });
            }
            return acc;
        }, {});

        // Calculate the average mark and grade for each subject
        Object.values(organizedSubjectResults).forEach(subjectResult => {
            const totalMarks = subjectResult.PaperMarks.reduce((sum, paper) => sum + paper.Mark, 0);
            const averageMark = subjectResult.PaperMarks.length > 0 ? totalMarks / subjectResult.PaperMarks.length : 0;
            subjectResult.AverageMark = averageMark;
            subjectResult.Grade = calculateGrade(averageMark, form);
        });

        // Calculate positions
        const gradeLevelResultsQuery = `
            SELECT * FROM gradelevelresults 
            WHERE ClassID = ? AND TermID = ? AND Year = ?
            ORDER BY TotalMark DESC
        `;
        const [gradeLevelResults] = await db.query(gradeLevelResultsQuery, [classID, termID, year]);

        // Calculate class positions
        let classPosition = 0;
        gradeLevelResults.forEach((result, index) => {
            if (result.RegNumber === studentRegNumber) {
                classPosition = index + 1;
            }
        });

        // Calculate form positions
        const formResultsQuery = `
            SELECT * FROM gradelevelresults 
            WHERE TermID = ? AND Year = ?
            ORDER BY TotalMark DESC
        `;
        const [formResults] = await db.query(formResultsQuery, [termID, year]);

        let formPosition = 0;
        formResults.forEach((result, index) => {
            if (result.RegNumber === studentRegNumber) {
                formPosition = index + 1;
            }
        });

        // Assuming there's only one record per student per term and year in gradelevelresults
        return {
            subjectResults: Object.values(organizedSubjectResults),
            classPosition,
            formPosition
        };
    } catch (err) {
        console.error('Error retrieving subject results for student: ', err);
        throw err;
    }
};


const updateSubjectResult = async (req, res) => {
    const connection = await db.getConnection();
    try {
        const { ResultID, PaperMarks, Comment } = req.body;
        
        await connection.beginTransaction();
        
        // Update the subject result comment
        const updateSubjectResultQuery = `
            UPDATE subjectresults 
            SET Comment = ? 
            WHERE ResultID = ?
        `;
        await connection.query(updateSubjectResultQuery, [Comment, ResultID]);

        // Update or insert the paper marks
        for (const paper of PaperMarks) {
            const { PaperName, Mark } = paper;
            
            // Check if the paper mark exists
            const checkPaperMarkQuery = `
                SELECT COUNT(*) AS count FROM papermarks 
                WHERE ResultID = ? AND PaperName = ?
            `;
            const [result] = await connection.query(checkPaperMarkQuery, [ResultID, PaperName]);

            if (result[0].count > 0) {
                // Update the existing paper mark
                const updatePaperMarkQuery = `
                    UPDATE papermarks 
                    SET Mark = ? 
                    WHERE ResultID = ? AND PaperName = ?
                `;
                await connection.query(updatePaperMarkQuery, [Mark, ResultID, PaperName]);
            } else {
                // Insert the new paper mark
                const insertPaperMarkQuery = `
                    INSERT INTO papermarks (ResultID, PaperName, Mark) 
                    VALUES (?, ?, ?)
                `;
                await connection.query(insertPaperMarkQuery, [ResultID, PaperName, Mark]);
            }
        }

        // Recalculate the total mark
        const updateTotalMarkQuery = `
            UPDATE subjectresults 
            SET TotalMark = (SELECT SUM(Mark) FROM papermarks WHERE ResultID = ?)
            WHERE ResultID = ?
        `;
        await connection.query(updateTotalMarkQuery, [ResultID, ResultID]);
        
        await connection.commit();
        
        res.status(200).json({ message: 'Subject result updated successfully' });
    } catch (err) {
        await connection.rollback();
        console.log('Error updating subject result: ', err);
        res.status(500).json({ message: 'Error updating subject result', error: err });
    } finally {
        connection.release();
    }
};


const deleteSubjectResult = async (req, res) => {
    const connection = await db.getConnection();
    try {
        const { ResultID } = req.params;

        await connection.beginTransaction();

        // Delete the paper marks associated with the result
        const deletePaperMarksQuery = `
            DELETE FROM papermarks 
            WHERE ResultID = ?
        `;
        await connection.query(deletePaperMarksQuery, [ResultID]);

        // Delete the subject result
        const deleteSubjectResultQuery = `
            DELETE FROM subjectresults 
            WHERE ResultID = ?
        `;
        await connection.query(deleteSubjectResultQuery, [ResultID]);

        await connection.commit();

        res.status(200).json({ message: 'Subject result deleted successfully' });
    } catch (err) {
        await connection.rollback();
        console.log('Error deleting subject result: ', err);
        res.status(500).json({ message: 'Error deleting subject result', error: err });
    } finally {
        connection.release();
    }
};


module.exports = {
    addPaperMarksAndCalculateTotal,
    getResultsAndCalculatePositions,
    getAllSubjectResultsForStudent,
    getAllResultsForSubjectClass,
    updateSubjectResult,
    deleteSubjectResult
};
