const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { isAuthenticated, isTecnico, isEmpleado } = require('../middlewares/authMiddleware');

router.use(isAuthenticated);

router.get('/dashboard', ticketController.getDashboard);
router.get('/archived', ticketController.getArchivedTickets);
router.get('/create', isEmpleado, ticketController.getCreateTicket);
router.post('/create', isEmpleado, ticketController.postCreateTicket);
router.get('/:id', ticketController.getTicketDetails);
router.post('/:id/status', isTecnico, ticketController.updateTicketStatus);
router.post('/:id/assign', isTecnico, ticketController.assignTicket);
router.get('/api/:id/comments', ticketController.getTicketComments);
router.get('/api/dashboard/data', ticketController.getDashboardData);

module.exports = router;
