module.exports = {
    isAuthenticated: (req, res, next) => {
        if (req.session.user) {
            return next();
        }
        res.redirect('/login');
    },
    isAdmin: (req, res, next) => {
        if (req.session.user && req.session.user.role === 'admin') {
            return next();
        }
        res.status(403).render('403', { title: 'Acceso Denegado' });
    },
    isTecnico: (req, res, next) => {
        if (req.session.user && req.session.user.role === 'tecnico') {
            return next();
        }
        res.status(403).render('403', { title: 'Acceso Denegado' });
    },
    isEmpleado: (req, res, next) => {
        if (req.session.user && req.session.user.role === 'empleado') {
            return next();
        }
        res.status(403).render('403', { title: 'Acceso Denegado' });
    }
};
