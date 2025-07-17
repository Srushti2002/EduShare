const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const db = require('./config/db'); // DB connection config
const userRoute = require('./routes/userRoute');
const playlistRoute = require('./routes/playlistRoute');
const { startSummaryWorker } = require('./workers/summaryWorker'); // corrected path

dotenv.config();
const app = express();

// -----------------------
// 🔐 Middleware (Must come BEFORE routes)
// -----------------------
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const allowedOrigins = ['http://localhost:4173'];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// -----------------------
// 🏁 Start the Summary Queue Worker (can be here or before routes)
// -----------------------
startSummaryWorker();

// -----------------------
// 🛣️ Routes
// -----------------------
app.get('/', (req, res) => {
  res.send('Welcome to EduShare');
});

app.use('/', userRoute);
app.use('/playlist', playlistRoute);
app.use('/api/ai', playlistRoute); // You probably want a different route file here

// -----------------------
// 🚀 Start Server
// -----------------------
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));




// const express = require('express');
// const cors = require('cors');
// const dotenv = require('dotenv');
// const bodyParser = require('body-parser');
// const db = require('./config/db');      // no need for .js, Node will resolve
// const userRoute = require('./routes/userRoute'); // keep consistent with CommonJS
// const playlistRoute = require('./routes/playlistRoute');
// const { startSummaryWorker } = require('../workers/summaryWorker');


// dotenv.config();

// const app = express();
// app.use(express.json());
// startSummaryWorker();
// // connectDB();

// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));

// const allowedOrigins = ['http://localhost:5173'];

// app.use(cors({
//   origin: function (origin, callback) {
//     if (!origin || allowedOrigins.includes(origin)) {
//       callback(null, true);
//     } else {
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
//   credentials: true
// }));

// app.get('/', (req, res) => {
//   res.send('Welcome to EduShare');
// });

// app.use('/', userRoute);

// app.use('/playlist', playlistRoute);

// app.use('/api/ai', playlistRoute);

// const PORT = process.env.PORT || 5000;

// app.listen(PORT, () => {
//   console.log(`Server is listening on ${PORT}`);
// });
