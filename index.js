const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion } = require('mongodb');
const port = process.env.PORT || 5000;
require('dotenv').config();
const app = express();

//middlewaer 
app.use(cors({
   origin: ["http://localhost:5173"],
   credentials: true,
}));
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

// Filtering  Api Format::
// http://localhost:5000/api/v1/all-food-items
// http://localhost:5000/api/v1/all-food-items?category=vegetarian_or_vegan

// Sorting  Api Format::
// http://localhost:5000/api/v1/all-food-items
// http://localhost:5000/api/v1/all-food-items?sortField=price&sortOrder=asc/desc

// Paginations Api Format::
// http://localhost:5000/api/v1/all-food-items
// http://localhost:5000/api/v1/all-food-items?page=1&limit=10

app.get('/api/v1/all-food-items', async (req, res) => {
   try {
      const queryObj = {};
      const sortObj = {};
      // filtering
      const category = req.query?.category;
      // sorting
      const sortField = req.query?.sortField;
      const sortOrder = req.query?.sortOrder;
      // pagination
      const page = Number(req.query?.page);
      const limit = Number(req.query?.limit);
      const skip = (page - 1) * limit;

      // console.log(sortField, sortOrder);
      if (category) {
         queryObj.foodCategory = category;
      }
      if (sortField && sortOrder) {
         sortObj[sortField] = sortOrder;
      }

      const result = await allFoodConnection.find(queryObj).skip(skip).limit(limit).sort(sortObj).toArray();

      // count Data
      const total = await allFoodConnection.countDocuments()
      return res.send({
         total,result
      });
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