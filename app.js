import 'dotenv/config';
import express from "express";
import session from 'express-session';
import https from 'https';
import fs from 'fs';
import connectDB from './db.js'; 

import { shopifyAuthBegin, shopifyAuthCallback, getProducts, getOrders, getDraftOrders, getCustomers, handleShopifyWebhook  } from './Shopify.js'; 


const sslOptions = {
    key: fs.readFileSync('./SSL/privkey.pem'),
    cert: fs.readFileSync('./SSL/fullchain.pem')
};


const app = express();
const PORT = 5000;

connectDB();

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.post('/webhooks/orders-create', handleShopifyWebhook);



app.get('',(req,res)=>{
    res.send('Hello')
})

app.get('/auth/shopify',shopifyAuthBegin)
app.get('/auth/shopify/callback',shopifyAuthCallback)
app.get('/products', getProducts);
app.get('/orders', getOrders);
app.get('/do', getDraftOrders); 
app.get('/customers', getCustomers);


https.createServer(sslOptions, app).listen(PORT, () => {
    console.log(`Server is running on Port ${PORT}`);
});


