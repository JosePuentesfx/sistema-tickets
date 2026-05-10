const bcrypt = require('bcrypt');
const { User, sequelize } = require('./models');

async function seed() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
        
        // Force sync models to recreate tables
        await sequelize.sync({ force: true });
        
        // Check if admin exists
        const existingAdmin = await User.findOne({ where: { email: 'admin' } });
        
        if (!existingAdmin) {
            const hashedPassword = await bcrypt.hash('123', 10);
            await User.create({
                name: 'Administrador Principal',
                email: 'admin',
                password: hashedPassword,
                role: 'admin'
            });
            console.log('✅ Usuario administrador creado. Revisa el archivo README.md para las credenciales iniciales.');
        } else {
            console.log('⚠️ Admin user already exists.');
        }
    } catch (error) {
        console.error('❌ Unable to connect to the database:', error);
    } finally {
        process.exit();
    }
}

seed();
