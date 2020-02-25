const fs = require('fs');
const inq = require('inquirer');
const datePrompt = require('date-prompt');
const chalk = require('chalk');
const ora = require('ora');
const path = require('path');
const moment = require('moment');

const smf = function() {
    const args =  process.argv.slice(2);
    // console.log('args: ', args);
    if (args.length > 0) {
        const path = args[0];
        const date = args[1];
        const time = args[2];
        if (! fs.existsSync(path)) {
            console.log(chalk.black.bgRedBright('Invalid path'));
            return;
        }

        if (! date) {
            console.log(chalk.black.bgRedBright('Date is mandatory argument'));
            return;
        }

        let dt;        
        try {
            dt = moment(`${date} ${time}`, 'YYYY-M-D HH:mm', true);
            // console.log('date is :', dt.isValid());
            if (dt.isValid()) {
                dt = new Date(dt);
            } else {
                throw new Exception(false);
            }
            // console.log('date is :', dt);
            // return;
        } catch (err) {
            console.log(chalk.black.bgRedBright('Invalid date format\n'));
            console.log(chalk.black.bgRedBright('date format should be YYYY-M-D 24HH:mm'));
            return;
        }
        const spinner = ora(`Loading...`).start();

        dirSearchRecursive(path, dt, (err, result) => {
            if (err) {
                console.log(chalk.black.bgRedBright(err.message));
            }
            if (result) {
                if (Array.isArray(result)) {
                    if (result.length === 0) {
                        console.log(chalk.grey('\n Nothing is found...'));    
                    }
                    console.log('\n');
                    for (const r of result) {
                        console.log(chalk.black.bgGreen(r));
                    }
                    console.log(chalk.black.bgGreen('DONE!'));
                } else {
                    console.log(chalk.grey('\n Nothing is found...'));
                }
            }
            spinner.stop();
        });
    } else {
        inq.prompt([
            {
                type: 'input',
                name: 'path',
                message: 'Enter path to search:'
            },
        ])
        .then((answers) => {
            if (! fs.existsSync(answers.path)) {
                console.log(chalk.black.bgRedBright('Invalid path'));
                return;
            }
        
            let dt;
            datePrompt('Enter date to find out latest modified files')
            .on('data', (v) => {
                date = v;
            })
            .on('submit', (v) => { 
                // console.log('Submitted with', date);
                const spinner = ora(`Loading...`).start();
                dt = new Date(v);
            
                // const dirs = dirSearch(answers.path, dt);
                dirSearchRecursive(answers.path, dt, (err, result) => {
                    if (err) {
                        console.log(chalk.red(err.message));
                    }
                    if (result) {
                        if (Array.isArray(result)) {
                            if (result.length === 0) {
                                console.log(chalk.grey('\n Nothing is found...'));    
                            }
                            console.log('\n');
                            for (const r of result) {
                                console.log(chalk.black.bgGreen(r));
                            }
                            console.log(chalk.black.bgGreen('DONE!'));
                        } else {
                            console.log(chalk.grey('\n Nothing is found...'));
                        }
                    }
                    spinner.stop();
                });
        
            })
            .on('abort', (v) => {
                console.log('task aborted');
            })
        });
    }
}

const options = (path) => {

}

const dirSearch = (dir, mTime) => {
    var results = [];
    var list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = dir + '/' + file;
        var stat = fs.statSync(file);
        // console.log('file stat is ', stat);
        if (stat && stat.isDirectory()) { 
            /* Recurse into a subdirectory */
            results = results.concat(dirSearch(file, mTime));
        } else { 
            /* Is a file */
            if (stat.mtime > mTime) {
                results.push(file);
            }
        }
    });
    return results;
}


const dirSearchRecursive = function(dir, mTime, done) {
    var results = [];
    fs.readdir(dir, function(err, list) {
      if (err) {
          return done(err);
      }
      var i = 0;
      (function next() {
        var file = list[i++];
        if (!file) {
            return done(null, results);
        }
        file = path.resolve(dir, file);
        fs.stat(file, function(err, stat) {
          if (stat && stat.isDirectory()) {
            dirSearchRecursive(file, mTime, function(err, res) {
              results = results.concat(res);
              next();
            });
          } else {
            if (stat.mtime > mTime) {
                results.push(file);
            }
            next();
          }
        });
      })();
    });
};

exports.smf = smf;