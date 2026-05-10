const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isAuthenticated, isAdmin } = require('../middlewares/authMiddleware');

router.use(isAuthenticated);
router.use(isAdmin);

router.get('/users', adminController.getUsers);
router.get('/users/create', adminController.getCreateUser);
router.post('/users/create', adminController.postUser);
router.get('/users/:id', adminController.getUserDetails);
router.post('/users/:id/delete', adminController.deleteUser);
router.post('/users/:id/password', adminController.updatePassword);

module.exports = router;
