import { Product } from '../types';

export const mockProducts: Product[] = [
  {
    id: 'prod-001',
    name: 'Smartphone Galaxy Pro',
    category: 'Eletrônicos',
    price: 1299.99,
    description: 'Smartphone premium com câmera de 108MP e 5G',
    inStock: true
  },
  {
    id: 'prod-002',
    name: 'Notebook UltraBook',
    category: 'Eletrônicos',
    price: 2499.99,
    description: 'Notebook ultrafino com processador Intel i7 e 16GB RAM',
    inStock: true
  },
  {
    id: 'prod-003',
    name: 'Fone Bluetooth Premium',
    category: 'Áudio',
    price: 299.99,
    description: 'Fone de ouvido sem fio com cancelamento de ruído',
    inStock: true
  },
  {
    id: 'prod-004',
    name: 'Smart TV 55"',
    category: 'Eletrônicos',
    price: 1899.99,
    description: 'Smart TV 4K com HDR e sistema Android TV',
    inStock: false
  },
  {
    id: 'prod-005',
    name: 'Câmera DSLR',
    category: 'Fotografia',
    price: 3299.99,
    description: 'Câmera profissional com lente 18-55mm',
    inStock: true
  }
];