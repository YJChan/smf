const fs = require('fs');
const inq = require('inquirer');
const datePrompt = require('date-prompt');
const chalk = require('chalk');
const ora = require('ora');
const path = require('path');

const smf = function() {
    inq.prompt([
        {
            type: 'input',
            name: 'path',
            message: 'Enter path to search:'
        },
    ])
    .then((answers) => {
        if (! fs.existsSync(answers.path)) {
            console.log(chalk.bgRedBright('Invalid path'));
            return;
        }
    
        let date;
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
                        for (const r of result) {
                            console.log(chalk.green(r));
                        }
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