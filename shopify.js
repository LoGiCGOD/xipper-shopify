import '@shopify/shopify-api/adapters/node';
import { shopifyApi, LATEST_API_VERSION } from '@shopify/shopify-api';
import 'dotenv/config';
import { Product, Order, DraftOrder } from './models.js';


const apiKey = process.env.SHOPIFY_API_KEY;
const apiSecretKey = process.env.SHOPIFY_API_SECRET;
const shop = 'newteststore098';

const shopify = shopifyApi({
  apiKey: apiKey,
  apiSecretKey: apiSecretKey,
  scopes: ['read_products', 'read_orders', 'read_draft_orders', 'read_customers', 'read_fulfillments'],
  hostName: 'localhost:5000',
  hostScheme: 'https',
  apiVersion: LATEST_API_VERSION,
  webhooks: {
    orders_create: '/webhooks/orders-create',
  },
});



const shopifyAuthBegin = async (req, res, next) => {
  try {
      await shopify.auth.begin({
          shop: `${shop}.myshopify.com`,
          callbackPath: '/auth/shopify/callback',
          isOnline: true,
          rawRequest: req,
          rawResponse: res,
      });
  } catch (error) {
      console.error('Failed to initiate authentication', error);
      res.status(500).send('Failed to initiate authentication');
  }
};

const shopifyAuthCallback = async (req, res, next) => {
  try {
      const { session } = await shopify.auth.callback({
          rawRequest: req,
          rawResponse: res,
      });
      console.log('Shopify Session:', session);
      req.session.shopifySession = session;
      res.redirect('/');
  } catch (error) {
      console.error('Authentication failed', error);
      res.status(500).send('Authentication failed');
  }
};

const handleShopifyWebhook = async (req, res) => {
  try {
    const { headers, body } = req;

    console.log('Received Shopify Webhook:', body);

    if (headers['x-shopify-topic'] === 'orders/create') {
      const { shop, order } = body;
      console.log(`New order created: ${order.name}`);
      
      await Order.create(order); 
    }

    res.status(200).send('Webhook received');
  } catch (error) {
    console.error('Error processing webhook', error);
    res.status(500).send('Error processing webhook');
  }
};


const getProducts = async (req, res) => {
  try {
    const session = req.session.shopifySession;
    if (!session) {
      return res.status(401).send('Session not found. Please authenticate first.');
    }

    const restClient = new shopify.clients.Rest({ session });
    const products = await restClient.get({ path: 'products' });

    
    // const filteredProducts = products.body.products.map(product => ({
    //   id: product.id,
    //   title: product.title,
    //   vendor: product.vendor,
    //   product_type: product.product_type,
    //   created_at: product.created_at,
    //   handle: product.handle,
    //   status: product.status,
    //   variants: product.variants.map(variant => ({
    //     price: variant.price,
    //     grams: variant.grams,
    //     weight: variant.weight,
    //     weight_unit: variant.weight_unit,
    //     inventory_quantity: variant.inventory_quantity
    //   }))
    // }));

    
    await Product.insertMany(products);
    // console.log(products)

    res.json(products);
  } catch (error) {
    console.error('Failed to fetch or store products', error);
    res.status(500).send('Failed to fetch or store products');
  }
};


const getOrders = async (req, res) => {
  try {
    const session = req.session.shopifySession;
    if (!session) {
      return res.status(401).send('Session not found. Please authenticate first.');
    }

    const restClient = new shopify.clients.Rest({ session });
    const orders = await restClient.get({ path: 'orders', query: { status: 'any' } });

    // const filteredOrders = orders.body.orders.map(order => {
      // return {
      //   id: order.id,
      //   app_id: order.app_id,
      //   cancel_reason: order.cancel_reason,
      //   cancelled_at: order.cancelled_at,
      //   currency: order.currency,
      //   current_subtotal_price: order.current_subtotal_price_set.shop_money.amount,
      //   current_total_price: order.current_total_price_set.shop_money.amount,
      //   current_total_tax: order.current_total_tax_set.shop_money.amount,
      //   number: order.number,
      //   order_number: order.order_number,
      //   line_items_titles: order.line_items.map(item => item.title).join(', '),
      //   tracking_company: order.fulfillments.length > 0 ? order.fulfillments[0].tracking_company : null,
      //   tracking_number: order.fulfillments.length > 0 ? order.fulfillments[0].tracking_number : null,
      //   tracking_url: order.fulfillments.length > 0 ? order.fulfillments[0].tracking_url : null
      // };
    // });

    await Order.insertMany(orders.body.orders);

    res.json(orders.body.orders);
  } catch (error) {
    console.error('Failed to fetch or store orders', error);
    res.status(500).send('Failed to fetch or store orders');
  }
};


