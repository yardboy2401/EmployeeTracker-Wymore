const mysql = require ('mysql2');
const inquirer = require("inquirer");
const cTable = require('console.table');

require('dotenv').config();

// Connect to database
const con = mysql.createConnection(
  {
    host: 'localhost',
    // MySQL username,
    user: process.env.DB_USER,
    // MySQL password
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
  },
);

con.connect(err => {
  if(err) throw err;
  init();
});

function init() {
  console.log("********************************************")
  console.log("*                                          *")
  console.log("*                                          *")
  console.log("*             EMPLOYEE TRACKER             *")
  console.log("*                                          *")
  console.log("*                                          *")
  console.log("********************************************")
  loadMainMenu();
}

function loadMainMenu() {
  inquirer.prompt([
    {
      type: "list",
      name: "choice",
      message: "What would you like to do?",
      choices: [
        {
          name:  "View all employees",
          value: "viewEmployees"
        },
        {
          name:  "Add an employee",
          value: "addEmployee"
        },
        {
          name:  "Update an employee role",
          value: "updateRole"
        },
        {
          name:  "View all employee roles",
          value: "viewRoles"
        },
        {
          name: "Add an employee role",
          value: "addRole"
        },
        {
          name: "View all departments",
          value: "viewDepartments"
        },
        {
          name: "Add a department",
          value: "addDepartment"
        },
        {
          name: "Quit",
          value: "quit"
        }
      ]
    }
  ]).then(res => {
    let choice = res.choice;

    switch(choice) {
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
      case "quit":
        quit();
        break;
      default:
        console.log("Something went wrong!");
        break;
    }
  })
}

viewEmployees = () => {
  const sqlQuery = (`SELECT employee.id, 
              employee.first_name,
              employee.last_name,
              role.title,
              department.name AS department,
              role.salary,
              CONCAT (manager.first_name, " ", manager.last_name) AS manager
              FROM employee
              LEFT JOIN role ON employee.role_id = role.id
              LEFT JOIN department ON role.department_id = department.id
              LEFT JOIN employee manager ON manager.id = employee.manager_id`);
  
  con.query(sqlQuery, (err, rows) => {
    if(err) throw err;
    console.table(rows);
    loadMainMenu();
  });
};


addEmployee = () => {
  inquirer.prompt([
    {
      type: "input",
      name: "firstName",
      message: "What is the employee's first name?",
      validate: firstName => {
        if(firstName) {
          return true;
        } else {
          console.log('Please enter a first name!');
          return false;
        }
      } 
    },
    {
      type: "input",
      name: "lastName",
      message: "What is the employee's last name?",
      validate: lastName => {
        if(lastName) {
          return true;
        } else {
          console.log('Please enter a first name!');
          return false;
        }
      }
    }
  ])
  .then (answer => {
    const params = [answer.firstName, answer.lastName]

    const roleQuery = `SELECT role.id,
                    role.title FROM role`;

    con.query(roleQuery, (err, data) => {
      if(err) throw err;

      const roles = data.map(({ id, title }) => ({ name: title, value: id }));

      inquirer.prompt([
        {
          type: 'list',
          name: 'role',
          message: "What is the employee's role?",
          choices: roles
        }
      ])
        .then(roleChoice => {
          const role = roleChoice.role;
          params.push(role);

          const managerQuery = `SELECT * FROM employee`;

          con.query(managerQuery, (err, data) => {
            if(err) throw err;

            const managers = data.map(({ id, first_name, last_name }) => ({ name: first_name + " "+ last_name, value: id }));

            //console.log(managers);

            inquirer.prompt([
              {
                type: "list",
                name: "manager",
                message: "Who is the employee's manager?",
                choices: managers
              }
            ])
            .then(managerChoice => {
              const manager = managerChoice.manager;
              params.push(manager);

              const sqlData = `INSERT INTO employee(first_name, last_name, role_id, manager_id)
                              VALUES (?, ?, ?, ?)`;

              con.query(sqlData, params, (err, result) => {
                if(err) throw err;
                console.log("Employee Added!")

                viewEmployees();
              })
            })
        })
      })
    })
  })
}

updateRole = () => {
  const employeesQuery = `SELECT * FROM employee`;

con.query(employeesQuery, (err, data) => {
if(err) throw err;

const employees = data.map(({ id, first_name, last_name }) => ({ name: first_name + " " + last_name, value: id }));

  inquirer.prompt([
    {
      type: "list",
      name: "name",
      message: "Which employee's role do you want to update?",
      choices: employees
    },

  ])
  .then(employeeChoice => {
    const emp = employeeChoice.name;
    const params = [];
    params.push(emp);

    const roleSql = `SELECT * FROM role`;

    con.query(roleSql, (err, data) => {
      if(err) throw err;

      const roles = data.map(({ id, title }) => ({ name: title, value: id }));

        inquirer.prompt([
          {
            type: "list",
            name: "role",
            message: "What is the employee's new role?",
            choices: roles
          }
        ])
        .then(roleChoice => {
          let role = roleChoice.role;
          params.push(role);

          let employee = params[0];
          params[0] = role
          params[1] = employee

          const sqlData =  `UPDATE employee SET role_id = ? WHERE id = ?`;

          con.query(sqlData, params, (err, result) => {
            if(err) throw err;
            console.log("Employee Role has been updated!")

            viewEmployees();
          })

        })
    })
  })
  })
}


viewRoles = () => {
  const sqlQuery = (`SELECT role.id, 
  role.title,
  role.salary,
  department.name AS department FROM role
  INNER JOIN department ON role.department_id = department.id`
  );

con.query(sqlQuery, (err, rows) => {
if(err) throw err;
console.table(rows);
loadMainMenu();
});
}


addRole = () => {
  inquirer.prompt([
    {
      type: "input",
      name: "role",
      message: "What is the name of the role you would like to add?",
      validate: role => {
        if(role) {
          return true;
        } else {
          console.log('Please enter a first name!');
          return false;
        }
      }
    },
    {
      type: "input",
      name: "salary",
      message: "What is the salary of the new role being added?",
      validate: salary => {
        if(salary) {
          return true;
        } else {
          console.log('Please enter a valid salary!');
          return false;
        }
      }
    }
  ])
    .then (answer => {
      const params = [answer.role, answer.salary]
  
      const departmentQuery = `SELECT name, id FROM department`;
  
      con.query(departmentQuery, (err, data) => {
        if(err) throw err;
  
        const departments = data.map(({ id, name }) => ({ name: name, value: id }));
  
        inquirer.prompt([
          {
            type: 'list',
            name: 'department',
            message: "What department is this role in?",
            choices: departments
          }
        ])
        .then(answer => {
          const department = answer.department;
          console.log(department)
          params.push(department);

          const sqlData = `INSERT INTO role(title, salary, department_id)
                          VALUES (?, ?, ?)`;

          con.query(sqlData, params, (err, result) => {
            if(err) throw err;
            console.log("Added" + answer.role + " to roles!")

            viewRoles();
          })
        })
      })
    }) 
}


viewDepartments = () => {

}

// Exit the application
function quit() {
  console.log("Goodbye! Have a nice day!");
  process.exit();
}


