const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));

// DB Connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '', // ganti sesuai config
  database: 'toko'
});

// Homepage: lihat produk
app.get('/', (req, res) => {
  db.query('SELECT p.id, p.nama, p.harga, s.jumlah FROM produk p JOIN stock_produk s ON p.id = s.produk_id', (err, results) => {
    if (err) throw err;
    res.render('index', { produk: results });
  });
});

// Form pembelian
app.get('/pembelian', (req, res) => {
  db.query('SELECT * FROM produk', (err, results) => {
    if (err) throw err;
    res.render('pembelian', { produk: results });
  });
});

// Input pembelian
app.post('/pembelian', (req, res) => {
  const { produk_id, jumlah } = req.body;

  db.query('SELECT harga FROM produk WHERE id = ?', [produk_id], (err, results) => {
    if (err) throw err;
    const harga = results[0].harga;
    const total = harga * jumlah;

    db.query('INSERT INTO pembelian (produk_id, jumlah, total) VALUES (?, ?, ?)', [produk_id, jumlah, total]);
    db.query('UPDATE stock_produk SET jumlah = jumlah - ? WHERE produk_id = ?', [jumlah, produk_id]);

    res.redirect('/');
  });
});

// Batalkan pembelian
app.get('/cancel', (req, res) => {
  db.query('SELECT p.id, pr.nama, p.jumlah, p.status FROM pembelian p JOIN produk pr ON p.produk_id = pr.id WHERE p.status = "aktif"', (err, results) => {
    if (err) throw err;
    res.render('cancel', { pembelian: results });
  });
});

app.post('/cancel/:id', (req, res) => {
  const pembelianId = req.params.id;
  db.query('SELECT * FROM pembelian WHERE id = ?', [pembelianId], (err, results) => {
    const pembelian = results[0];
    db.query('UPDATE pembelian SET status = "batal" WHERE id = ?', [pembelianId]);
    db.query('UPDATE stock_produk SET jumlah = jumlah + ? WHERE produk_id = ?', [pembelian.jumlah, pembelian.produk_id]);
    res.redirect('/');
  });
});

app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
