const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()

const app = express();
const port = process.env.PORT || 5000;

// middlewares
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.SECRET_USER}:${process.env.SECRET_PASSWORD}@cluster0.klqchh3.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).send({ message: 'unauthorized access' });
  }
  const token = authHeader.split(' ')[1];

  jwt.verify(token, process.env.SECRET_ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: 'Forbidden access' });
    }
    req.decoded = decoded;
    next();
  })
}

async function run() {
  try {
    const serviceCollection = client.db('justiceLawyer').collection('services');
    const reviewCollection = client.db('justiceLawyer').collection('reviews');
    const blogCollection = client.db('justiceLawyer').collection('blogs');

    app.post('/jwt', (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.SECRET_ACCESS_TOKEN, { expiresIn: '1d' })
      res.send({ token })
    })

    // services api
    app.get('/services', async (req, res) => {

      let query = {};
      const cursor = serviceCollection.find(query).sort({ "_id": -1 });
      const services = await cursor.toArray();
      res.send(services);
    });

    app.get('/services-limit', async (req, res) => {

      let query = {};
      const cursor = serviceCollection.find(query).sort({ "_id": -1 }).limit(3);
      const services = await cursor.toArray();
      res.send(services);
    });

    app.get('/services/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const service = await serviceCollection.findOne(query);
      res.send(service);
    });

    app.post('/services', verifyJWT, async (req, res) => {
      const service = req.body;
      const result = await serviceCollection.insertOne(service);
      res.send(result);
    })

    // reviews api
    app.get('/reviews', async (req, res) => {
      let query = {};
      if (req.query.uid) {
        query = {
          uid: req.query.uid
        }
      }
      const cursor = reviewCollection.find(query).sort({ "_id": -1 });
      const reviews = await cursor.toArray();
      res.send(reviews);
    });

    // reviews api
    app.post('/reviews', verifyJWT, async (req, res) => {
      const review = req.body;
      const result = await reviewCollection.insertOne(review);
      res.send(result);
    })

    app.get('/reviews/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const review = await reviewCollection.findOne(query);
      res.send(review);
    });

    app.patch('/reviews/:id', async (req, res) => {
      const id = req.params.id;
      const review = req.body.review;
      const query = { _id: ObjectId(id) }
      const updatedReview = {
        $set: {
          review: review
        }
      }
      const result = await reviewCollection.updateOne(query, updatedReview);
      res.send(result);
    })

    app.delete('/reviews/:id', verifyJWT, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await reviewCollection.deleteOne(query);
      res.send(result);
    })

    // blogs api
    app.get('/blogs', async (req, res) => {
      let query = {};
      const cursor = blogCollection.find(query).sort({ "_id": -1 });
      const blogs = await cursor.toArray();
      res.send(blogs);
    });

    app.get('/blogs-limit', async (req, res) => {

      let query = {};
      const cursor = blogCollection.find(query).sort({ "_id": -1 }).limit(3);
      const blogs = await cursor.toArray();
      res.send(blogs);
    });

    app.get('/blogs/:slug', async (req, res) => {
      const slug = req.params.slug;
      const query = { slug: slug };
      const service = await blogCollection.findOne(query);
      res.send(service);
    });
  }
  finally {

  }
}
run().catch(err => console.error(err));


app.get('/', (req, res) => {
  res.send('Justice lawyer server is running')
})

app.listen(port, () => {
  console.log(`Justice lawyer server running on ${port}`);
})