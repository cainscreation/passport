const passport =require("passport")
const GoogleStrategy = require('passport-google-oauth2').Strategy;

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(user, done) {
        done(null, user);
});

passport.use(new GoogleStrategy({
        clientID:"806179905909-bd2hq519j9q82a6tlaev42fltqhr8s4g.apps.googleusercontent.com",
        clientSecret:"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",
        callbackURL: "http://localhost:3001/google/callback",
        passReqToCallback   : true
    },
    function(request, accessToken, refreshToken, profile, done) {
            return done(null, profile);
    }
));
