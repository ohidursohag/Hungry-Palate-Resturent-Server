const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;
require('dotenv').config();
const app = express();

//middlewaer 
app.use(cors({
   origin: [
      "http://localhost:5173",
      "https://hungry-palate.web.app",
      'https://hungry-palate.firebaseapp.com'],
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

// Search Api Format::
// http://localhost:5000/api/v1/all-food-items
// http://localhost:5000/api/v1/all-food-items?searchField=Grilled 

app.get('/api/v1/all-food-items', async (req, res) => {
   try {
      let queryObj = {};
      const sortObj = {};
      // const searchObj = {};
      // filtering
      const category = req.query?.category;
      // sorting
      const sortField = req.query?.sortField;
      const sortOrder = req.query?.sortOrder;
      // pagination
      const page = Number(req.query?.page);
      const limit = Number(req.query?.limit);
      const skip = (page - 1) * limit;
      // Searching by name
      const searchField = req.query?.searchField

      // console.log(sortField, sortOrder);
      if (category) {
         queryObj.foodCategory = category;
      }
      if (sortField && sortOrder) {
         sortObj[sortField] = sortOrder;
      }
      if (searchField) {
         queryObj.foodName = { $regex: searchField, $options: "i" }
         // queryObj.foodCategory = '';
      }

      const result = await allFoodConnection.find(queryObj).skip(skip).limit(limit).sort(sortObj).toArray();

      const queryResult = await allFoodConnection.find(queryObj).toArray();
      const totalQuerydata = queryResult.length;
      // count Data     
      const total = await allFoodConnection.countDocuments()
      console.log(total);
      console.log(totalQuerydata);
      return res.send({
         total, result, totalQuerydata
      });     
   } catch (error) {
      return res.send({ error: true, message: error.message });
   }
})

//GET SINGLE Food data
app.get('/api/v1/foods/:id', async (req, res) => {
   const id = req.params.id;
   const query = { _id: new ObjectId(id) };
   const result = await allFoodConnection.findOne(query);
   res.send(result);
});

//GET Categories Food data
app.get('/api/v1/food-category/:category', async (req, res) => {
   const category = req.params.category;
   console.log(category);
   const query = { foodCategory: { $regex: category, $options: "i" } };
   const result = await allFoodConnection.find(query).toArray();
   res.send(result);
});

// Testing Server
app.get('/', async (req, res) => {
   res.send('Welcome to Hungry Palate')
});

app.listen(port, () => {
   console.log(`Server listening on port ${port}`);
});