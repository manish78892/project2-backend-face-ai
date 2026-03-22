const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./src/config/db');
dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());


app.use('/api/admin', require('./src/routes/auth'));
app.use('/api/admin/faculty', require('./src/routes/faculty'));
app.use('/api/admin/dashboard', require('./src/routes/dashboard'));
app.use('/api/faculty', require('./src/routes/facultyAuth'));
app.use('/api/attendance', require('./src/routes/attendance'));
app.use('/api/faculty', require('./src/routes/facultyDashboard'));
app.use('/api/leaves', require('./src/routes/leaveRoutes'));
app.use('/api/admin/leaves', require('./src/routes/adminLeaveRoutes'));
app.use("/api/faculty", require("./src/routes/publicFaculty"));
app.use('/api/admin/reports', require('./src/routes/adminReportRoutes'));


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));