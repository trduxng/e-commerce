const fs = require('fs');

if (fs.existsSync('src/pages/Dashboard.jsx')) {
    let code = fs.readFileSync('src/pages/Dashboard.jsx', 'utf8');
    code = code.replace(/to="\/products"/g, 'to="/admin/products"');
    code = code.replace(/to="\/categories"/g, 'to="/admin/categories"');
    code = code.replace(/to="\/users"/g, 'to="/admin/users"');
    code = code.replace(/to="\/orders"/g, 'to="/admin/orders"');
    fs.writeFileSync('src/pages/Dashboard.jsx', code);
    console.log('Fixed Dashboard.jsx');
}
