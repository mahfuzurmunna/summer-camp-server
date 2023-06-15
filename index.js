const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const jwt = require("jsonwebtoken");
// const jwt = require("jsonwebtoken");
const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res
      .status(401)
      .send({ error: true, message: "unauthorized access" });
  }
  // bearer token
  const token = authorization.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res
        .status(401)
        .send({ error: true, message: "unauthorized access" });
    }
    req.decoded = decoded;
    next();
  });
};



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rk10a10.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const userCollection = client.db('melodineDB').collection('userDetails');

    app.post('/allusers', async (req,res)=> {
      const recievedUser = req.body;
 
      const query = {email: recievedUser.email}
      const existingUser = await userCollection.findOne(query);
  
      if(existingUser) {
        return res.send({message: 'user already exists'})
      }
      const result = await userCollection.insertOne(recievedUser);
      res.send(result);
    })

    app.get('/allusers', async(req,res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    })





    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);




app.get('/', (req,res)=> {
  res.send('Summer camp server running')
})

app.listen(port , () => {
  console.log(`Summer camp server is running on ${port}`);
})