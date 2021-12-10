//requires for mysql2/inquirer/console.table
const mysql = require("mysql2");
const inquirer = require("inquirer");
const cTable = require("console.table");
//require dotenv to hide MySQL password
require("dotenv").config();

// Connect to database
const con = mysql.createConnection({
  host: "localhost",
  // MySQL username,
  user: process.env.DB_USER,
  // MySQL password
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

con.connect((err) => {
  if (err) throw err;
  init();
});

//init function with initial display for application and then load main menu
function init() {
  console.log("********************************************");
  console.log("*                                          *");
  console.log("*                                          *");
  console.log("*             EMPLOYEE TRACKER             *");
  console.log("*                                          *");
  console.log("*                                          *");
  console.log("********************************************");
  loadMainMenu();
}

//loads list of initial menu items for application
function loadMainMenu() {
  inquirer
    .prompt([
      {
        type: "list",
        name: "choice",
        message: "What would you like to do?",
        choices: [
          {
            name: "View all employees",
            value: "viewEmployees",
          },
          {
            name: "Add an employee",
            value: "addEmployee",
          },
          {
            name: "Update an employee role",
            value: "updateRole",
          },
          {
            name: "View all employee roles",
            value: "viewRoles",
          },
          {
            name: "Add an employee role",
            value: "addRole",
          },
          {
            name: "View all departments",
            value: "viewDepartments",
          },
          {
            name: "Add a department",
            value: "addDepartment",
          },
          {
            name: "View department budgets",
            value: "viewBudgets",
          },
          {
            name: "Quit",
            value: "quit",
          },
        ],
      },
    ])
    .then((res) => {
      let choice = res.choice;
      //switch statement for proper function to run based on menu item chosen
      switch (choice) {
        case "viewEmployees":
          viewEmployees();
          break;
        case "addEmployee":
          addEmployee();
          break;
        case "updateRole":
          updateRole();
          break;
        case "viewRoles":
          viewRoles();
          break;
        case "addRole":
          addRole();
          break;
        case "viewDepartments":
          viewDepartments();
          break;
        case "addDepartment":
          addDepartment();
          break;
        case "viewBudgets":
          viewBudgets();
          break;
        case "quit":
          quit();
          break;
        default:
          console.log("Something went wrong!");
          break;
      }
    });
}

//View all employees function
viewEmployees = () => {
  console.log('\nDisplaying all employees...\n')
  //SQL query to pull data and join from all 3 tables
  const sqlQuery = `SELECT employee.id, 
              employee.first_name,
              employee.last_name,
              role.title,
              department.name AS department,
              role.salary,
              CONCAT (manager.first_name, " ", manager.last_name) AS manager
              FROM employee
              LEFT JOIN role ON employee.role_id = role.id
              LEFT JOIN department ON role.department_id = department.id
              LEFT JOIN employee manager ON manager.id = employee.manager_id`;
  //MySQL2 query function to run the query and then use console.table to display the rows in terminal
  con.query(sqlQuery, (err, rows) => {
    if (err) throw err;
    console.table(rows);
    loadMainMenu();
  });
};

//addEmployee function
addEmployee = () => {
  //ask questions for new employee first/last name
  inquirer
    .prompt([
      {
        type: "input",
        name: "firstName",
        message: "What is the employee's first name?",
        validate: (firstName) => {
          if (firstName) {
            return true;
          } else {
            console.log("Please enter a first name!");
            return false;
          }
        },
      },
      {
        type: "input",
        name: "lastName",
        message: "What is the employee's last name?",
        validate: (lastName) => {
          if (lastName) {
            return true;
          } else {
            console.log("Please enter a first name!");
            return false;
          }
        },
      },
    ])
    //store first/last name to params variable
    .then((answer) => {
      const params = [answer.firstName, answer.lastName];
      
      //query database for role id and role title
      const roleQuery = `SELECT role.id,
                    role.title FROM role`;

      //MySQL2 function to run the query search
      con.query(roleQuery, (err, data) => {
        if (err) throw err;
        
        //take roles data from query and .map() the data to formulate list of roles for next inquirer question
        const roles = data.map(({ id, title }) => ({ name: title, value: id }));

        //inquirer question to select the role from list
        inquirer
          .prompt([
            {
              type: "list",
              name: "role",
              message: "What is the employee's role?",
              choices: roles,
            },
          ])
          
          //take the selection from inquirer and push to params array
          .then((roleChoice) => {
            const role = roleChoice.role;
            params.push(role);
            
            //SQL query to select all from employee table
            const managerQuery = `SELECT * FROM employee`;

            con.query(managerQuery, (err, data) => {
              if (err) throw err;

              //.map() to grab id, first and last name from employee table
              const managers = data.map(({ id, first_name, last_name }) => ({
                name: first_name + " " + last_name,
                value: id,
              }));

              //inquirer question to ask manager with list being managers from database
              inquirer
                .prompt([
                  {
                    type: "list",
                    name: "manager",
                    message: "Who is the employee's manager?",
                    choices: managers,
                  },
                ])
                
                //take selection from question and push to params array
                .then((managerChoice) => {
                  const manager = managerChoice.manager;
                  params.push(manager);
                  
                  //SQL statement to add a new entry to employee table
                  const sqlData = `INSERT INTO employee(first_name, last_name, role_id, manager_id)
                              VALUES (?, ?, ?, ?)`;
                  
                  con.query(sqlData, params, (err, result) => {
                    if (err) throw err;
                    console.log("Employee Added!");

                    viewEmployees();
                  });
                });
            });
          });
      });
    });
};

//update Role function
updateRole = () => {
  //select all from employee table
  const employeesQuery = `SELECT * FROM employee`;

    //taking query results and .map() them to get id, first and last name for inquirer question
  con.query(employeesQuery, (err, data) => {
    if (err) throw err;

    const employees = data.map(({ id, first_name, last_name }) => ({
      name: first_name + " " + last_name,
      value: id,
    }));

    inquirer
      .prompt([
        {
          type: "list",
          name: "name",
          message: "Which employee's role do you want to update?",
          choices: employees,
        },
      ])
      //take answer from inquirer and push to params array
      .then((employeeChoice) => {
        const emp = employeeChoice.name;
        const params = [];
        params.push(emp);

          //sql query to select all from role
        const roleSql = `SELECT * FROM role`;

          //query results and then .map() on table data to form id/title for inquirer question
        con.query(roleSql, (err, data) => {
          if (err) throw err;

          const roles = data.map(({ id, title }) => ({
            name: title,
            value: id,
          }));

          //inquirer to ask employee's new role question with database roles as possible answers
          inquirer
            .prompt([
              {
                type: "list",
                name: "role",
                message: "What is the employee's new role?",
                choices: roles,
              },
            ])
            //taking answer from inquirer and pushing to params array
            .then((roleChoice) => {
              let role = roleChoice.role;
              params.push(role);

              let employee = params[0];
              params[0] = role;
              params[1] = employee;

                //update employee role in database with params array data
              const sqlData = `UPDATE employee SET role_id = ? WHERE id = ?`;

              con.query(sqlData, params, (err, result) => {
                if (err) throw err;
                console.log("Employee Role has been updated!");

                viewEmployees();
              });
            });
        });
      });
  });
};

viewRoles = () => {
  console.log('\nDisplay all employee roles...\n')
  const sqlQuery = `SELECT role.id, 
  role.title,
  role.salary,
  department.name AS department FROM role
  INNER JOIN department ON role.department_id = department.id`;

  con.query(sqlQuery, (err, rows) => {
    if (err) throw err;
    console.table(rows);
    loadMainMenu();
  });
};

addRole = () => {
  inquirer
    .prompt([
      {
        type: "input",
        name: "role",
        message: "What is the name of the role you would like to add?",
        validate: (role) => {
          if (role) {
            return true;
          } else {
            console.log("Please enter a first name!");
            return false;
          }
        },
      },
      {
        type: "input",
        name: "salary",
        message: "What is the salary of the new role being added?",
        validate: (salary) => {
          if (salary) {
            return true;
          } else {
            console.log("Please enter a valid salary!");
            return false;
          }
        },
      },
    ])
    .then((answer) => {
      const params = [answer.role, answer.salary];

      const departmentQuery = `SELECT name, id FROM department`;

      con.query(departmentQuery, (err, data) => {
        if (err) throw err;

        const departments = data.map(({ id, name }) => ({
          name: name,
          value: id,
        }));

        inquirer
          .prompt([
            {
              type: "list",
              name: "department",
              message: "What department is this role in?",
              choices: departments,
            },
          ])
          .then((answer) => {
            const department = answer.department;
            console.log(department);
            params.push(department);

            const sqlData = `INSERT INTO role(title, salary, department_id)
                          VALUES (?, ?, ?)`;

            con.query(sqlData, params, (err, result) => {
              if (err) throw err;
              console.log("Added" + answer.role + " to roles!");

              viewRoles();
            });
          });
      });
    });
};

//view departments function
viewDepartments = () => {
  console.log('\nDisplaying all departments...\n')
  const sqlQuery = `SELECT * from department`;

  //sql query to select all from department table and console.table to the terminal
  con.query(sqlQuery, (err, rows) => {
    if (err) throw err;
    console.table(rows);

    //load main menu again
    loadMainMenu();
  });
};

//add department function
addDepartment = () => {
  //inquirer input question for department to add
  inquirer
    .prompt([
      {
        type: "input",
        name: "department",
        message: "What is the name of the department you would like to add?",
        validate: (department) => {
          if (department) {
            return true;
          } else {
            console.log("Please enter a valid department name!");
            return false;
          }
        },
      },
    ])
    //push answer from question to params array
    .then((answer) => {
      const department = answer.department;
      console.log(department);
      params = [];
      params.push(department);

      //sql query to insert params array into department table name column

      const sqlData = `INSERT INTO department(name)
                    VALUES (?)`;

      con.query(sqlData, params, (err, result) => {
        if (err) throw err;
        console.log("Added" + answer.department + " to departments!");

          //display departments with new one added
        viewDepartments();
      });
    });
};

//function to view department budgets
viewBudgets = () => {
  console.log("\nDisplaying Budgets by Department...\n");

    //sql query to select department_id/name from department table and sum salary from role table and join together for report
  const sqlData = `SELECT department_id AS id,
              department.name AS department,
              SUM (salary) AS budget
              FROM role
              JOIN department ON role.department_id = department.id GROUP BY department_id`;
  con.query(sqlData, (err, rows) => {
    if (err) throw err;
    console.table(rows);

    loadMainMenu();
  });
};

// exit the application
function quit() {
  console.log("Goodbye! Have a nice day!");
  process.exit();
}
