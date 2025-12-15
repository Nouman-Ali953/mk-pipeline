import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import bodyParser from 'body-parser';
import cookieParser from "cookie-parser"; 
import session from "express-session";
import { fileURLToPath } from "url";
import '../config/db.js'
import router from '../routes/authRoute.js';
import { isAuthenticated } from "../middlewares/authMiddleware.js";

dotenv.config();
const app = express();

app.use(cookieParser());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60, // 1 hour
      secure: false, // true only on HTTPS
      httpOnly: true,
    },
  })
);
// 3. ⭐ Add this middleware RIGHT HERE
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


// Public routes allowed without login
const publicRoutes = ["/", "/login", "/signup"];

// Apply auth only for protected routes
app.use((req, res, next) => {
  if (publicRoutes.includes(req.path)) {
    return next();
  }
  return isAuthenticated(req, res, next);
});

app.use(router);

const PORT = process.env.PORT || 3000;


// app.get("/", (req, res) => {
//   res.render("index", { title: "Home" });
// }); 

app.get("/", (req, res) => {
  if (!req.session.user) {
    // User NOT logged in → show public homepage
    return res.render("index", { title: "Home" });
  }

  // User IS logged in → show dashboard
  return res.render("dashboard", { title: "Dashboard" });
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

app.get("/settings", (req, res) => {
  res.render("settings", { title: "Settings" });
});

app.get("/explore", (req, res) => {
  res.render("explore", { title: "Explore" });
});

app.get("/profile", (req, res) => {
  res.render("profile", { title: "Profile" });
});


// app.get("/login", (req, res) => {
//   res.render("login", { title: "Login" });
// });

app.get("/login", (req, res) => {
  const { error, oldEmail } = req.query;
  res.render("login", {
    title: "Login",
    error: error || undefined,
    oldEmail: oldEmail || undefined
  });
});


app.get("/cricket", (req, res) => {
  res.render("cricket");
});

app.get("/signup", (req, res) => {
  res.render("signup", { title: "Sign Up" });
});

// 404 - Page Not Found
app.use((req, res) => {
  res.status(404).render("404", { title: "Page Not Found" });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
})