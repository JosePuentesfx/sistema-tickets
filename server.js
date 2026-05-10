const express = require('express');
const session = require('express-session');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const expressLayouts = require('express-ejs-layouts');

// Set EJS as templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'supersecret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 1000 * 60 * 60 * 24 } // 24 hours
}));

// Add user info to all views
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.path = req.path;
    next();
});

// Import Routes
const authRoutes = require('./routes/authRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const commentRoutes = require('./routes/commentRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Use Routes
app.use('/', authRoutes);
app.use('/tickets', ticketRoutes);
app.use('/comments', commentRoutes);
app.use('/admin', adminRoutes);

// Home redirect
app.get('/', (req, res) => {
    if (req.session.user) {
        if (req.session.user.role === 'admin') {
            res.redirect('/admin/users');
        } else {
            res.redirect('/tickets/dashboard');
        }
    } else {
        res.redirect('/login');
    }
});

// 404 Handler
app.use((req, res) => {
    res.status(404).render('404', { title: 'Página no encontrada' });
});

// Start the server
const { sequelize } = require('./models');
const whatsappService = require('./services/whatsappService');

sequelize.sync({ alter: true }).then(() => {
    console.log('Database connected and synced');
    
    // Iniciar el Bot de WhatsApp
    try {
        whatsappService.initialize();
    } catch (e) {
        console.error('Error inicializando WhatsApp:', e);
    }

    app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error('Database connection failed:', err);
});
