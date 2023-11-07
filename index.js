const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion } = require('mongodb');
const port = process.env.PORT || 5000;
require('dotenv').config();
const app = express();

//middlewaer 
app.use(cors());
app.use(express.json());
app.use(cookieParser())




const uri = process.env.MONGO_DB_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
   serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
   }
});

async function run() {
   try {
      // Connect the client to the server	(optional starting in v4.7)
      client.connect();
      // Send a ping to confirm a successful connection
      client.db("admin").command({ ping: 1 });
      console.log("Pinged your deployment. You successfully connected to MongoDB!");
   } finally {
      // Ensures that the client will close when you finish/error
      // await client.close();
   }
}
run().catch(console.dir);


// Database connection
const categoryConnection = client.db('HungryPalateDB').collection('Categories');
const allFoodConnection = client.db('HungryPalateDB').collection('AllFoods');


//Categories:: Get all Categories 
app.get('/api/v1/categories', async (req, res) => {
   try {
      const result = await categoryConnection.find().toArray();
      return res.send(result);
   } catch (error) {
      return res.send({ error: true, message: error.message });
   }
})

// All Food:: All Foods Items
app.get('/api/v1/all-food-items', async (req, res) => {
   try {
      const result = await allFoodConnection.find().toArray();
      return res.send(result);
   } catch (error) {
      return res.send({ error: true, message: error.message });
   }
})


// Testing Server
app.get('/', async (req, res) => {
   res.send('Welcome to Hungry Palate')
});

app.listen(port, () => {
   console.log(`Server listening on port ${port}`);
});