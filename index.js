// const { Router } = require("express");
const express = require("express");
const app = express();
// const exphbs = require("express-handlebars");

const conn = require("./conn").con;
const path = require("path");
const bodyParser = require("body-parser");
// const { handlebars } = require("hbs");

app.use(bodyParser.urlencoded({ extended: true }));

app.use("/public", express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "hbs");

app.set("/views", express.static(path.join(__dirname, "views")));

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/Adminlogin", (req, res) => {
  res.render("Adminlogin");
});

app.get("/Emplogin", (req, res) => {
  res.render("Emplogin");
});

app.get("/addemp", (req, res) => {
  //fetching data of the new employee and storing in the table
  const { name, empid, pass, DOJ, DOB, email } = req.query;

  let qry = "select * from addnewemp where empid=?";
  conn.query(qry, [empid], (err, results) => {
    if (err) {
      console.log(err);
    } else {
      if (results.length > 0) {
        res.render("adminside", { checkmesg: true });
      } else {
        //insert query
        let qry2 = "insert into addnewemp values(?,?,?,?,?,?)";
        conn.query(
          qry2,
          [name, empid, pass, DOJ, DOB, email],
          (err, results) => {
            if (!err) {
              res.render("adminside", { mesg: true });
            } else {
              console.log(err);
            }
          }
        );
      }
    }
  });
});

//Login of the user
app.get("/emp", (req, res) => {
  const empid = req.query.empid;
  const pass = req.query.pass;
  const sql = "select * from addnewemp where empid=? and pass=?";

  conn.query(sql, [empid, pass], (err, results) => {
    if (err) {
      console.error("Error quering the database", +err.message);
      res.send("Error quering the database");
    } else {
      if (results.length > 0) {
        const empid = results[0].empid;
        res.render("Empdashboard", { empid }); //User authentication
      } else {
        res.send("Invalid id or passwrod"); //Autentication failed
      }
    }
  });
});

//Login of the admin
app.get("/alogin", async (req, res) => {
  const { email, id } = req.query;
  const sql = "select * from admin where email = ? and  id = ?";
  const values = [email, id];
  conn.query(sql, values, (err, results) => {
    if (err) {
      console.error("Error quering the database", +err.message);
      res.send("Error quering the database");
    } else {
      let qry1 = "select * from addnewemp";
      conn.query(qry1, (err, result) => {
        let qry2 = "select * from leaveappl";
        conn.query(qry2, (err, data) => {
          if (!err) {
            res.render("adminside", { cancleemp: result, leaverequest: data });
          } else {
            console.log(err);
          }
        });
      });
    }
  });
});

//Add the employee

//Delete the employee

app.get("/delemp/:empid", async (req, res) => {
  try {
    const empid = req.params.empid;
    let qry = "select * from addnewemp where empid=?";
    conn.query(qry, [empid], (err, result) => {
      if (!err) {
        let qry1 = "delete from addnewemp where empid=?";
        conn.query(qry1, [empid], (err, result) => {
          if (err) {
            console.log(err);
          } else {
            res.send("deleted the data");
          }
        });
      }
    });
  } catch (err) {
    console.log(err);
  }
});

app.get("/delete/:empid", async (req, res) => {
  try {
    const empid = req.params.empid;
    let qry = "delete from leaveappl where empid=?";
    conn.query(qry, [empid], (err, results) => {
      if (!err) {
        res.send("deleted");
      } else {
        console.log(err);
      }
    });
  } catch (err) {
    console.log(err);
  }
});

app.get("/accept/:empid", async (req, res) => {
  const { empid, leavetype, noofdays, startdate, enddate } = req.body;
  let qry1 = "insert into acceptedleaves values(?,?,?,?,?)";
  conn.query(
    qry1,
    [empid, leavetype, noofdays, startdate, enddate],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        let qry1 = "delete from leaveappl where empid=?";
        conn.query(qry1, [empid], (err, results) => {
          if (!err) {
            res.render("adminside");
          } else {
            console.log(err);
          }
        });
      }
    }
  );
});

//EMPLOYEE SIDE

//Mark attendance of an employee
app.post("/markattendance", async (req, res) => {
  const { empid, Attendance, Location, Date } = req.body;
  const qry = "insert into empattendance values (?,?,?,?)";
  conn.query(qry, [empid, Attendance, Location, Date], (err, results) => {
    if (!err) {
      res.render("Empdashboard");
    } else {
      console.log(err);
    }
  });
});

//Leave Application for employee side
app.post("/application", (req, res) => {
  const { empid, leavetype, noofdays, startdate, enddate } = req.body;
  const qry = "select * from leaveappl where empid=? and startdate";
  const values = [empid, leavetype, noofdays, startdate, enddate];

  conn.query(qry, [empid, startdate], (err, results) => {
    if (err) {
      console.log(err);
    } else {
      if (results.length > 0) {
        res.render("Empdashboard");
      } else {
        let qry1 = "insert into leaveappl values (?,?,?,?,?)";
        conn.query(qry1, values, (err, results) => {
          if (err) {
            console.log(err);
          } else {
            res.render("Empdashboard");
          }
        });
      }
    }
  });
});

app.listen(4000, () => {
  console.log(`Connected 4000`);
});
