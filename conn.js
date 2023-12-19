var mysql = require("mysql");
// require('./views/Registration');
// require('./views/login');
var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "@Shruti2808",
  database: "databits",
  port: 3306,
});

con.connect((err) => {
  if (err) {
    console.error("Database connection error: " + err.message);
  } else {
    console.log("Connected to the database");
  }
});
module.exports.con = con;
