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

// My MiddleWares
const logger = async (req, res, next) => {
   console.log('Called: ', req.hostname, req.originalUrl);
   next();
}

// varify token
const verifyToken = async (req, res, next) => {

   // check if Cookie available
   const token = req.cookies?.token;
   // console.log('Token: ', token);
   if (!token) {
      return res.status(401).send({ message: 'UnAuthorized Access', code: 401 });
   }
   jwt.verify(token, process.env.ACCESS_TOKEN, (error, decode) => {
      if (error) {
         return res.status(401).send({ message: 'UnAuthorized Access', code: 401 });
      }
      req.user = decode;
      next();
   })

};


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
const orderedFoodConnection = client.db('HungryPalateDB').collection('OrderdFoods');

// JWT:: create Access Token
app.post('/jwt', logger, async (req, res) => {
   const user = req.body
   console.log(user);
   const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: '1h' })

   res
      .cookie('token', token, {
         httpOnly: true,
         secure: false,
      })
      .send({ Success: true });
})

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

app.post('/api/v1/add-foods', async (req, res) => {
   try {
      const addFoodData = req.body;
      console.log(addFoodData);
      const result = await allFoodConnection.insertOne(addFoodData)
      console.log(result);
      return res.send(result)
   } catch (error) {
      return res.send({ error: true, message: error.message });
   }
})

// get user specific Added foods data
app.get('/api/v1/user/user-added-food', verifyToken, async (req, res) => {
   try {
      const email = req.query.email;   
      let query = {};
      if (email) {
         query = { chefEmail: email }
      }
      const result = await allFoodConnection.find(query).toArray();
      console.log(email);
      return res.send(result);
   } catch (error) {
      return res.send({ error: true, message: error.message });
   }
})

//GET SINGLE Food data
app.get('/api/v1/foods/:id', verifyToken, async (req, res) => {
   try {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await allFoodConnection.findOne(query);
      res.send(result);
   } catch (error) {
      return res.send({ error: true, message: error.message });
   }
});

// Update Food data 
app.patch('/api/v1/user/update-food/:id', verifyToken, async (req, res) => {
   const id = req.params.id;
   const updateData = req.body;
   const filter = { _id: new ObjectId(id) } 
   const updatedProduct = { $set: updateData }
   const result = await allFoodConnection.updateOne(filter, updatedProduct);
   console.log(id);
   console.log(updateData);
   console.log(result);
   res.send(result);
});

//GET Categories Food data
app.get('/api/v1/food-category/:category', async (req, res) => {
   try {
      const sortObj = {};
      const queryObj = {};
      const category = req.params.category;
      const sortField = req.query?.sortField;      
      const sortOrder = req.query?.sortOrder;
      console.log(sortField, sortOrder);
      // Searching by name
      const searchField = req.query?.searchField    
      // pagination
      const page = Number(req.query?.page);
      const limit = Number(req.query?.limit);
      const skip = (page - 1) * limit;
   //   console.log(category);
     if (sortField && sortOrder) {
        sortObj[sortField] = sortOrder;
     }
     if (searchField) {
        queryObj.foodName = { $regex: searchField, $options: "i" };
        queryObj.foodCategory = { $regex: category, $options: "i" };
     } else {
        queryObj.foodCategory = { $regex: category, $options: "i" };
     }
   //   const query = { foodCategory: { $regex: category, $options: "i" } };
      const result = await allFoodConnection.find(queryObj).skip(skip).limit(limit).sort(sortObj).toArray();
      const queryResult = await allFoodConnection.find(queryObj).toArray();
      const totalQuerydata = queryResult.length;

      return res.send({
         result, totalQuerydata
      });
  } catch (error) {
     return res.send({ error: true, message: error.message });
  }
});

// Orderd Fooods api

// get user specific order data
app.get('/api/v1/user/orederd-food', verifyToken, async (req, res) => {
   const email = req.query.email;
   console.log(email);
   try {
      let query = {};
      if (email) {
         query = { customerEmail: email }
      }
      const result = await orderedFoodConnection.find(query).toArray();
      return res.send(result);
   } catch (error) {
      return res.send({ error: true, message: error.message });
   }
})


app.post('/api/v1/user/order-food', async (req, res) => {
   try {
      const orderdFoodData = req.body;
      const result = await orderedFoodConnection.insertOne(orderdFoodData)
      return res.send(result)
   } catch (error) {
      return res.send({ error: true, message: error.message });
   }
})

// Delete::  single Ordered food items
app.delete('/api/v1/user/delete-food/:orderedFoodId',  async (req, res) => {
   try {
      const id = req.params.orderedFoodId;
      console.log(id);
      const query = { _id: new ObjectId(id) };
      const result = await orderedFoodConnection.deleteOne(query)
      return res.send(result)
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