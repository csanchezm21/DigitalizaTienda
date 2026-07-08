🛒 Digitaliza Tienda


Digitaliza Tienda es una aplicación backend desarrollada para la gestión de inventarios y ventas de pequeños y medianos negocios. Permite administrar productos, categorías, proveedores, inventario y usuarios mediante una API REST, facilitando el control de la información almacenada en la base de datos.

Tecnologías utilizadas
Node.js
Express.js
MySQL
JWT (JSON Web Token)


Instalación

Clona este repositorio:
git clone https://github.com/csanchezm21/DigitalizaTienda.git
Ingresa a la carpeta del proyecto:
cd DigitalizaTienda
Instala las dependencias:
npm install
Crea un archivo .env en la raíz del proyecto con las variables de entorno necesarias para la conexión a la base de datos y demás configuraciones.



Modo normal:

npm start

Modo desarrollo:

npm run dev

Si todo está correctamente configurado, el servidor iniciará en:

http://localhost:3000
Importar la base de datos
Abrir MySQL Workbench o phpMyAdmin.
Crear una base de datos llamada:
digitalizabd
Importar el archivo:
digitalizabd.sql


Verificar que todas las tablas se hayan creado correctamente.
Configurar las credenciales de acceso en el archivo .env.
Estructura del proyecto

📁 config
📁 middlewares
📁 routes
📁 node_modules
📄 app.js
📄 package.json
📄 digitalizabd.sql
📄 .env

Características

- Gestión de usuarios.
- Autenticación mediante JWT.
- Administración de productos.
- Administración de categorías.
- Administración de proveedores.
- Control de inventario.
- Conexión a MySQL.
- API REST desarrollada con Express.


Autor

César Sánchez

Estudiante de Ingeniería de Software apasionado por el desarrollo Backend con Node.js, Express y MySQL.