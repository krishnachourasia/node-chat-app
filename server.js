var express = require('express')
let bodyParser = require('body-parser')
let app = express()
let http = require('http').Server(app)
let io = require('socket.io')(http)
MongoClient = require('mongodb').MongoClient

let dbUrl = `mongodb://localhost:27017/`


app.use(express.static(__dirname))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))

const withDB = async (operations, res) => {
    try {

        MongoClient.connect(dbUrl, {useNewUrlParser: true, useUnifiedTopology: true}, async function (error, client) {
            if (error)
                throw error;

            var db = client.db('my-blog');

            await operations(db)

            client.close();

        })
    } catch (error) {
        res.status(500).json({message: `Error connecting to db`, error});
    }
}


app.get("/messages", async (request, response) => {
    withDB(async (db) => {

        const messages = await db.collection(`chat`).find({}).toArray();
        console.log(messages)
        response.status(200).json(messages);
    }, response)

    // response.send(messages)
})

app.post("/messages", async (request, response) => {
    let message = request.body

    withDB(async (db) => {
        await db.collection('chat').insertOne(message);
        console.log("1 record inserted");
        io.emit('message', request.body)
        response.status(200).json(message);
    }, response);

})

io.on('connection', (socket) => {
    console.log("a user connected!")
})


let server = http.listen(3000, () => {
    console.log("server is listening on the port ", server.address().port)
})