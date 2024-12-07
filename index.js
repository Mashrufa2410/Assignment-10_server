const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Validate environment variables
if (!process.env.DB_USER || !process.env.DB_PASS) {
  console.error("Error: Database credentials are missing in the .env file.");
  process.exit(1);
}

// MongoDB URI
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.q9gvb.mongodb.net/?retryWrites=true&w=majority`;

// MongoDB Client Setup
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Declare the collection variable
let productsCollection;

async function run() {
  try {
    await client.connect();
    console.log("Connected to MongoDB successfully!");

    // Define database and collection
    const database = client.db("ProductsKingDB");
    productsCollection = database.collection("product");

    // Verify connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged MongoDB deployment. Connection verified.");
  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
    process.exit(1);
  }
}

// Run the MongoDB connection function
run().catch(console.dir);

// Routes

// Root route
app.get("/", (req, res) => {
  res.send("Products Server is Running");
});

// Get all products
app.get("/products", async (req, res) => {
  try {
    const products = await productsCollection.find().toArray();
    if (!products.length) {
      return res.status(404).send({ error: "No products found" });
    }
    res.status(200).send(products);
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

// Get a single product by ID
app.get("/products/:id", async (req, res) => {
  const { id } = req.params;
  try {
    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ error: "Invalid product ID" });
    }
    const product = await productsCollection.findOne({ _id: new ObjectId(id) });
    if (!product) {
      return res.status(404).send({ error: "Product not found" });
    }
    res.status(200).send(product);
  } catch (err) {
    console.error("Error fetching product by ID:", err);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

// Add a new product
app.post("/products", async (req, res) => {
  const newProduct = req.body;
  try {
    const result = await productsCollection.insertOne(newProduct);
    res.status(201).send({ message: "Product added successfully", result });
  } catch (err) {
    console.error("Error adding product:", err);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

// Update an existing product
app.put("/products/:id", async (req, res) => {
  const { id } = req.params;
  const updatedProduct = req.body;
  try {
    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ error: "Invalid product ID" });
    }
    const result = await productsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedProduct },
      { upsert: false }
    );
    if (result.matchedCount === 0) {
      return res.status(404).send({ error: "Product not found" });
    }
    res.status(200).send({ message: "Product updated successfully", result });
  } catch (err) {
    console.error("Error updating product:", err);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

// Delete a product by ID
app.delete("/products/:id", async (req, res) => {
  const { id } = req.params;
  try {
    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ error: "Invalid product ID" });
    }
    const result = await productsCollection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return res.status(404).send({ error: "Product not found" });
    }
    res.status(200).send({ message: "Product deleted successfully" });
  } catch (err) {
    console.error("Error deleting product:", err);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Products Server is Running On Port: ${port}`);
});

module.exports = app;