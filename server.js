const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const DATA_FILE = 'data.json';

function loadData() {
  if (fs.existsSync(DATA_FILE)) {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  }
  return { products: [], id: 1 };
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

app.get('/api/products', (req, res) => {
  const data = loadData();
  res.json(data.products.filter(p => p.status !== 'deletado').sort((a, b) => new Date(a.validity) - new Date(b.validity)));
});

app.get('/api/stats', (req, res) => {
  const data = loadData();
  const products = data.products.filter(p => p.status !== 'deletado');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let vencidos = 0, proximos = 0;
  products.forEach(p => {
    const validity = new Date(p.validity);
    validity.setHours(0, 0, 0, 0);
    const days = Math.ceil((validity - today) / (1000 * 60 * 60 * 24));
    if (days < 0) vencidos++;
    else if (days <= 3) proximos++;
  });
  res.json({ totalProducts: products.length, vencidos, proximos });
});

app.post('/api/products', (req, res) => {
  const data = loadData();
  const newProduct = { ...req.body, id: data.id++, status: 'ativo' };
  data.products.push(newProduct);
  saveData(data);
  res.status(201).json(newProduct);
});

app.delete('/api/products/:id', (req, res) => {
  const data = loadData();
  const product = data.products.find(p => p.id == req.params.id);
  if (product) product.status = 'deletado';
  saveData(data);
  res.json({ message: 'Deletado' });
});

app.delete('/api/products', (req, res) => {
  saveData({ products: [], id: 1 });
  res.json({ message: 'Limpo' });
});

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`🍦 ValidadApp rodando em http://localhost:${PORT}`));
