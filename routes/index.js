/*
1. Use jwt with expiry when issuing tokens for authentication include an expiry time to limit token valididty ,
2. HTTPS Secure Cookies: Set the "secure" flag for cookies to ensure they are only sent over HTTPS connections.
3. Secure Session Management: Store session data securely, preferably using server-side sessions or encrypted cookies.
4. USE https
5. Password Hashing: Ensure strong password hashing using bcrypt or a similar algorithm with an appropriate salt and iteration count.
*/


const express = require('express');
const router = express.Router();
require('dotenv').config()
const bcrypt = require('bcryptjs')
const jwt = require("jsonwebtoken");
const jwtString = process.env.JWT_STRING
const extraBcryptString = process.env.EXTRA_BCRYPT_STRING

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const productSchema = new Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  ourId: { type: String, required: true },
  anArray: { type: Array, required: false },
  anObject: { type: Object, required: false }
})

const Product = mongoose.model('Product', productSchema) // 'Product' refers to the collection, so maps products collection to productSchema; see lecture notes

const userSchema = new Schema({
  email: { type: String, required: true },
  pass: { type: String, required: true }, // Change the type to String
  hashedpass: { type: String, required: true }, // Change the type to String
});

const User = mongoose.model('Users', userSchema) // 'Product' refers to the collection, so maps products collection to productSchema; see lecture notes


let nextProductId = 0;
router.get('/addProduct', (req, res, next) => {
  const { name, price } = req.query;

  // Generate a unique productId 
  const productId = nextProductId++;

  // Create a new Product object with the provided name, price, and productId
  const newProduct = new Product({
    name: name,
    price: parseFloat(price), // Parse the price to a float
    ourId: productId.toString(), // Convert productId to string
  });

  // Save the new product to the database
  newProduct.save()
    .then(result => {
      console.log('Saved product to database:', result);
      res.json({ success: true, message: 'Product added successfully' });
    })
    .catch(err => {
      console.error('Failed to add product:', err);
      res.status(500).json({ success: false, message: 'Failed to add product' });
    });
});

router.get('/', (req, res, next) => {
  Product.find() // Always returns an array
    .then(products => {
      res.json({ 'All the Products': products })
    })
    .catch(err => {
      console.log('Failed to find: ' + err)
      res.json({ 'Products': [] })
    })
})

router.post('/', (req, res, next) => {
  console.log(req.body.testData)
  Product.find() // Always returns an array
    .then(products => {
      res.json({ 'POST Mongoose Products': products })
    })
    .catch(err => {
      console.log('Failed to find: ' + err)
      res.json({ 'Products': [] })
    })
})

// GET route to fetch all products
router.get('/getAllProducts', async (req, res) => {
  try {
    // Fetch all products from the Products collection
    const products = await Product.find();
    res.json({ success: true, products: products });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch products' });
  }
});

router.get('/showUserEmails', async (req, res) =>{
  try{
    const users = await User.find({}, 'email');
    // Extract email addresses from the users and return them
    const emails = users.map(user => user.email);
    res.json({ success: true, emails: emails });
  }catch(error){
    console.error('Error fetching products:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch products' });
  }
})

router.get('/getSpecificProduct', (req, res, next) => {
  Product.find({ ourId: '1' }) // Always returns an array
    .then(products => {
      res.send('getSpecificProduct: ' + JSON.stringify(products[0])) // Return the first one found
    })
    .catch(err => {
      console.log('Failed to find product: ' + err)
      res.send('No product found')
    })
})

router.get('/updateSpecificProduct', (req, res, next) => {
  Product.find({ ourId: '1' }) // Always returns an array
    .then(products => {
      let specificProduct = products[0] // pick the first match
      specificProduct.price = 99.95
      specificProduct.save() // Should check for errors here too
      res.redirect('/')
    })
    .catch(err => {
      console.log('Failed to find product: ' + err)
      res.send('No product found')
    })
})

router.get('/deleteSpecificProduct', (req, res, next) => {
  if (!req.session.loggedIn) {
    res.send({ success: false })
  }

  Product.findOneAndRemove({ ourId: '0' })
    .then(resp => {
      res.send({ success: true })
    })
    .catch(err => {
      console.log('Failed to find product: ' + err)
      res.send({ success: false })
    })
})

// Serve sign-up page
router.get('/signup', async (req, res) => {
  const { email, pass } = req.query;

  // Check if email and pass are provided
  if (!email || !pass) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  try {
    // Hash the password using bcrypt
    const hashedPass = await bcrypt.hash(pass, 12);

    // Create a new User object with email, hashed password, and cartId
    const newUser = new User({
      email: email,
      pass: pass,
      hashedpass: hashedPass, // Make sure hashed password is saved
    });

    // Save the new user to the Users collection
    await newUser.save();

    res.json({ success: true, message: 'User signed up successfully' });
  } catch (error) {
    console.error('Error signing up user:', error);
    res.status(500).json({ success: false, message: 'Failed to sign up user' });
  }
});


// Serve sign-in page


// Handle sign-in form submission
router.get('/signin', async (req, res, next) => {
  const { email, pass, } = req.query;

  try {
    // Find the user by email
    const user = await User.findOne({ email });

    if (!user) {
      // User not found
      console.log('User not found');
      return res.send({ success: false, message: 'User not found' });
    }

    // Compare the provided password with the hashed password in the database
    console.log('User found. Hashed pass:', user.hashedpass);
    const isValidPassword = await bcrypt.compare(pass,user.hashedpass);

    if (isValidPassword) {
      // Password is correct, set session parameters
      req.session.isLoggedIn = true;
      req.session.loggedInUser = user;
      console.log('Login successful');
      return res.send({ success: true, message: 'Login successful' });
    } else {
      // Invalid password
      console.log('Invalid password');
      return res.send({ success: false, message: 'Invalid password' });
    }
  } catch (error) {
    console.error('Error signing in:', error);
    return res.status(500).send({ success: false, message: 'Failed to sign in' });
  }
});



// Handle sign-out
router.get('/signout', (req, res, next) => {
  req.session.isLoggedIn = false;
  delete req.session.loggedInUser;
  res.send({ success: true, message: 'Logged out successfully' });
});

exports.routes = router

// make a crud app with delete cretae and edit products and then a 
//sign up and sign in options using bcrypt save everyhting to mongo atals 
