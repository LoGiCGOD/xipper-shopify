// models.js
import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    id: { type: Number, required: true },
    title: { type: String, required: true },
    vendor: { type: String },
    product_type: { type: String },
    created_at: { type: Date },
    handle: { type: String },
    status: { type: String },
    variants: [{
        price: { type: String },
        grams: { type: Number },
        weight: { type: Number },
        weight_unit: { type: String },
        inventory_quantity: { type: Number }
    }]
}, { timestamps: true });

const orderSchema = new mongoose.Schema({
    id: { type: Number, required: true },
    app_id: { type: Number, required: true },
    cancel_reason: { type: String },
    cancelled_at: { type: Date },
    currency: { type: String, required: true },
    current_subtotal_price: { type: String, required: true },
    current_total_price: { type: String, required: true },
    current_total_tax: { type: String, required: true },
    number: { type: Number, required: true },
    order_number: { type: Number, required: true },
    line_items_titles: { type: String },
    tracking_company: { type: String },
    tracking_number: { type: String },
    tracking_url: { type: String }
}, { timestamps: true });

const draftOrderSchema = new mongoose.Schema({
    id: { type: Number, required: true },
    email: { type: String, default: null },
    currency: { type: String, required: true },
    invoice_sent_at: { type: Date, default: null },
    created_at: { type: Date, required: true },
    tax_exempt: { type: Boolean, required: true },
    name: { type: String, required: true },
    status: { type: String, required: true },
    variant_id: { type: Number, required: true },
    product_id: { type: Number, required: true },
    title: { type: String, required: true },
    sku: { type: String, required: true },
    vendor: { type: String, required: true },
    quantity: { type: Number, required: true },
    grams: { type: Number, required: true },
    tags: { type: String, default: '' },
    total_price: { type: String, required: true },
    subtotal_price: { type: String, required: true },
    total_tax: { type: String, required: true },
    payment_terms_name: { type: String, required: true },
    payment_terms_type: { type: String, required: true },
    due_in_days: { type: Number, default: null },
  });

// const customerSchema = new mongoose.Schema({
//     // Define your customer schema here
// }, { timestamps: true });

const Product = mongoose.model('Product', productSchema);
const Order = mongoose.model('Order', orderSchema);
const DraftOrder = mongoose.model('DraftOrder', draftOrderSchema);
// const Customer = mongoose.model('Customer', customerSchema);

export { Product, Order, DraftOrder };
