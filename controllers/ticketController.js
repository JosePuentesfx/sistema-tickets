const { Ticket, User, Comment } = require('../models');

exports.getDashboard = async (req, res) => {
    try {
        const userRole = req.session.user.role;
        const userId = req.session.user.id;
        
        let tickets;
        let stats = { open: 0, resolved: 0, highPriority: 0 };

        if (userRole === 'tecnico' || userRole === 'admin') {
            const department = req.session.user.department;
            let whereClause = {};
            if (userRole === 'tecnico' && department && department !== 'General') {
                whereClause = { category: department };
            }
            
            tickets = await Ticket.findAll({
                where: whereClause,
                include: [
                    { model: User, as: 'user', attributes: ['name', 'email'] },
                    { model: User, as: 'assignee', attributes: ['name'] }
                ],
                order: [['createdAt', 'DESC']]
            });
        } else {
            tickets = await Ticket.findAll({
                where: { userId },
                include: [
                    { model: User, as: 'user', attributes: ['name', 'email'] },
                    { model: User, as: 'assignee', attributes: ['name'] }
                ],
                order: [['createdAt', 'DESC']]
            });
        }
        
        tickets.forEach(t => {
            if (t.status === 'resuelto') stats.resolved++;
            else stats.open++;
            
            if (t.priority === 'alta' && t.status !== 'resuelto') stats.highPriority++;
        });

        // Filter out resolved tickets for the table
        const activeTickets = tickets.filter(t => t.status !== 'resuelto');
        
        res.render('dashboard', { title: 'Dashboard de Tickets', tickets: activeTickets, stats });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error interno del servidor');
    }
};

exports.getArchivedTickets = async (req, res) => {
    try {
        const userRole = req.session.user.role;
        const userId = req.session.user.id;
        
        let tickets;

        if (userRole === 'tecnico' || userRole === 'admin') {
            const department = req.session.user.department;
            let whereClause = { status: 'resuelto' };
            if (userRole === 'tecnico' && department && department !== 'General') {
                whereClause.category = department;
            }
            
            tickets = await Ticket.findAll({
                where: whereClause,
                include: [
                    { model: User, as: 'user', attributes: ['name', 'email'] },
                    { model: User, as: 'assignee', attributes: ['name'] }
                ],
                order: [['updatedAt', 'DESC']]
            });
        } else {
            tickets = await Ticket.findAll({
                where: { userId, status: 'resuelto' },
                include: [
                    { model: User, as: 'user', attributes: ['name', 'email'] },
                    { model: User, as: 'assignee', attributes: ['name'] }
                ],
                order: [['updatedAt', 'DESC']]
            });
        }
        
        res.render('archived-tickets', { title: 'Tickets Archivados', tickets });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error interno del servidor');
    }
};

exports.getCreateTicket = (req, res) => {
    res.render('create-ticket', { title: 'Crear Ticket' });
};

exports.postCreateTicket = async (req, res) => {
    try {
        const { title, description, priority, category } = req.body;
        const ticket = await Ticket.create({
            title,
            description,
            priority: priority || 'media',
            category: category || 'Otro',
            userId: req.session.user.id
        });

        // NOTIFICACIÓN POR WHATSAPP A TÉCNICOS
        try {
            const { Op } = require('sequelize');
            const whatsappService = require('../services/whatsappService');
            
            const tecnicos = await User.findAll({
                where: {
                    role: 'tecnico',
                    phone: { [Op.not]: null },
                    [Op.or]: [
                        { department: category },
                        { department: 'General' }
                    ]
                }
            });

            if (tecnicos.length > 0) {
                const mensaje = `🚨 *NUEVO TICKET REPORTADO*\n\n` +
                                `*ID:* #${ticket.id}\n` +
                                `*Asunto:* ${title}\n` +
                                `*Categoría:* ${category || 'Otro'}\n` +
                                `*Reportado por:* ${req.session.user.name}\n\n` +
                                `Entra al sistema para atenderlo.`;
                
                for (let tech of tecnicos) {
                    whatsappService.sendMessage(tech.phone, mensaje);
                }
            }
        } catch (waError) {
            console.error('Error enviando WhatsApp (Nuevo Ticket):', waError);
        }

        res.redirect('/tickets/dashboard?success=Ticket creado correctamente.');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error interno del servidor');
    }
};

exports.getTicketDetails = async (req, res) => {
    try {
        const ticketId = req.params.id;
        const ticket = await Ticket.findByPk(ticketId, {
            include: [
                { model: User, as: 'user', attributes: ['name', 'email'] },
                { model: User, as: 'assignee', attributes: ['name', 'email'] },
                { 
                    model: Comment, 
                    as: 'comments',
                    include: [{ model: User, as: 'user', attributes: ['name', 'role'] }]
                }
            ],
            order: [[{ model: Comment, as: 'comments' }, 'createdAt', 'ASC']]
        });
        
        if (!ticket) {
            return res.status(404).render('404', { title: 'Ticket no encontrado' });
        }
        
        // Authorization: only tecnico or the ticket creator can view it
        if (req.session.user.role !== 'tecnico' && ticket.userId !== req.session.user.id) {
            return res.status(403).render('403', { title: 'Acceso Denegado' });
        }
        
        res.render('ticket-details', { title: `Ticket #${ticket.id}`, ticket });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error interno del servidor');
    }
};

