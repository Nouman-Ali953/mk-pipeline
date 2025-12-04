import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import bodyParser from 'body-parser';
import { fileURLToPath } from "url";

dotenv.config();
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.render("index", { title: "Home" });
}); 

app.get("/any", (req, res) => {
  res.send("Hello how are you")
}); 

app.get("/country", (req, res) => {
  res.send("Pakistan ❤️")
}); 

app.get("/about", (req, res) => {
  res.render("about", { title: "About" });
});


app.get("/login", (req, res) => {
  res.render("login", { title: "Login" });
});

app.get("/cricket", (req, res) => {
  res.render("cricket");
});

app.get("/signup", (req, res) => {
  res.render("signup", { title: "Sign Up" });
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  console.log(`Login attempt by: ${email}`);
  res.redirect("/");
});

// Handle signup form submission
app.post("/signup", (req, res) => {
  const { name, email, password } = req.body;
  res.redirect("/login");
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
})