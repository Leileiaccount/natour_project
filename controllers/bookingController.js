const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const catchAsync = require('../utils/catchAsync');
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const factory = require('../controllers/factoryController');
const AppError = require('../utils/appError');

exports.getCheckoutSession = catchAsync(async function(req, res, next) {
  try {
    // 1) Get the currently booked tour
    if (req.params.tourId) {
      const tour = await Tour.findById(req.params.tourId);
      // 2) Create checkout session

      const transformedItems = [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: tour.price * 100,
            product_data: {
              name: `${tour.name} Tour`,
              description: tour.summary,
              images: [
                'https://images.unsplash.com/photo-1568454537842-d933259bb258?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=987&q=80'
              ]
            }
          }
        }
      ];

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: transformedItems,
        payment_method_types: ['card'],
        success_url: `${req.protocol}://${req.get('host')}/?tour=${
          req.params.tourId
        }&user=${req.user.id}&price=${tour.price}`,
        cancel_url: `${req.protocol}://${req.get('host')}/tours`,
        customer_email: req.user.email,
        client_reference_id: tour.name
      });

      res.status(200).json({
        status: 'success',
        session
      });
    }
  } catch (error) {
    console.log(error);
  }
});

exports.creatBookingCheckout = catchAsync(async (req, res, next) => {
  const { tour, user, price } = req.query;
  if (tour && user && price) {
    await Booking.create({ tour, user, price });
    res.redirect(`${req.originalUrl.split('?')[0]}`);
  } else next();
});

exports.getAllBookings = factory.getAll(Booking);
exports.getBooking = factory.getOne(Booking, { path: 'reviews' });
exports.createBooking = factory.creatOne(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