exports.updateTicketStatus = async (req, res) => {
    try {
        const ticketId = req.params.id;
        const { status } = req.body;
        
        if (req.session.user.role !== 'tecnico') {
            return res.status(403).send('Acceso Denegado');
        }

        const ticket = await Ticket.findByPk(ticketId);
        if (!ticket) {
            return res.status(404).send('Ticket no encontrado');
        }

        if (ticket.assignedTo !== req.session.user.id) {
            return res.status(403).send('No puedes cambiar el estado de un ticket que no te está asignado');
        }
        
        await Ticket.update({ status }, { where: { id: ticketId } });
        
        // Audit log comment
        await Comment.create({
            content: `[SISTEMA] El estado del ticket fue cambiado a: ${status.toUpperCase()} por ${req.session.user.name}.`,
            ticketId: ticketId,
            userId: req.session.user.id
        });

        // NOTIFICACIÓN POR WHATSAPP AL EMPLEADO
        if (status === 'resuelto') {
            try {
                const empleado = await User.findByPk(ticket.userId);
                if (empleado && empleado.phone) {
                    const whatsappService = require('../services/whatsappService');
                    const mensaje = `✅ *TICKET RESUELTO*\n\n` +
                                    `Hola ${empleado.name}, tu ticket #${ticket.id} ("${ticket.title}") ha sido solucionado por nuestro equipo de soporte.\n\n` +
                                    `¡Gracias por usar el sistema!`;
                    
                    whatsappService.sendMessage(empleado.phone, mensaje);
                }
            } catch (waError) {
                console.error('Error enviando WhatsApp (Ticket Resuelto):', waError);
            }
        }
        
        res.redirect('/tickets/' + ticketId);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error interno del servidor');
    }
};

exports.assignTicket = async (req, res) => {
    try {
        const ticketId = req.params.id;
        
        if (req.session.user.role !== 'tecnico') {
            return res.status(403).send('Acceso Denegado');
        }

        const ticket = await Ticket.findByPk(ticketId);
        if (!ticket) {
            return res.status(404).send('Ticket no encontrado');
        }

        // Verify department matches
        if (req.session.user.department !== 'General' && ticket.category !== req.session.user.department) {
            return res.status(403).send('No puedes tomar un ticket que no pertenece a tu departamento.');
        }
        
        await Ticket.update({ assignedTo: req.session.user.id }, { where: { id: ticketId } });
        
        // Audit log comment
        await Comment.create({
            content: `[SISTEMA] Este ticket fue asignado a: ${req.session.user.name}.`,
            ticketId: ticketId,
            userId: req.session.user.id
        });
        
        res.redirect('/tickets/' + ticketId);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error interno del servidor');
    }
};

exports.getTicketComments = async (req, res) => {
    try {
        const ticketId = req.params.id;
        const ticket = await Ticket.findByPk(ticketId, {
            include: [
                { model: User, as: 'assignee', attributes: ['name'] },
                {
                    model: Comment,
                    as: 'comments',
                    include: [{ model: User, as: 'user', attributes: ['name', 'role'] }],
                }
            ],
            order: [[{ model: Comment, as: 'comments' }, 'createdAt', 'ASC']]
        });
        
        if (!ticket) {
            return res.status(404).json({ error: 'Ticket no encontrado' });
        }
        
        if (req.session.user.role !== 'tecnico' && ticket.userId !== req.session.user.id) {
            return res.status(403).json({ error: 'Acceso Denegado' });
        }
        
        res.json({ 
            status: ticket.status,
            assignee: ticket.assignee ? ticket.assignee.name : 'Sin asignar',
            comments: ticket.comments || [] 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

exports.getDashboardData = async (req, res) => {
    try {
        const userRole = req.session.user.role;
        const userId = req.session.user.id;
        
        let tickets;
        let stats = { open: 0, resolved: 0, highPriority: 0 };

        if (userRole === 'tecnico' || userRole === 'admin') {
            const department = req.session.user.department;
            let whereClause = {};
            if (userRole === 'tecnico' && department && department !== 'General') {
                whereClause = { category: department };
            }
            
            tickets = await Ticket.findAll({
                where: whereClause,
                include: [
                    { model: User, as: 'user', attributes: ['name', 'email'] },
                    { model: User, as: 'assignee', attributes: ['name'] }
                ],
                order: [['createdAt', 'DESC']]
            });
        } else {
            tickets = await Ticket.findAll({
                where: { userId },
                include: [
                    { model: User, as: 'user', attributes: ['name', 'email'] },
                    { model: User, as: 'assignee', attributes: ['name'] }
                ],
                order: [['createdAt', 'DESC']]
            });
        }
        
        tickets.forEach(t => {
            if (t.status === 'resuelto') stats.resolved++;
            else stats.open++;
            
            if (t.priority === 'alta' && t.status !== 'resuelto') stats.highPriority++;
        });

        const activeTickets = tickets.filter(t => t.status !== 'resuelto');
        
        res.json({ tickets: activeTickets, stats, userRole });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
