const express = require('express');
const router = express.Router();
require('dotenv').config()
const bcrypt = require('bcryptjs')
const jwt = require("jsonwebtoken");
const jwtString = process.env.JWT_STRING

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

let nextProductId = 0;
router.get('/addProduct', (req, res, next) => {
  new Product({ ourId: '' + nextProductId, name: 'widget', price: 3.95 })
    .save()
    .then(result => {
      nextProductId++
      console.log('saved product to database')
      res.redirect('/')
    })
    .catch(err => {
      console.log('failed to addAproduct: ' + err)
      res.redirect('/')
    })
})

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

router.get('/signin', async (req, res, next) => {
  let theUser = {}
  for (let ii = 0; ii < users.length; ii++) {
    if (req.query.email.trim() == users[ii].userEmail) {
      theUser.password = users[ii].password
      theUser.userEmail = users[ii].userEmail
      theUser.cardId = users[ii].cardId
    }
  }

  let checkPass = false
  try {
    checkPass = await bcrypt.compare(req.query.pass.trim() + process.env.EXTRA_BCRYPT_STRING, users[0].password)
  } catch (err) {
    console.log('bcrypt.compare err: ' + err)
    res.send({ success: false })
    return
  }
  if (!checkPass) {
    res.send({ success: false })
    return
  }
  req.session.isLoggedIn = true
  req.session.theUser = theUser
  res.send({ success: true, login: true })
})

const users = []
router.get('/signup', (req, res, next) => {
  // console.log(req.body.testData)
  const userEmail = req.query.email.trim()
  let password = req.query.pass.trim()
  // do lots of checking / validation
  password = bcrypt.hashSync(password + process.env.EXTRA_BCRYPT_STRING, 12),
    users.push({ userEmail: userEmail, password: password, cartId: 1 })
  console.log('users: ', users)
  res.send({ success: true })
})

router.get('/signout', (req, res, next) => {
  let loggedIn = req.session.isLoggedIn
  req.session.isLoggedIn = false
  res.send('done: ' + loggedIn)
})

exports.routes = router
