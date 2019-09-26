const express = require("express");
const bodyParser = require("body-parser");
import { MongoClient } from "mongodb";
import path from "path";

// import express from "express";
// import bodyParser from "body-parser";

const app = express();
//backend serving files from the build folder of front-end
app.use(express.static(path.join(__dirname, "/build")));
app.use(bodyParser.json());

const withDB = async (operations, res) => {
  try {
    const client = await MongoClient.connect("mongodb://localhost:27017", {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    const db = client.db("my-react-blog");
    //calling the operations function
    await operations(db);
    client.close();
  } catch (error) {
    res.status(500).json({ message: "Error connecting to db", error });
  }
};

//simple get route
app.get("/hello", (req, res) => res.send("Is Node better than PHP?"));

//get route for single name
app.get("/hello/:name", (req, res) => res.send(`Hello ${req.params.name}`));

//simple post route
app.post("/hello", (req, res) => res.send(`Hello ${req.body.name}!`));

//get route for all articles
app.get("/api/articles/:name", async (req, res) => {
  // calling the withDB function
  withDB(async db => {
    const articleName = req.params.name;
    const articleInfo = await db
      .collection("articles")
      .findOne({ name: articleName });
    res.status(200).json(articleInfo);
  }, res);
});

//route for upvoting using the database
app.post("/api/articles/:name/upvote", async (req, res) => {
  withDB(async db => {
    const articleName = req.params.name;
    const articleInfo = await db
      .collection("articles")
      .findOne({ name: articleName });

    await db.collection("articles").updateOne(
      { name: articleName },
      {
        $set: {
          upvotes: articleInfo.upvotes + 1
        }
      }
    );
    const updatedArticleInfo = await db
      .collection("articles")
      .findOne({ name: articleName });
    res.status(200).json(updatedArticleInfo);
  }, res);
});

//route for making comments
app.post("/api/articles/:name/add-comment", (req, res) => {
  const { username, text } = req.body;
  const articleName = req.params.name;

  withDB(async db => {
    const articleInfo = await db
      .collection("articles")
      .findOne({ name: articleName });
    await db.collection("articles").updateOne(
      { name: articleName },
      {
        $set: {
          comments: articleInfo.comments.concat({ username, text })
        }
      }
    );
    const updatedArticleInfo = await db
      .collection("articles")
      .findOne({ name: articleName });
    res.status(200).json(updatedArticleInfo);
  }, res);
});

// this route ensures that all uncaught api routes use this one!
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname + "/build/index.html"));
});
// I am listening to the server
app.listen(8000, () => console.log("Listening on port 8000"));
