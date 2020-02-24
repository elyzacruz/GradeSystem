const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const formidable = require('formidable');

const mongoose = require('mongoose');
const { Qtr } = require('./dataModel');

const { calculateGrades } = require('./helper');
const mongodb =
  'mongodb+srv://elyza:elyza@cluster0-2lkpx.mongodb.net/test?retryWrites=true&w=majority';
const PORT = 3001;

const router = express.Router();
const app = express();
app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

mongoose.connect(mongodb, { useNewUrlParser: true, useUnifiedTopology: true });

let db = mongoose.connection;
db.once('open', () => console.log('connected to the database'));
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

router.get('/grades', (req, res) => {
  const { year, qtr } = req.query;
  Qtr.findOne({ year: parseInt(year), quarter: parseInt(qtr) }, (err, data) => {

    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true, data });
  });
});

router.get('/years', (req, res) => {
  Qtr.find((err, data) => {
    const store = {};
    data.forEach(doc => {
      if(!store[doc.year]){
        store[doc.year] = [doc.quarter];
      } else {
        store[doc.year].push(doc.quarter);
      }
    });
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true, data: store });
  });
});

router.delete('/deleteQuarters', (req, res) => {
  Qtr.remove({}, (err) => {
    if (err) return res.send(err);
    return res.json({ success: true });
  });
});

router.post('/getAverage', (req, res) => {
  new formidable.IncomingForm().parse(req)
    .on('file', (name, file) => {
      if (file) {
        Promise.resolve(calculateGrades(file))
          .then(({ qtr, year, studentAve: studentAverage }) => {
            const grades = Object.keys(studentAverage).map(name => ({
              name,
              average: studentAverage[name]
            }));

            Qtr.findOne({ year: parseInt(year), quarter: parseInt(qtr) },
              (err, existingQtr) => {
                if (err) return res.send(err);
                if (existingQtr) {
                  Qtr.updateOne(
                    {
                      year: parseInt(year),
                      quarter: parseInt(qtr)
                    }, { grades: grades }, err => {
                      if(err) res.json({ success: false, error: err });
                    res.json({ success: true, data: { year, qtr: parseInt(qtr) } });
                    }
                  );
                } else {
                  let qtrDoc = new Qtr();
                  qtrDoc.year = parseInt(year);
                  qtrDoc.quarter = parseInt(qtr);
                  qtrDoc.grades = grades;

                  qtrDoc.save(err => {
                    if(err) res.json({ success: false, error: err });
                    res.json({ success: true, data: { year, qtr: parseInt(qtr) } });
                  });
                }
              });
          }).catch(err => res.json({ success: false, error: err }));
      } else {
        res.json({ success: false, err: 'INVALID_FILE_FORMAT' });
      }

    })
    .on('aborted', () => {
      console.error('Request aborted');
    })
    .on('error', (err) => {
      console.error('Error', err)
      throw err;
    });
});

app.use('/api', router);

app.listen(PORT, () => console.log(`LISTENING ON PORT ${PORT}`));