const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { isAuthenticated } = require('../middlewares/authMiddleware');

router.use(isAuthenticated);

router.post('/:ticketId', commentController.postComment);

module.exports = router;
