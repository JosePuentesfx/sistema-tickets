# 🎫 Sistema de Tickets Enterprise

Sistema de soporte técnico interno tipo helpdesk construido con **Node.js**, **Express**, **MySQL** y **WhatsApp Bot**. Desarrollado para gestionar incidencias técnicas en entornos corporativos.

## ✨ Funcionalidades

- **Roles diferenciados:** Empleados (crean tickets), Técnicos (resuelven tickets), Administradores (gestionan personal).
- **Departamentalización:** Los técnicos solo ven y atienden tickets de su área (Hardware, Software, Redes, Accesos).
- **Dashboard en tiempo real:** Las estadísticas y la tabla se actualizan cada 5 segundos sin recargar la página.
- **Archivado automático:** Los tickets resueltos desaparecen del panel activo pero se conservan en el historial.
- **Notificaciones WhatsApp:** Al crear un ticket, los técnicos del área reciben un mensaje automático. Al resolverlo, el empleado recibe confirmación.
- **Perfiles analíticos:** El administrador puede ver KPIs de cada trabajador (tickets reportados, tasa de resolución, etc.).
- **Validación de datos:** Formularios con validación en tiempo real en el cliente.

## 🛠️ Stack Tecnológico

| Tecnología | Uso |
|---|---|
| Node.js + Express | Servidor y rutas |
| EJS + express-ejs-layouts | Plantillas HTML |
| Sequelize + MySQL2 | ORM y base de datos |
| Bcrypt | Hashing de contraseñas |
| whatsapp-web.js | Bot de notificaciones |
| TailwindCSS (CDN) | Estilos |

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/TU_USUARIO/sistema-tickets-enterprise.git
cd sistema-tickets-enterprise
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env
```

Edita el archivo `.env` con tus credenciales de MySQL.

### 4. Crear la base de datos en MySQL

```sql
CREATE DATABASE sistema_tickets;
```

### 5. Crear las tablas y usuario administrador inicial

```bash
node seed.js
```

> Las credenciales del administrador inicial son: **usuario:** `admin` | **contraseña:** `123`.  
> Se recomienda cambiarla inmediatamente desde el panel de administración.

### 6. Iniciar el servidor

```bash
npm run dev
```

El sistema estará disponible en: `http://localhost:3000`

## 🤖 Configuración del Bot de WhatsApp

Al iniciar el servidor por primera vez, aparecerá un **Código QR** en la consola. Escanéalo con la app de WhatsApp del número que usarás como "bot" (Dispositivos Vinculados > Vincular dispositivo).

- Los técnicos deben tener un número de teléfono registrado en su perfil para recibir notificaciones.
- El formato del número es: código de país + número local (ej. `5215512345678`).

## 📁 Estructura del Proyecto

```
├── config/         # Configuración de la base de datos
├── controllers/    # Lógica de negocio
├── middlewares/    # Autenticación y autorización
├── models/         # Modelos Sequelize (User, Ticket, Comment)
├── routes/         # Rutas de Express
├── services/       # Bot de WhatsApp
├── views/          # Plantillas EJS
├── seed.js         # Script para inicializar la BD
└── server.js       # Punto de entrada
```

## 📄 Licencia

MIT — Libre para usar, modificar y distribuir.
