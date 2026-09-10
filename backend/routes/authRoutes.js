const express=require('express');
const {register,login,verifyEmail,resendVerification,completeSetup}=require('../controllers/authController');
const router=express.Router();
router.post('/register',register); router.post('/login',login); router.post('/verify-email',verifyEmail); router.post('/resend-verification',resendVerification); router.post('/complete-setup',completeSetup);
module.exports=router;
