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
    // await client.connect();

    const userCollection = client.db("melodineDB").collection("userDetails");
    const classCollcetion = client.db("melodineDB").collection("classDetails");

    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      if (user?.role !== "admin") {
        return res
          .status(403)
          .send({ error: true, message: "access forbidden" });
      }
      next();
    };

    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });

      res.send({ token });
    });

    // posting all users to database
    app.post("/allusers", async (req, res) => {
      const recievedUser = req.body;

      const query = { email: recievedUser.email };
      const existingUser = await userCollection.findOne(query);

      if (existingUser) {
        return res.send({ message: "user already exists" });
      }
      const result = await userCollection.insertOne(recievedUser);
      res.send(result);
    });

    app.get("/allusers/admin/:email", async (req, res) => {
      const email = req.params.email;

      const query = { email: email };
      const user = await userCollection.findOne(query);
      const result = { admin: user?.role === "admin" };
      res.send(result);
    });

    // class adding post method
    app.post("/allclasses", async (req, res) => {
      const recievedClass = req.body;

      const result = await classCollcetion.insertOne(recievedClass);
      res.send(result);
    });

    app.get("/allclasses", async (req, res) => {
      const result = await classCollcetion.find().toArray();
      res.send(result);
    });
    app.get("/allclasses/sendfeedback/:id", async (req, res) => {
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)};
      const result = await classCollcetion.find(filter).toArray();
      res.send(result);
    });

    app.get("/allusers", async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    
    // class approval update patch
    app.patch("/allclasses/approve/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };

      const updateDoc = {
        $set: {
          status: "approved",
        },
      };
      const result = await classCollcetion.updateOne(filter, updateDoc);
      res.send(result);
    });
    // class denied update patch
    app.patch("/allclasses/deny/:id", async (req, res) => {
      const id = req.params.id;
      
      const filter = { _id: new ObjectId(id) };

      const updateDoc = {
        $set: {
          status: "denied",
        },
      };
      const result = await classCollcetion.updateOne(filter, updateDoc);
      res.send(result);
    });

      app.patch("/allclasses/feedback/:id", async (req, res) => {
        const id = req.params.id;
        const newFeed = req.body.feedback;
        console.log(newFeed)
        const filter = { _id: new ObjectId(id) };
        // this option instructs the method to create a document if no documents match the filter
        const options = { upsert: true };
        const updateDoc = {
          $set: {
            feedback: newFeed,
          },
        };
        const result = await classCollcetion.updateOne(filter, updateDoc, options);
        res.send(result);
      });



    // updating the users to admin to instructor
    app.patch("/allusers/admin/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };

      const updateDoc = {
        $set: {
          role: "admin",
        },
      };
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // instructor
    app.patch("/allusers/instructor/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      // this option instructs the method to create a document if no documents match the filter

      const updateDoc = {
        $set: {
          role: "instructor",
        },
      };
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

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

app.get("/", (req, res) => {
  res.send("Summer camp server running");
});

app.listen(port, () => {
  console.log(`Summer camp server is running on ${port}`);
});
