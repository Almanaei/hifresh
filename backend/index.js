require('dotenv').config();



const express = require('express');



const cors = require('cors');



const path = require('path');



const userRoutes = require('./routes/userRoutes');



const bookingRoutes = require('./routes/bookingRoutes');



const backupRoutes = require('./routes/backupRoutes');



const reportRoutes = require('./routes/reportRoutes');



const app = express();



app.use(cors());



app.use(express.json());



app.use((req, res, next) => {

  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);

  next();

});



const fs = require('fs');

const uploadsDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadsDir)){

  fs.mkdirSync(uploadsDir, { recursive: true });

}



app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {

  setHeaders: (res, filePath) => {

    if (path.extname(filePath) === '.pdf') {

      res.set({

        'Content-Type': 'application/pdf',

        'Content-Disposition': 'inline; filename=' + path.basename(filePath)

      });

    }

  }

}));



app.use('/api/users', userRoutes);



app.use('/api/bookings', bookingRoutes);



app.use('/api/backups', backupRoutes);



app.use('/api/reports', reportRoutes);



app.use((error, req, res, next) => {

  console.error('Error:', error);

  res.status(error.status || 500).json({

    message: error.message || 'An unexpected error occurred',

    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined

  });

});



const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

  console.log(`Server running on port ${PORT}`);

});


