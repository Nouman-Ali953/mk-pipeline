export const isAuthenticated = (req, res, next) => {
  try {
    // If using sessions
    if (req.session && req.session.user) {
      return next();
    }

    // If using JWT stored in cookies
    if (req.cookies && req.cookies.token) {
      return next();
    }

    // Not authenticated → redirect to login
    return res.redirect("/login");
  } catch (err) {
    console.error("Auth Middleware Error:", err);
    return res.redirect("/login");
  }
};
