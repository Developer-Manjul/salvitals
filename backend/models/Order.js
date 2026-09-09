const mongoose = require('mongoose');
const orderSchema = new mongoose.Schema({
 userId:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},
 planId:{type:String,required:true}, planName:String, amount:Number, currency:String,
 period:{type:Number,default:1}, paymentStatus:{type:String,enum:['pending','paid','failed'],default:'pending'},
 razorpayOrderId:String, razorpayPaymentId:String, razorpaySignature:String, country:String
},{timestamps:true});
module.exports = mongoose.model('Order',orderSchema);
