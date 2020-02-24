const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const QtrSchema = new Schema(
  {
    year: Number,
    quarter: Number,
    grades: [{
        name: String,
        average: Number
    }]
  },
  { timestamps: true }
);

module.exports = {
  Qtr: mongoose.model('Qtr', QtrSchema)
}