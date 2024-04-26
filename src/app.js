const express = require('express');
const app = express();
const PORT = 3000;


// Middleware para servir archivos estáticos
app.use(express.static('public'));

// Ruta inicial
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

//Paso18
// Ruta para obtener datos geoespaciales
app.get('/api/datos', (req, res) => {
    // Aquí iría la lógica para recuperar datos de tu base de datos
    res.json({ mensaje: "Datos enviados desde la API" });
});

// Ruta para enviar o actualizar datos geoespaciales
app.post('/api/datos', (req, res) => {
    // Lógica para insertar o actualizar datos en la base de datos
    res.status(201).send({ mensaje: "Datos guardados en la base de datos" });
});
//
// Middleware para parsear JSON. Esto debe estar antes de las rutas que lo necesitan.
app.use(express.json());

app.post('/guardar_poligono', async (req, res) => {
    const { nombre, geom } = req.body;
    const query = 'INSERT INTO poligonos (nombre, geom) VALUES ($1, ST_GeomFromGeoJSON($2)) RETURNING id;';
    try {
        const result = await pool.query(query, [nombre, geom]);
        const newId = result.rows[0].id;  // Asegúrate de que la base de datos está configurada para devolver el id
        res.json({ message: 'Polígono guardado', id: newId });
    } catch (error) {
        console.error('Error al guardar el polígono:', error);
        res.status(400).json({ error: error.message });
    }
});


app.put('/actualizar_poligono/:id', async (req, res) => {
    const { id } = req.params;
    const { geom } = req.body;

    const updateQuery = 'UPDATE poligonos SET geom = ST_GeomFromGeoJSON($1) WHERE id = $2 RETURNING *;';
    try {
        const result = await pool.query(updateQuery, [geom, id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Polígono no encontrado.' });
        }
        res.json({ message: 'Polígono actualizado con éxito' });
    } catch (error) {
        console.error('Error al actualizar el polígono:', error);
        res.status(500).json({ error: 'Error al actualizar el polígono' });
    }
});




//paso 19
const { Pool } = require('pg');
const pool = new Pool({
    user: 'jonathan8a',
    host: 'postgresql-jonathan8a.alwaysdata.net',
    database: 'jonathan8a_geotrends',
    password: 'Geotrends.2023',
    port: 5432,
});
//Paso20

// Endpoint para listar las tablas

//----------------------
app.get('/api/capas', async (req, res) => {
    try {
        const { rows } = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE';");
        res.json(rows.map(row => row.table_name));
    } catch (err) {
        console.error(err);
        res.status(500).send('Error interno del servidor');
    }
});


// Endpoint para obtener datos de una tabla específica en formato GeoJSON
app.get('/api/capas/:nombreCapa', async (req, res) => {
    const tableName = req.params.nombreCapa;
    const validTables = ['estaciones_metro','barrios_y_veredas','reproyectada']; // Aquí tus nombres de tabla permitidos
    if (!validTables.includes(tableName)) {
        return res.status(400).json({ error: "Tabla no válida" });
    }
    try {
        const queryResult = await pool.query(`SELECT *, ST_AsGeoJSON(geom)::json AS geometry FROM public.${tableName}`);
        const geojson = transformToGeoJSON(queryResult.rows);
        res.json(geojson);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});


function transformToGeoJSON(rows) {
    return {
        type: 'FeatureCollection',
        features: rows.map(row => {
            return {
                type: 'Feature',
                geometry: row.geometry,
                properties: row // Aquí podrías filtrar o ajustar las propiedades según sea necesario
            };
        })
    };
}


//-----------------------

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://44.213.153.17:${PORT}`);
});
