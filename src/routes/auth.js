const express = require("express");
const passport = require("passport");
const router = express.Router();

// Route to start the Google login process
// GET /api/auth/google
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Google's callback route after user logs in
// GET /api/auth/google/callback
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login-failed",
    successRedirect: "/api/auth/profile",
  })
);

// Protected route to view the current user's profile
// GET /api/auth/profile
router.get("/profile", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).send("You are not authenticated");
  }
  res.json(req.user);
});

// Route to log the user out
// GET /api/auth/logout
router.get("/logout", (req, res, next) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

module.exports = router;
