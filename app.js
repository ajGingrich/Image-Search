var express = require('express');
var path = require('path');
var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;

// Connection URL. This is where your mongodb server is running.
var url = process.env.MONGOLAB_URI;

var app = express();

var bingKey = '4581ce72ddc84210bace81fe40344f7c';
//var bingKey = procces.env.bingKey;
var Bing = require('node-bing-api')({ accKey: bingKey });

app.set('port', (process.env.PORT || 5000));

//configure app
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(__dirname + '/public'));

//use middleware

//define routes
//home
app.get('/', function (req, res) {
    res.render('index')
});

//catch the favicon first
app.get('/favicon.ico', function(req, res) {
    //var input = req.params.id;
    res.json(204);
});

var searchInfo = {};

//get new URL, add to database and send
app.get('/api/imagesearch/:id', function (req, res) {
    var search = req.params.id;
    var searchInfo = {};
    searchInfo.query = search;
    searchInfo.time = new Date();

    Bing.images(search, {
        top: 10,
        skip: 0
    }, function(error, res, body) {
        console.log(body);
    });

    // Use connect method and insert to the Server
    MongoClient.connect(url, function (err, db) {
        if (err) {
            console.log('Unable to connect to the mongoDB server. Error:', err);
        } else {
            var collection = db.collection('imageSearch');

            collection.insert(searchInfo, function(err, data) {
                if (err) {
                    return err;
                }
                else {
                    console.log(data);
                }
            });

            //Close connection
            db.close();
        }
    });
    res.json(searchInfo);
});

//Mongo for last image searches
app.get('/api/latest', function (req, res) {
    searchInfo.test = "Get latest seaches and dates using mongoDB here";


    res.render('latest');
});


app.listen(app.get('port'), function() {
    console.log("Node app is running at localhost:" + app.get('port'))
});