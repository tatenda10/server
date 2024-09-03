const express = require('express');
const bodyParser = require('body-parser'); 
const cors = require('cors'); // Import the cors package
require('dotenv').config(); 

const app = express();

app.use(bodyParser.json());
app.use(cors()); // Use cors middleware

const searchstudent = require('./routes/students/searchStudent')
const getstudent = require('./routes/students/Getstudent');
const students = require('./routes/students/students');
const employees = require('./routes/employees/employees');
const Getallstudents = require('./routes/students/Getallstudents');
const gradelevelclasses = require('./routes/classes/gradelevelclass');
const gradelevelclasses_students = require('./routes/classes/Classstudent_Gradelevel');
const Subjectlevelclasses = require('./routes/classes/Subjectlevelclass');
const subjectlevelclasses_students = require('./routes/classes/Classstudent_Subjectlevel');
const results = require('./routes/results/Results'); 
const Gradelevelresults = require('./routes/results/Results'); 
const GetResults = require('./routes/results/Getresults'); 
const Getsubjectresults = require('./routes/results/Getsubjectresults'); 
const Payslips = require('./routes/employees/Payslips')
const announcements = require('./routes/announcements/Announcements')
const Auth_users = require('./routes/users/Auth')
const Attendance = require('./routes/students/Attendance')
const Auth_student = require('./routes/students/Auth')
const Timetable = require('./routes/classes/Timetables')
const Publishresults = require('./routes/results/Publishresults')
const Invoices = require('./routes/financials/Invoices')
const payments = require('./routes/financials/Payments')
const Editpayments = require('./routes/financials/Editpayments')
const Temppayments =require('./routes/financials/Gettemppayments')
const EditInvoice = require('./routes/financials/EditInvoice')
const Utilities = require('./routes/Utilities/Utility')
const Dashboard = require('./routes/Utilities/dashboardRoutes')
const ResetClasses = require('./routes/classes/ResetClasses')
const Suggestions = require('./routes/suggestions/Suggestions')


app.use('/createstudent', students); 
app.use('/search', searchstudent); 
app.use('/getstudent', getstudent); 
app.use('/createemployee', employees);
app.use('/getallstudents', Getallstudents);
app.use('/creategradelevelclass', gradelevelclasses);
app.use('/getgradelevelclass', gradelevelclasses);
app.use('/editgradelevelclass', gradelevelclasses);
app.use('/addstudent', gradelevelclasses_students);
app.use('/Getstudentsgradelevel', gradelevelclasses_students);

app.use('/subjectlevelclass', Subjectlevelclasses);
app.use('/subjectlevel', subjectlevelclasses_students);

app.use('/employee', employees);
app.use('/getallemployees', employees);
app.use('/addsubjectresult', results);
app.use('/addgradelevelresult', Gradelevelresults);
app.use('/getallresults', GetResults);
app.use('/getsubjectresults', Getsubjectresults);




app.use('/payslips',Payslips)

app.use('/announcements' , announcements)


app.use('/users-auth', Auth_users)
app.use('/attendance',Attendance)

app.use('/students-auth', Auth_student)


app.use('/timetable',Timetable)



app.use('/publish-results',Publishresults)

app.use('/invoices',Invoices)
app.use('/payments',payments)
app.use('/edit-payments',Editpayments)
app.use('/temp-payments',Temppayments)
app.use('/utilities',Utilities)

app.use('/edit-invoice',EditInvoice)

app.use('/dashboard',Dashboard)

app.use('/reset-classes',ResetClasses)

app.use('/suggestions',Suggestions)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

 