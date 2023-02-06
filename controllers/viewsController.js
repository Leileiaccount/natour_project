const AppError = require('../utils/appError');
const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const Booking = require('../models/bookingModel');

exports.getOverview = catchAsync(async (req, res, next) => {
  // 1) get data from database
  const tours = await Tour.find();
  // 2) Build template

  // 3) Rending that template using tour data from 1)
  res.status(200).render('overview', {
    tours
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  //1) Get the data for the requested tour (including reviews and guides)
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    select: 'review user rating'
  });
  // When no tour is found, use return to stop executing;
  if (!tour) return next(new AppError('No tour is found with that code', 404));
  // //2) Build template
  // //3) Render template using data from 1)

  res.status(200).render('tour', {
    tour,
    title: `${tour.name} Tour`
  });
});

exports.getLoginFrom = (req, res) => {
  res.status(200).render('login', { title: 'Log into your account' });
};

exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'This is your homepage!!'
  });
};

exports.submitData = catchAsync(async (req, res, next) => {
  const newUserInfo = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.namee,
      email: req.body.emaill
    },
    {
      new: true,
      validator: true
    }
  );

  res.status(200).render('account', {
    title: 'This is your updated HP',
    user: newUserInfo
  });
});

exports.getMyTours = catchAsync(async (req, res, next) => {
  // 1) Find all bookings
  const bookings = await Booking.find({ user: req.user.id });
  // 2) Find tours with the returned IDs
  const tourIDs = bookings.map(el => el.tour);
  const tours = await Tour.find({ _id: { $in: tourIDs } });

  res.status(200).render('overview', {
    title: 'My Tours',
    tours
  });
});
