const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql");
const path = require("path");
const cors=require("cors");
const env=require("dotenv");
env.config();
const app = express();

const port = process.env.PORT || process.env.SERVER_PORT;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
});

db.connect((err) => {
  if (err) {
    console.error("Cannot connect to database.", err);
    throw err;
  }
  console.log("MySQL database connected");
});

curr_user=""
app.post("/submit", (req, res) => {
  const { username, language, input, code } = req.body;
  curr_user=username;
  const sql = "INSERT INTO data (username, language, input, code) VALUES (?, ?, ?, ?)";
  db.query(sql, [username, language, input, code], (err, result) => {
    if (err) {
      console.error("Error inserting data into MySQL:", err);
      res.status(500).json({ error: "Error submitting data" });
      return;
    }
    console.log("Data submitted to MySQL");
    res.status(200).json({ message: "Data submitted successfully" });
  });
});

const formatTimeDifference = (timestamp) => {
  const currentTime = new Date();
  const submissionTime = new Date(timestamp);
  const difference = currentTime - submissionTime;

  const minute = 60 * 1000;
  const hour = minute * 60;
  const day = hour * 24;
  const week = day * 7;

  if (difference < minute) {
      const seconds = Math.floor(difference / 1000);
      return `${seconds} second${seconds !== 1 ? 's' : ''} ago`;
  } else if (difference < hour) {
      const minutes = Math.floor(difference / minute);
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  } else if (difference < day) {
      const hours = Math.floor(difference / hour);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  } else if (difference < week) {
      const days = Math.floor(difference / day);
      return `${days} day${days !== 1 ? 's' : ''} ago`;
  } else {
      return submissionTime.toLocaleDateString();
  }
};

app.get("/",(req,res)=>{
  res.send("Take U Forward Task.");
});

app.get("/snippets", (req, res) => {
  const sql = "SELECT username, language, input, SUBSTRING(code, 1, 100) AS code, created_at FROM data";
  db.query(sql, (err, results) => {
      if (err) {
          console.error("Error fetching data from MySQL:", err);
          res.status(500).json({ error: "Error fetching data" }); 
          return;
      }
      const formattedResults = results.map(snippet => ({
          ...snippet,
          created_at: formatTimeDifference(snippet.created_at)
      }));
      res.status(200).json(formattedResults);
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
