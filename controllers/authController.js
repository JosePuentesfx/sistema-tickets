const bcrypt = require('bcrypt');
const { User } = require('../models');

exports.getLogin = (req, res) => {
    if (req.session.user) {
        return res.redirect('/tickets/dashboard');
    }
    res.render('login', { title: 'Iniciar Sesión', error: null });
};

exports.postLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ where: { email } });
        
        if (!user) {
            return res.render('login', { title: 'Iniciar Sesión', error: 'Credenciales inválidas' });
        }
        
        const match = await bcrypt.compare(password, user.password);
        
        if (!match) {
            return res.render('login', { title: 'Iniciar Sesión', error: 'Credenciales inválidas' });
        }
        
        // Save user session
        req.session.user = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department,
            phone: user.phone
        };
        
        if (user.role === 'admin') {
            res.redirect('/admin/users');
        } else {
            res.redirect('/tickets/dashboard');
        }
    } catch (error) {
        console.error(error);
        res.render('login', { title: 'Iniciar Sesión', error: 'Error interno del servidor' });
    }
};

exports.logout = (req, res) => {
    req.session.destroy();
    res.redirect('/login');
};
