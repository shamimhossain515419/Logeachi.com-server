const express = require('express')
const cors = require('cors')
const app = express();
var jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;
app.use(cors())

app.use(express.json());










const verifyJWT = (req, res, next) => {
     const authorization = req.headers.authorization;
     if (!authorization) {
          return res.status(401).send({ error: true, message: 'unauthorized access' });
     }
     // bearer token
     const token = authorization.split(' ')[1];

     jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
          if (err) {
               return res.status(401).send({ error: true, message: 'unauthorized access' })
          }
          req.decoded = decoded;
          next();
     })
}



const uri = `mongodb+srv://${process.env.USER}:${process.env.PASSWORD}@cluster0.jt15atw.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
     serverApi: {
          version: ServerApiVersion.v1,
          strict: true,
          deprecationErrors: true,
     }
});

async function run() {

     // Connect the client to the server	(optional starting in v4.7)

     const ProductCollection = client.db('Logeachi').collection('product');
     const WishlistCollection = client.db('Logeachi').collection('wishlist');
     const addcardCollection = client.db('Logeachi').collection('addcard');
     const CategoryCollection = client.db('Logeachi').collection('category');
     const UsersCollection = client.db('Logeachi').collection('users');



     // Users relate api 

     app.post('/users', async (req, res) => {
          const body = req.body;
          const result = await UsersCollection.insertOne(body);
          res.send(result);
     })

     app.get('/users', async (req, res) => {
          const query = { email: req.query?.email };
          const result = await UsersCollection.findOne(query);
          res.send(result)
     })

     app.post('/jwt', (req, res) => {
          const user = req.body;
          const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '10d' })

          res.send({ token })
     })
     app.get('/product', async (req, res) => {
          const result = await ProductCollection.find().toArray();
          res.send(result);
     })
     app.get('/product/:id', async (req, res) => {
          const query = { _id: new ObjectId(req.params?.id) };
          const result = await ProductCollection.findOne(query);
          res.send(result)
     })
     app.get('/product', async (req, res) => {
          const query = { category: req.query?.category };
          const result = await ProdjuctCollection.find(query).toArray();
          res.send(result)
     })

     //  wish lsit  Related API

     app.post('/product/wishlist',verifyJWT, async (req, res) => {
          const { wishList } = req.body;
          console.log(wishList);
          const result = await WishlistCollection.insertOne(wishList);
          res.send(result)
     })

     app.get('/product/wishlist/:email', verifyJWT, async (req, res) => {
          const query = { email: req.params.email };

          const result = await WishlistCollection.find(query).toArray();
          res.send(result);
     })

     app.delete('/product/wishlist/:id', verifyJWT, async (req, res) => {
          const query = { _id: new ObjectId(req.params.id) };
          console.log(query);
          const result = await WishlistCollection.deleteOne(query);
          res.send(result);
     })
     // add card Collection 
     app.post('/product/addcard', verifyJWT, async (req, res) => {
          const { addcard } = req.body;
          const result = await addcardCollection.insertOne(addcard);
          res.send(result)
     })

     app.delete('/product/addcard/:id', verifyJWT, async (req, res) => {
          const query = { _id: new ObjectId(req.params.id) };
          const result = await addcardCollection.deleteOne(query);
          res.send(result);
     })

     app.get('/product/addcard/:email', verifyJWT, async (req, res) => {
          const query = { email: req.params.email };
          const result = await addcardCollection.find(query).toArray();
          res.send(result);
     })

     // category Related api 

     app.get('/category', async (req, res) => {
          const result = await CategoryCollection.find().toArray();
          res.send(result);
     })

     // Send a ping to confirm a successful connection
     await client.db("admin").command({ ping: 1 });
     console.log("Pinged your deployment. You successfully connected to MongoDB!");

}
run().catch(console.dir);









app.get('/', (req, res) => {
     res.send('Hello World!')
})

app.listen(port, () => {
     console.log(`Example app listening on port ${port}`)
})
