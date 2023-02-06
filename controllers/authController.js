const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { promisify } = require('util');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/sendEmail.js');

const signToken = id => {
  return jwt.sign({ id }, process.env.JSON_WEB_TOKEN_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const createSendtoken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 ** 60 * 1000
    ),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true;
  }
  user.password = undefined;

  res.cookie('jwt', token, cookieOptions);
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: req.body.role
  });
  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newUser, url).sendWelcome();
  createSendtoken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Plz enter email or password', 400));
  }
  const user = await User.findOne({ email }).select('+password');
  //  if write the code below we can't proceed further if user is undefined
  //  const passwordExits = await user.correctPassword(password, user.password);

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(
      new AppError('There is no user found or password incorrect!', 401)
    );
  }
  createSendtoken(user, 200, res);
});

exports.restrictTo = function(...roles) {
  return function(req, res, next) {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('NO RIGHTS IN DELETING TOURS', 403));
    }
    next();
  };
};

// Check if the user is logged or not
exports.protect = catchAsync(async (req, res, next) => {
  //1) if token exists
  let token;
  // for test by postman
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
    // for test by browser
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new AppError('You are not logged in', 401));
  }
  // 2) if token is valid
  const decodedPayload = await promisify(jwt.verify)(
    token,
    process.env.JSON_WEB_TOKEN_SECRET
  );
  // 3) Check if the user still exists
  const currentUser = await User.findById(decodedPayload.id);

  if (!currentUser) {
    return next(new AppError('There is no user', 401));
  }

  //  4) Check if the user has changed the password
  if (currentUser.passwordChanged(decodedPayload.iat)) {
    const test = new AppError('PW has changed!', 401);
    return next(test);
  }
  // 5)  Grant access to the protected route (useful in the future)
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

//Only for rendered pages, no errors!
exports.isLoggedIn = async (req, res, next) => {
  try {
    if (req.cookies.jwt) {
      // 1) verify token
      const decodedPayload = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JSON_WEB_TOKEN_SECRET
      );
      // 2) Check if the user still exists
      const currentUser = await User.findById(decodedPayload.id);

      if (!currentUser) {
        return next();
      }
      // 3) Check if the user has changed the password after the token was issued
      if (currentUser.passwordChanged(decodedPayload.iat)) {
        return next();
      }
      // There is a logged in user
      res.locals.user = currentUser;
      return next();
    }
  } catch (err) {
    return next();
  }
  next();
};

// Send a new cookie from server
exports.logout = (req, res) => {
  const cookieOptions = {
    expires: new Date(Date.now() + 10 * 1000)
  };
  res.cookie('jwt', 'logout', cookieOptions);
  res.status(200).json({
    status: 'success'
  });
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) next(new AppError('There is no user with email address', 404));

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  try {
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetpassword/${resetToken}`;

    await new Email(user, resetURL).sendResetPassword();

    res.status(200).json({
      status: 'success',
      message: ' You have reset your password!'
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError('Error in sending emails', 500));
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //1)
  const hashToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  //2)
  const user = await User.findOne({
    passwordResetToken: hashToken,
    passwordResetExpires: { $gt: Date.now() }
  });
  console.log(user);
  if (!user)
    return next(new AppError('Token is invaild or has inspired!', 400));
  //3)
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  //4)
  createSendtoken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('password');

  if (
    !user ||
    !(await user.correctPassword(req.body.currentPassword, user.password))
  )
    return next(new AppError('No user or password not correct!', 401));

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;

  await user.save();
  // await User.findByIdAndUpdate(
  //   user._id,
  //   {
  //     password: req.body.password,
  //     passwordConfirm: req.body.passwordConfirm
  //   },
  //   {
  //     new: true,
  //     runValidators: true
  //   }
  // );

  createSendtoken(user, 200, res);
});
