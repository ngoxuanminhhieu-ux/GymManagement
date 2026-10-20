const express = require('express');
const mysql = require('mysql2/promise');
const client = require('prom-client');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const register = new client.Registry();
client.collectDefaultMetrics({ register });
const httpRequestCounter = new client.Counter({
    name: 'gym_http_requests_total',
    help: 'Total HTTP requests',
    labelNames: ['method', 'route', 'status'],
    registers: [register]
});

app.use((req, res, next) => {
    res.on('finish', () => {
        httpRequestCounter.inc({ method: req.method, route: req.path, status: res.statusCode });
        console.log(JSON.stringify({
            timestamp: new Date().toISOString(),
            level: res.statusCode >= 400 ? 'ERROR' : 'INFO',
            method: req.method,
            path: req.path,
            status: res.statusCode
        }));
    });
    next();
});

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'mysql_db',
    user: process.env.DB_USER || 'gym_app_user',
    password: process.env.DB_PASSWORD || 'GymUser@2026#AppPass!',
    database: process.env.DB_NAME || 'gym_db',
    waitForConnections: true,
    connectionLimit: 10
});

app.get('/', async (req, res) => {
    try {
        const [members] = await pool.query('SELECT m.id, m.full_name, m.phone, m.join_date, p.name AS package_name FROM members m LEFT JOIN packages p ON m.package_id = p.id ORDER BY m.id DESC');
        const [packages] = await pool.query('SELECT * FROM packages');
        const [trainers] = await pool.query('SELECT * FROM trainers');
        const [schedules] = await pool.query('SELECT s.id, m.full_name AS member_name, t.full_name AS trainer_name, s.workout_day, s.time_slot, s.notes FROM schedules s JOIN members m ON s.member_id = m.id JOIN trainers t ON s.trainer_id = t.id');

        let rows = '';
        members.forEach(m => {
            const pkg = m.package_name || 'Chua DK';
            const jDate = m.join_date ? new Date(m.join_date).toISOString().split('T')[0] : '';
            rows += `<tr><td>${m.id}</td><td><b>${m.full_name}</b></td><td>${m.phone}</td><td><span class="badge bg-info text-dark">${pkg}</span></td><td>${jDate}</td></tr>`;
        });

        let pkgs = '';
        packages.forEach(p => {
            pkgs += `<option value="${p.id}">${p.name} (${Number(p.price).toLocaleString()}d)</option>`;
        });

        let trns = '';
        trainers.forEach(t => {
            trns += `<li class="list-group-item"><b>${t.full_name}</b> - ${t.specialty} (${t.phone})</li>`;
        });

        let schs = '';
        schedules.forEach(s => {
            schs += `<tr><td>${s.member_name}</td><td>${s.trainer_name}</td><td>${s.workout_day}</td><td>${s.time_slot}</td><td>${s.notes || ''}</td></tr>`;
        });

        const html = `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Gym Management</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body class="bg-light">
    <nav class="navbar navbar-dark bg-dark mb-4">
        <div class="container">
            <span class="navbar-brand mb-0 h1">GYM & FITNESS MANAGEMENT (DE 23)</span>
        </div>
    </nav>
    <div class="container">
        <div class="row">
            <div class="col-md-4 mb-4">
                <div class="card shadow-sm">
                    <div class="card-header bg-primary text-white">Dang Ky Hoi Vien Moi</div>
                    <div class="card-body">
                        <form action="/add-member" method="POST">
                            <div class="mb-2">
                                <label>Ho va ten:</label>
                                <input type="text" name="full_name" class="form-control" required>
                            </div>
                            <div class="mb-2">
                                <label>So dien thoai:</label>
                                <input type="text" name="phone" class="form-control" required>
                            </div>
                            <div class="mb-2">
                                <label>Chon Goi Tap:</label>
                                <select name="package_id" class="form-select">
                                    ${pkgs}
                                </select>
                            </div>
                            <button class="btn btn-success w-100 mt-2">Luu Hoi Vien</button>
                        </form>
                    </div>
                </div>
            </div>
            <div class="col-md-8 mb-4">
                <div class="card shadow-sm">
                    <div class="card-header bg-dark text-white">Danh Sach Hoi Vien</div>
                    <div class="card-body">
                        <table class="table table-bordered table-hover">
                            <thead><tr><th>ID</th><th>Ho Ten</th><th>SDT</th><th>Goi Tap</th><th>Ngay DK</th></tr></thead>
                            <tbody>${rows}</tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="col-md-5 mb-4">
                <div class="card shadow-sm mb-3">
                    <div class="card-header bg-secondary text-white">Doi Ngu PT</div>
                    <ul class="list-group list-group-flush">${trns}</ul>
                </div>
            </div>
            <div class="col-md-7 mb-4">
                <div class="card shadow-sm">
                    <div class="card-header bg-warning text-dark"><b>Lich Tap Hoi Vien</b></div>
                    <div class="card-body">
                        <table class="table table-sm table-striped">
                            <thead><tr><th>Hoi Vien</th><th>HLV</th><th>Ngay Tap</th><th>Ca Tap</th><th>Ghi Chu</th></tr></thead>
                            <tbody>${schs}</tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;
        res.send(html);
    } catch (err) {
        console.error(JSON.stringify({ level: 'ERROR', msg: err.message }));
        res.status(500).send('Database Error: ' + err.message);
    }
});

app.post('/add-member', async (req, res) => {
    const { full_name, phone, package_id } = req.body;
    try {
        await pool.query('INSERT INTO members (full_name, phone, package_id, join_date) VALUES (?, ?, ?, CURDATE())', [full_name, phone, package_id]);
        res.redirect('/');
    } catch (err) {
        console.error(JSON.stringify({ level: 'ERROR', msg: err.message }));
        res.status(500).send('Error');
    }
});

app.get('/error-test', (req, res) => {
    console.error(JSON.stringify({ level: 'ERROR', msg: 'Test LogQL error' }));
    res.status(500).json({ error: 'Test LogQL error' });
});

app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
});

app.listen(3000, () => {
    console.log(JSON.stringify({ level: 'INFO', msg: 'Gym App running on port 3000' }));
});
