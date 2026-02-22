import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User } from '../models/User.js';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: `${BACKEND_URL}/api/auth/google/callback`,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const name = profile.displayName || 'User';
        const avatarUrl = profile.photos?.[0]?.value;
        if (!email) return done(new Error('No email from Google'), undefined);
        let user = await User.findOne({ googleId: profile.id });
        if (user) {
          user.email = email;
          user.name = name;
          user.avatarUrl = avatarUrl;
          await user.save();
        } else {
          user = await User.create({
            googleId: profile.id,
            email,
            name,
            avatarUrl,
          });
        }
        return done(null, { _id: user._id.toString() });
      } catch (err) {
        return done(err as Error, undefined);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, (user as { _id: string })._id));
passport.deserializeUser((id: string, done) => done(null, { _id: id }));
