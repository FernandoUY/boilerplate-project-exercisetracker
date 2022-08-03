const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

app.use(cors());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

const exerciseSchema = new mongoose.Schema({
  description: {type: String, required: true},
  duration: {type: Number, required: true},
  date: Date
});

const userSchema = new mongoose.Schema({
  username: {type: String, required: true, unique: true},
  log: [exerciseSchema]
});

const User = mongoose.model('User', userSchema);
const Exercise = mongoose.model('Exercise', exerciseSchema);

app.post('/api/users', (req, res) => {
  const {username} = req.body;
  User.create({username}, (err, user) => {
    if(err) return res.send(err.toString());
    res.json({username: user.username, _id: user.id});
  });
});

app.get('/api/users', (req, res) => {
  User.find({}, (err, users) => {
    if(err) return res.send(err.toString());
      res.json(users);
  })
});

app.post('/api/users/:_id/exercises', (req, res) => {
  const id = req.params._id;
  const {description, duration, date} = req.body;
  const newExercise = new Exercise({
    description,
    duration, 
    date: date ? new Date(date) : new Date()
  });

  User.findByIdAndUpdate(id, {$push: {log: newExercise}}, {new: true}, (err, updatedUser) => {
    if(err) return console.error(err);
    res.json(updatedUser);
  });
});

app.get('/api/users/:_id/logs', (req, res) => {
  const id = req.params._id;

  User.findById(id, (err, user) => {
    if(err){
      return res.send(err.toString())
    }
    let {username, _id, log} = user;

    if(req.query.limit){
      log = log.slice(0, req.query.limit)
    }

    if(req.query.from || req.query.to){
      let from = new Date();
      let to = new Date();

      if(req.query.from){
        from = new Date(req.query.from);
      }

      if(req.query.to){
        to = new Date(req.query.to);
      }

      from = from.getTime()
      to = to.getTime()

      log = log.filter((exercise) => {
        let exerciseDate = new Date(exercise.date).getTime()

        return exerciseDate >= from && exerciseDate <= to
      });
    }
    
    res.json({username, count: log.length, _id, log});
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});