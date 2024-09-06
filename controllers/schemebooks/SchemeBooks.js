const db = require('../../db/db');
const path = require('path');

// Fetch all scheme books with employee name and surname
const getSchemeBooks = async (req, res) => {
  const { page = 1, perPage = 100 } = req.query; // Default page = 1 and perPage = 100

  const offset = (page - 1) * perPage;

  try {
      // Get the total count of scheme books
      const [totalCountResult] = await db.query('SELECT COUNT(*) as totalCount FROM scheme_books');
      const totalCount = totalCountResult[0].totalCount;
      
      // Fetch paginated scheme books with employee details, ordered by id DESC
      const [results] = await db.query(`
          SELECT sb.id, sb.description, sb.class, sb.date, sb.document, e.Name, e.Surname
          FROM scheme_books sb
          INNER JOIN employees e ON sb.employeeNumber = e.EmployeeNumber
          ORDER BY sb.id DESC
          LIMIT ? OFFSET ?
      `, [parseInt(perPage), offset]);
  
      // Calculate total pages
      const totalPages = Math.ceil(totalCount / perPage);
  
      res.status(200).json({
          schemeBooks: results,
          totalPages,
          totalCount
      });
  } catch (err) {
      console.error('Error fetching scheme books:', err);
      res.status(500).send('Error fetching scheme books');
  }
};


// In your controller (schemeBooksController.js)

const searchSchemeBooks = async (req, res) => {
    const { search } = req.query;

    try {
        const [results] = await db.query(`
        SELECT sb.id, sb.description, sb.class, sb.date, sb.document, e.Name, e.Surname
        FROM scheme_books sb
        INNER JOIN employees e ON sb.employeeNumber = e.EmployeeNumber
        WHERE sb.class LIKE ? OR sb.description LIKE ? OR sb.employeeNumber LIKE ?
      `, [`%${search}%`, `%${search}%`, `%${search}%`]);

        res.status(200).json({ schemeBooks: results });
    } catch (err) {
        console.error('Error searching scheme books:', err);
        res.status(500).send('Error searching scheme books');
    }
};



// Save new scheme book
const saveSchemeBook = async (req, res) => {
    const { employeeNumber, description, class: schemeClass, date } = req.body;
    const document = req.file ? req.file.filename : null;

    if (!employeeNumber || !description || !schemeClass || !date || !document) {
        return res.status(400).send('All fields are required');
    }

    try {
        await db.query(`
      INSERT INTO scheme_books (employeeNumber, description, class, date, document)
      VALUES (?, ?, ?, ?, ?)
    `, [employeeNumber, description, schemeClass, date, document]);
        res.status(201).send('Scheme book saved successfully');
    } catch (err) {
        console.error('Error saving scheme book:', err);
        res.status(500).send('Error saving scheme book');
    }
};

// Serve document for download
const downloadDocument = (req, res) => {
    const fileName = req.params.fileName;
    const filePath = path.join(__dirname, '../scheme_books', fileName);
    res.download(filePath, fileName, (err) => {
        if (err) {
            console.error('Error downloading file:', err);
            res.status(500).send('Error downloading file');
        }
    });
};

module.exports = {
    getSchemeBooks,
    saveSchemeBook,
    downloadDocument,
    searchSchemeBooks
};
