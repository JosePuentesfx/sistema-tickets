const bcrypt = require('bcrypt');
const { User } = require('../models');

exports.getUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            order: [['createdAt', 'DESC']]
        });
        res.render('admin-users', { title: 'Gestión de Trabajadores', users, error: null, success: req.query.success });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error interno del servidor');
    }
};

exports.getCreateUser = (req, res) => {
    res.render('admin-user-create', { title: 'Registrar Trabajador', error: null });
};

exports.postUser = async (req, res) => {
    try {
        const { name, email, password, role, department, phone } = req.body;
        
        // Check if user already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.render('admin-user-create', { title: 'Registrar Trabajador', error: 'El correo/usuario ya existe' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        
        await User.create({
            name,
            email,
            phone: phone || null,
            password: hashedPassword,
            role,
            department: role === 'tecnico' ? department : 'General'
        });
        
        res.redirect('/admin/users?success=Usuario creado correctamente.');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error interno del servidor');
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;
        // Don't allow admin to delete themselves
        if (userId === req.session.user.id.toString()) {
            return res.redirect('/admin/users?error=No puedes eliminarte a ti mismo.');
        }
        await User.destroy({ where: { id: userId } });
        res.redirect('/admin/users?success=Usuario eliminado correctamente.');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error interno del servidor');
    }
};

exports.getUserDetails = async (req, res) => {
    try {
        const userId = req.params.id;
        const { Ticket } = require('../models');
        
        const worker = await User.findByPk(userId);
        if (!worker) {
            return res.redirect('/admin/users?error=Usuario no encontrado');
        }

        let stats = { reported: 0, assigned: 0, resolved: 0 };
        let recentTickets = [];

        if (worker.role === 'empleado') {
            recentTickets = await Ticket.findAll({
                where: { userId: worker.id },
                order: [['createdAt', 'DESC']],
                limit: 10
            });
            stats.reported = await Ticket.count({ where: { userId: worker.id } });
        } else if (worker.role === 'tecnico') {
            recentTickets = await Ticket.findAll({
                where: { assignedTo: worker.id },
                order: [['createdAt', 'DESC']],
                limit: 10
            });
            stats.assigned = await Ticket.count({ where: { assignedTo: worker.id } });
            stats.resolved = await Ticket.count({ where: { assignedTo: worker.id, status: 'resuelto' } });
        }

        res.render('admin-user-details', { title: `Perfil: ${worker.name}`, worker, stats, recentTickets });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error interno del servidor');
    }
};

exports.updatePassword = async (req, res) => {
    try {
        const userId = req.params.id;
        const { newPassword } = req.body;
        
        if (!newPassword || newPassword.trim() === '') {
            return res.redirect('/admin/users?error=La contraseña no puede estar vacía.');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await User.update({ password: hashedPassword }, { where: { id: userId } });
        
        res.redirect('/admin/users?success=Contraseña actualizada correctamente.');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error interno del servidor');
    }
};