const getDraftOrders = async (req, res) => {
  try {
    const session = req.session.shopifySession;
    if (!session) {
      return res.status(401).send('Session not found. Please authenticate first.');
    }

    const restClient = new shopify.clients.Rest({ session });
    const draftOrdersResponse = await restClient.get({ path: 'draft_orders' });

    console.log('Raw Draft Orders Response:', JSON.stringify(draftOrdersResponse.body.draft_orders, null, 2));

    const filteredDraftOrders = draftOrdersResponse.body.draft_orders.map(draftOrder => {
      const paymentTerms = draftOrder.payment_terms || {};
      const lineItem = draftOrder.line_items[0] || {};

      return {
        id: draftOrder.id,
        email: draftOrder.email,
        currency: draftOrder.currency,
        invoice_sent_at: draftOrder.invoice_sent_at,
        created_at: draftOrder.created_at,
        tax_exempt: draftOrder.tax_exempt,
        name: draftOrder.name,
        status: draftOrder.status,
        variant_id: lineItem.variant_id || null,
        product_id: lineItem.product_id || null,
        title: lineItem.title || '',
        sku: lineItem.sku || 'N/A', // Provide a default value if sku is missing
        vendor: lineItem.vendor || '',
        quantity: lineItem.quantity || 0,
        grams: lineItem.grams || 0,
        tags: draftOrder.tags,
        total_price: draftOrder.total_price,
        subtotal_price: draftOrder.subtotal_price,
        total_tax: draftOrder.total_tax,
        payment_terms_name: paymentTerms.payment_terms_name || 'N/A', // Default value if payment_terms_name is missing
        payment_terms_type: paymentTerms.payment_terms_type || 'N/A', // Default value if payment_terms_type is missing
        due_in_days: paymentTerms.due_in_days || null
      };
    });

    await DraftOrder.insertMany(filteredDraftOrders);

    res.json(filteredDraftOrders);
  } catch (error) {
    console.error('Failed to fetch or store draft orders', error);
    res.status(500).send('Failed to fetch or store draft orders');
  }
};


export { shopifyAuthBegin, shopifyAuthCallback, getProducts, getOrders, getDraftOrders, handleShopifyWebhook,getCustomers };



// const getDraftOrders = async (req, res) => {
//   try {
//     const session = req.session.shopifySession;
//     console.log('session:', session);
//     if (!session) {
//       return res.status(401).send('Session not found. Please authenticate first.');
//     }
//     const restClient = new shopify.clients.Rest({ session });
//     const draftOrders = await restClient.get({ path: 'draft_orders' });
//     res.json(draftOrders.body.draft_orders);
//   } catch (error) {
//     console.error('Failed to fetch draft orders', error);
//     res.status(500).send('Failed to fetch draft orders');
//   }
// };


const getCustomers = async (req, res) => {
  try {
    const session = req.session.shopifySession; 
    console.log('session:',session)
    if (!session) {
        return res.status(401).send('Session not found. Please authenticate first.');
    }
    const restClient = new shopify.clients.Rest({ session });
    const customers = await restClient.get({ path: 'customers' });
    res.json(customers.body.customers);
  } catch (error) {
    console.error('Failed to fetch customers', error);
    res.status(500).send('Failed to fetch customers');
  }
};


const getPurchaseOrders = async (req, res) => {
  try {
    const session = req.session.shopifySession;
    if (!session) {
      return res.status(401).send('Session not found. Please authenticate first.');
    }

    const orderNames = req.query.order_names;
    if (!orderNames || orderNames.length === 0) {
      return res.status(400).send('Order names are required.');
    }

    const restClient = new shopify.clients.Rest({ session });
    const ordersResponse = await restClient.get({ path: 'orders' });
    const orders = ordersResponse.body.orders;

    let ordersWithTracking = [];

    console.log('Order Names:', orderNames); // Log the order names from the request
    console.log('Orders from Shopify:', orders.map(order => order.name)); // Log the order names from Shopify

    for (const orderName of orderNames) {
      const order = orders.find(order => order.name === orderName);

      if (order) {
        console.log('Found Order:', orderName); // Log found orders

        let trackingNumbers = [];
        if (order.fulfillments && order.fulfillments.length > 0) {
          trackingNumbers = order.fulfillments.flatMap(fulfillment => fulfillment.tracking_numbers);
        }

        ordersWithTracking.push({
          order,
          tracking_numbers: trackingNumbers
        });
      } else {
        console.log('Order Not Found:', orderName); // Log orders not found
      }
    }

    res.json({
      orders_with_tracking: ordersWithTracking,
      message: 'Successfully retrieved the purchase orders with tracking numbers',
      success: true
    });
  } catch (error) {
    console.error('Failed to fetch purchase orders with tracking numbers', error);
    res.status(500).send('Failed to fetch purchase orders with tracking numbers');
  }
};








