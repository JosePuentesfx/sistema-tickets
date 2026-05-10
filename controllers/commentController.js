const { Comment, Ticket } = require('../models');

exports.postComment = async (req, res) => {
    try {
        const ticketId = req.params.ticketId;
        const { content } = req.body;
        
        // Verify ticket exists
        const ticket = await Ticket.findByPk(ticketId);
        if (!ticket) {
            return res.status(404).send('Ticket no encontrado');
        }
        
        // Check authorization
        if (req.session.user.role !== 'tecnico' && ticket.userId !== req.session.user.id) {
            return res.status(403).send('Acceso Denegado');
        }
        
        await Comment.create({
            content,
            ticketId,
            userId: req.session.user.id
        });
        
        res.redirect(`/tickets/${ticketId}`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error interno del servidor');
    }
};
