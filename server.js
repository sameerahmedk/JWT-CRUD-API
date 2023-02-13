const express = require('express');
const logger = require('morgan');
const movies = require('./routes/movies');
const users = require('./routes/users');
const bodyParser = require('body-parser');
let jwt = require('jsonwebtoken');

const app = express();
app.set('secretKey', 'nodeRestApi'); // jwt secret token

app.use(bodyParser.urlencoded({ extended: true }));
app.use('/api/users', users);

app.use(bodyParser.json());
// Configuring the database
const dbConfig = require('./config/database.config.js');
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

// Connecting to the database
mongoose
	.connect(dbConfig.url, {
		useNewUrlParser: true,
	})
	.then(() => {
		console.log('Successfully connected to the database');
	})
	.catch((err) => {
		console.log('Could not connect to the database. Exiting now...', err);
		process.exit();
	});

app.use(logger('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.get('/', function (req, res) {
	res.json({ Sameer: 'Its working, yay!' });
});

// public route
app.use('/users', users);
// private route
app.use('/movies', validateUser, movies);
app.get('/favicon.ico', function (req, res) {
	res.sendStatus(204);
});

function validateUser(req, res, next) {
	jwt.verify(
		req.headers['x-access-token'],
		req.app.get('secretKey'),
		function (err, decoded) {
			if (err) {
				res.json({ status: 'error', message: err.message, data: null });
			} else {
				// add user id to request
				req.body.userId = decoded.id;
				next();
			}
		}
	);
}

// express doesn't consider not found 404 as an error so we need to handle 404 explicitly
app.use(function (req, res, next) {
	let err = new Error('Not Found');
	err.status = 404;
	next(err);
});
// handle errors
app.use(function (err, req, res, next) {
	console.log(err);

	if (err.status === 404) res.status(404).json({ message: 'Not found' });
	else res.status(500).json({ message: 'Something looks wrong :(' });
});

let PORT = 8080;

app.listen(PORT, () => {
	console.log(`Server is listening on http://localhost:${PORT}`);
});
