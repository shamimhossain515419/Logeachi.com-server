const express = require('express')
const cors = require('cors')
const app = express();
var jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;
app.use(cors())

app.use(express.json());


const SSLCommerzPayment = require('sslcommerz-lts')
const store_id = process.env.store_id
const store_passwd = process.env.store_passwd
const is_live = false





console.log(store_id);
console.log(store_passwd);

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
     const addressCollection = client.db('Logeachi').collection('address');
     const OrdersCollection = client.db('Logeachi').collection('orders');




     // Users relate api 

     app.post('/users', async (req, res) => {
          const body = req.body;
          const query = { email: body?.email };
          const result = await UsersCollection.findOne(query);

          if (result) {
               res.send({ massage: "user allReady execute" });
          } else {

          }
          const data = await UsersCollection.insertOne(body);
          res.send(data);
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
     //  Product releted API

     app.get('/product', async (req, res) => {
          const params = req.query;

          const minPrice = 0;
          const maxPrice = 1000;

          const minprice = parseInt(params?.minprice);
          const maxprice = parseInt(params?.maxprice);
          console.log(params);
          const result = await ProductCollection.find({
               "$or": [

                    { category: { $regex: params?.category, $options: 'i' } },
                    { name: { $regex: params?.name, $options: 'i' } },
               ],
               price: { $gte: minprice ? minprice : minPrice, $lte: maxprice ? maxprice : maxPrice }
          }).toArray();

          // Display the search results
          res.send(result);
     })
     app.get('/product/:id', async (req, res) => {
          const query = { _id: new ObjectId(req.params?.id) };
          const result = await ProductCollection.findOne(query);
          res.send(result)
     })
     app.get('/product', async (req, res) => {
          const query = { category: req.query?.category };
          const result = await ProductCollection.find(query).toArray();
          res.send(result)
     })

     app.get('/product/category/:category', async (req, res) => {
          const category = req.params.category;
          const query = { category: category }
          const result = await ProductCollection.find(query).toArray();
          res.send(result)
     })



     app.post('/product/wishlist', verifyJWT, async (req, res) => {
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

     //  address related api 



     app.post('/address', verifyJWT, async (req, res) => {
          const addressData = req?.body;
          console.log(addressData,);
          const result = await addressCollection.insertOne(addressData)
          res.send(result)
     })


     app.get('/address', async (req, res) => {
          const email = req.query?.email;
          const result = await addressCollection.findOne({ email })
          res.send(result);
     })

     // payment related api 



     const tran_id = new ObjectId().toString();

     app.post('/payment', verifyJWT, async (req, res) => {

          const item = req.body;


          item.productId = new ObjectId(item.productId);
          item.userId = new ObjectId(item.userId);
          item.createdAt = new Date();
          const data = {


               total_amount: item?.price,
               currency: 'BDT',
               tran_id: tran_id, // use unique tran_id for each api call

               success_url: `https://logeachi-com-server.vercel.app/payment/success/${tran_id}`,
               fail_url: `https://logeachi-com-server.vercel.app/payment/fail/${tran_id}`,
               cancel_url: 'https://logeachi-com-server.vercel.app/cancel',
               ipn_url: 'https://logeachi-com-server.vercel.app/ipn',
               shipping_method: 'Courier',
               product_name: item?.ProductName,
               product_category: 'Electronic',
               product_profile: 'general',
               cus_name: item?.name,
               cus_email: item?.email,
               cus_add1: item?.address,
               cus_add2: 'Dhaka',
               cus_city: 'Dhaka',
               cus_state: 'Dhaka',
               cus_postcode: '1000',
               cus_country: 'Bangladesh',
               cus_phone: '01711111111',
               cus_fax: '01711111111',
               ship_name: item?.name,
               ship_add1: 'Dhaka',
               ship_add2: 'Dhaka',
               ship_city: 'Dhaka',
               ship_state: 'Dhaka',
               ship_postcode: 5800,
               ship_country: item?.country ? item?.country : "bangladesh",
          };

          const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live)
          sslcz.init(data).then(apiResponse => {
               // Redirect the user to payment gateway
               let GatewayPageURL = apiResponse.GatewayPageURL;

               item.tranjectionId = tran_id
               item.paidStatus = false
               const result = OrdersCollection.insertOne(item);
               res.send(GatewayPageURL)
               console.log('Redirecting to: ', GatewayPageURL)
          });
          console.log(item);

          app.post('/payment/success/:tranID', async (req, res) => {
               console.log("shdfdfad");
               console.log(req.params.tranID);
               const data = await OrdersCollection.findOne({ tranjectionId: req.params.tranID });

               const result = await OrdersCollection.updateOne(
                    { tranjectionId: req.params.tranID }, {
                    $set: {
                         paidStatus: true
                    }
               });
               const deleteCard = await addcardCollection.deleteOne({ _id: new ObjectId(data?.cardId) });
               console.log(deleteCard);
               console.log(result);

               if (result.matchedCount > 0 && deleteCard?.deletedCount > 0) {
                    res.redirect(`https://logecgi-com.vercel.app/payment/success/${req.params.tranID}`)
               }
          })

          app.post('/payment/fail/:tranID', async (req, res) => {


               const result = await OrdersCollection.deleteOne(
                    { tranjectionId: req.params.tranID })

               if (result.deletedCount > 0) {
                    res.redirect(`https://logecgi-com.vercel.app/paymentfail/fail/${req.params.tranID}`)
               }
          })

     })


     //   oder related api ?


     app.get('/orders', async (req, res) => {

          const orderDetails = await OrdersCollection.aggregate([
               {
                    $match: { email: req?.query?.email }
               },
               {
                    $lookup: {
                         from: 'users',
                         localField: 'userId',
                         foreignField: '_id',
                         as: 'user'
                    }
               },
               {
                    $lookup: {
                         from: 'product',
                         localField: 'productId',
                         foreignField: '_id',
                         as: 'product'
                    }
               }
          ]).toArray();
          console.log(orderDetails);
          res.send(orderDetails)

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
