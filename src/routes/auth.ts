const authController = require('../controllers/authController');
const router = require('express').Router();


router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/reset-password', authController.resetPassword);

module.exports = router;

