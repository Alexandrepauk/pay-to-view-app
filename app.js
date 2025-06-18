require('dotenv').config();
const express = require('express');
const session = require('express-session');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const app = express();

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // 🔥 Ajout important
app.set('view engine', 'ejs');

app.use(session({
  secret: 'secret-key',
  resave: false,
  saveUninitialized: true
}));

app.get('/', async (req, res) => {
  if (req.query.unlocked && !req.session.unlocked) {
    const session = await stripe.checkout.sessions.retrieve(req.query.session_id);
    if (session.payment_status === 'paid') {
      req.session.unlocked = true;
    }
  }

  const unlocked = req.session.unlocked || false;
  res.render('index', { unlocked });
});

app.post('/create-checkout-session', async (req, res) => {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: [{
      price_data: {
        currency: 'eur',
        product_data: {
          name: 'Photo exclusive',
        },
        unit_amount: 500,
      },
      quantity: 1
    }],
    success_url: `${req.protocol}://${req.get('host')}/?unlocked=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${req.protocol}://${req.get('host')}/`
  });

  res.redirect(session.url);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
