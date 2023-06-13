const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
// const jwt = require("jsonwebtoken");
const app = express();
const port = process.env.PORT || 4000;

//middleware
app.use(cors());
app.use(express.json());
