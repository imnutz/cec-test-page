var path = require('path');
var express = require('express');

var app = express();

app.use(express.static(path.join(__dirname)));

app.listen(3007);
console.log('starting at 3007');
