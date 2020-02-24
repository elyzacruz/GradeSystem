const lineReader = require('line-reader');

const removeSmallest = arr => {
    const min = Math.min(...arr);
    return arr.filter(e => e != min);
}

const parseGrades = file => {
    let students = {};
    let qtr = null;
    let year = null;
    return new Promise(function (resolve, reject) {
        lineReader.eachLine(file.path, (line, last) => {
            const curr = line.split(' ');
            let h = [];
            let t = [];
            if (curr[0] === 'Quarter') {
                qtr = curr[1];
                year = curr[curr.length - 1];
            } else {
                if (!qtr && !year) {
                    reject({ error: 'INVALID_FORMAT' });
                } else {
                    const name = [`${curr[0]} ${curr[1]}`];
                    const hIndex = curr.findIndex(curr => curr === 'H');
                    const tIndex = curr.findIndex(curr => curr === 'T');
                    let currType = null;
                    curr.slice(2).forEach(item => {
                        if (item === 'H') {
                            currType = item;
                        } else if (item === 'T') {
                            currType = item;
                        } else {
                            if (currType) {
                                const grade = parseFloat(item);
                                if (grade > -1 && !isNaN(grade)) {
                                    switch (currType) {
                                        case 'T':
                                            t.push(grade);
                                            break;
                                        case 'H':
                                            h.push(grade);
                                            break;
                                        default:
                                            break;
                                    }
                                } else {
                                    reject({ error: 'INVALID_FORMAT' });
                                }
                            } else {
                                reject({ error: 'INVALID_FORMAT' });
                            }
                        }
                    })

                    if (h.length) {
                        h = removeSmallest(h);
                    }

                    students[name] = { t, h };
                    if (last) {
                        resolve();
                    }
                }
            }
        })
    }).then(() => {
        return {
            year,
            qtr,
            students
        };
    })
}

const calculateGrades = fileData => {
    return Promise.resolve(parseGrades(fileData))
        .then(({ year, qtr, students: studentList }) => {
            let studentAve = {};
            Object.keys(studentList).forEach(name => {
                const { h: homework, t: tests } = studentList[name];
                const hSum = homework.reduce((i, f) => i + f, 0);
                const tSum = tests.reduce((i, f) => i + f, 0);
                const average = (hSum / homework.length) * 0.4 + (tSum / tests.length) * 0.6;
                studentAve[name] = average.toFixed(1);
            });
            return {
                year,
                qtr,
                studentAve
            }
        }).catch(err => {
            console.log(err);
            Promise.reject(err);
        });
}

module.exports = {
    calculateGrades
}