*DigitalizaTuTienda** es un sistema de gestión de inventario y ventas desarrollado como proyecto de aprendizaje y portafolio.

Su objetivo es ayudar a pequeños negocios a administrar productos, proveedores, inventario y ventas de manera sencilla, permitiendo un mejor control de la información y facilitando la gestión comercial.

Este proyecto ha sido desarrollado aplicando buenas prácticas de desarrollo Backend, arquitectura por capas y consumo de APIs REST.

🚀 Tecnologías utilizadas

## Backend

- Node.js
- Express.js
- JavaScript (ES6)

## Base de Datos

- MySQL
- MySQL Workbench

## Herramientas

- Visual Studio Code
- Git
- GitHub
- Postman / Thunder Client

📂 Estructura del proyecto


DigitalizaTuTienda
│
├── src
│   ├── config
│   ├── controllers
│   ├── routes
│   ├── models
│   ├── services
│   └── app.js
│
├── database
│
├── .env
├── server.js
├── package.json
└── README.md


🏗 Arquitectura

El proyecto está organizado siguiendo una arquitectura por capas.
Cada capa tiene una responsabilidad específica:

- **Routes:** Define las rutas de la API.
- **Controllers:** Reciben las peticiones HTTP.
- **Services:** Contienen la lógica del negocio.
- **Database:** Almacena la información en MySQL.
---

📦 Base de Datos

Nombre de la base de datos:

```
inventario_ventas
```

Actualmente cuenta con tablas como:

- Categoría
- Producto
- Proveedor
- Producto_Proveedor
- Inventario
- Factura
- Detalle_Venta

---

✅ Funcionalidades implementadas

- Conexión entre Node.js y MySQL.
- API REST con Express.
- Configuración mediante variables de entorno.
- Gestión de productos.
- Organización del proyecto por carpetas.
- Pruebas de endpoints con Postman y Thunder Client.

---

# 🚧 Funcionalidades en desarrollo

- CRUD completo de productos.
- CRUD de categorías.
- CRUD de proveedores.
- Gestión de inventario.
- Registro de ventas.
- Generación de facturas.
- Reportes.
- Validaciones.
- Autenticación de usuarios.
- Frontend en Angular.

# ▶️ Instalación

## 1. Clonar el repositorio

```bash
git clone https://github.com/csanchezm21/DigitalizaTienda.git
```

## 2. Entrar al proyecto

```bash
cd DigitalizaTienda
```

## 3. Instalar dependencias

```bash
npm install
```

## 4. Configurar las variables de entorno

Crear un archivo `.env`

```env
DB_HOST=localhost
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña
DB_NAME=inventario_ventas
PORT=3000
```

---

## 5. Ejecutar el proyecto

```bash
npm start
```

o

```bash
node server.js
```

---

# 📡 Endpoints

| Método | Endpoint | Descripción |
|---------|----------|-------------|
| GET | / | Verificar funcionamiento de la API |
| GET | /productos | Obtener productos |
| POST | /productos | Crear producto |
| PUT | /productos/:id | Actualizar producto |
| DELETE | /productos/:id | Eliminar producto |

*(Los endpoints pueden variar según el avance del proyecto.)*

---


# 👨‍💻 Autor

**César Sánchez**

🎓 Estudiante de Ingeniería de Software

💻 Backend Developer en formación

🔗 GitHub:

https://github.com/csanchezm21

---

# ⭐ Estado del proyecto

🚧 Proyecto en desarrollo.
