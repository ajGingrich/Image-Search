var express = require('express');
var path = require('path');
var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;

// Connection URL. This is where your mongodb server is running.
var url = process.env.MONGOLAB_URI;

var app = express();

var bingKey = process.env.bingKey;
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
    res.json(204);
});

var searchInfo = {};

//get new URL, add to database and send
app.get('/api/imagesearch/:id', function (req, res) {
    var search = req.params.id;
    var searchInfo = {};
    searchInfo.query = search;
    searchInfo.time = new Date();

    var skip = 0;
    if (req.query.offset !== undefined) {
        skip = (req.query.offset -1)*10;
    }
    var searchResults = [];

    Bing.images(search, {
        top: 10,
        skip: skip
    }, function(err, test, data) {
        if (err) throw err;
        for (var i=0; i<10; i++) {
            searchResults.push({name: data.value[i].name, img_url: data.value[i].contentUrl, page_url:data.value[i].hostPageUrl});
        }
        console.log(searchResults);
        res.json(searchResults);
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
                    //console.log(data);
                }
            });

            //Close connection
            db.close();
        }
    });
});

//Mongo for last image searches
app.get('/api/latest', function (req, res) {
    searchInfo.test = "Get latest seaches and dates using mongoDB here";

    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var collection = db.collection('imageSearch');
        collection.find().sort({ $natural: -1 }).limit(10).toArray(function(err, documents) {
            if (err) throw err;
            for (var i=0; i<documents.length; i++) {
                var x = documents[i];
                delete (x["_id"]);
            }
            res.json(documents);
            db.close()
        });
    });

});

app.listen(app.get('port'), function() {
    console.log("Node app is running at localhost:" + app.get('port'))
});