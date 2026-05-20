require('dotenv').config();
const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true in production with HTTPS
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
  },
  function(accessToken, refreshToken, profile, cb) {
    // In a real application, you would find or create a user in your database here.
    // For this example, we'll just pass the profile.
    console.log("Google Profile:", profile);
    return cb(null, profile);
  }
));

// Serialize and deserialize user for session management
passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

// Authentication Routes
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/profile');
  });

// Login failure route
app.get('/login', (req, res) => {
    res.send('<h1>Login Failed!</h1><p>Please try again.</p><a href="/auth/google">Login with Google</a>');
});

// Protected route
app.get('/profile', isAuthenticated, (req, res) => {
    res.send(`<h1>Welcome, ${req.user.displayName}!</h1><p>Email: ${req.user.emails[0].value}</p><a href="/logout">Logout</a>`);
});

// Logout route
app.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) { return next(err); }
        res.redirect('/');
    });
});

// Root route
app.get('/', (req, res) => {
    res.send('<h1>SaaS Backend with Google Auth</h1><p><a href="/auth/google">Login with Google</a></p>');
});

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
}

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
