import React, { useState, useEffect } from "react";
import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:5000"; // Change if needed

export default function Dashboard() {
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [supplierForm, setSupplierForm] = useState({ name: "", contact_info: "", product_category: "" });
  const [productForm, setProductForm] = useState({ name: "", brand: "", price: "", category: "", description: "", supplier_id: "" });

  useEffect(() => {
    fetchSuppliers();
    fetchProducts();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/suppliers`);
      setSuppliers(response.data);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/products`);
      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const handleSupplierSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/suppliers`, supplierForm);
      fetchSuppliers();
      setSupplierForm({ name: "", contact_info: "", product_category: "" });
    } catch (error) {
      console.error("Error adding supplier:", error);
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/products`, productForm);
      fetchProducts();
      setProductForm({ name: "", brand: "", price: "", category: "", description: "", supplier_id: "" });
    } catch (error) {
      console.error("Error adding product:", error);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black p-6">
      <h1 className="text-3xl font-bold text-center text-blue-600 mb-6">Supplier & Product Dashboard</h1>
      
      <div className="max-w-3xl mx-auto bg-gray-100 p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-blue-700 mb-4">Add Supplier</h2>
        <form onSubmit={handleSupplierSubmit} className="space-y-4">
          <input type="text" placeholder="Name" value={supplierForm.name} onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })} required className="w-full p-2 border rounded" />
          <input type="text" placeholder="Contact Info" value={supplierForm.contact_info} onChange={(e) => setSupplierForm({ ...supplierForm, contact_info: e.target.value })} required className="w-full p-2 border rounded" />
          <input type="text" placeholder="Category" value={supplierForm.product_category} onChange={(e) => setSupplierForm({ ...supplierForm, product_category: e.target.value })} required className="w-full p-2 border rounded" />
          <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:cursor-pointer">Add Supplier</button>
        </form>
      </div>
      
      <div className="max-w-3xl mx-auto bg-gray-100 p-6 rounded-lg shadow-md mt-6">
        <h2 className="text-2xl font-semibold text-blue-700 mb-4">Add Product</h2>
        <form onSubmit={handleProductSubmit} className="space-y-4">
          <input type="text" placeholder="Name" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} required className="w-full p-2 border rounded" />
          <input type="text" placeholder="Brand" value={productForm.brand} onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })} required className="w-full p-2 border rounded" />
          <input type="number" placeholder="Price" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} required className="w-full p-2 border rounded" />
          <input type="text" placeholder="Category" value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })} required className="w-full p-2 border rounded" />
          <input type="text" placeholder="Description" value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} required className="w-full p-2 border rounded" />
          <select value={productForm.supplier_id} onChange={(e) => setProductForm({ ...productForm, supplier_id: e.target.value })} required className="w-full p-2 border rounded">
            <option value="">Select Supplier</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:cursor-pointer">Add Product</button>
        </form>
      </div>
      
      <div className="max-w-3xl mx-auto mt-6">
        <h2 className="text-2xl font-semibold text-blue-700 mb-4">Suppliers</h2>
        <ul className="bg-gray-100 p-4 rounded-lg shadow-md">
          {suppliers.map((s) => (
            <li key={s.id} className="p-2 border-b">{s.name} - {s.contact_info} - {s.product_category}</li>
          ))}
        </ul>
      </div>
      
      <div className="max-w-3xl mx-auto mt-6">
        <h2 className="text-2xl font-semibold text-blue-700 mb-4">Products</h2>
        <ul className="bg-gray-100 p-4 rounded-lg shadow-md">
          {products.map((p) => (
            <li key={p.id} className="p-2 border-b">{p.name} - {p.brand} - ${p.price} - {p.category} (Supplier: {p.supplier_id})</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
