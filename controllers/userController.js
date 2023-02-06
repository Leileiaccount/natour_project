const multer = require('multer');
const sharp = require('sharp');
const catchAsync = require('../utils/catchAsync');
const User = require('../models/userModel');
const factory = require('./factoryController');
const AppError = require('./../utils/appError');

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     cb(
//       null,
//       `user-${req.user.id}-${Date.now()}.${file.mimetype.split('/')[1]}`
//     );
//   }
// });
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Plz only upload a image file'), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

exports.uploadUserPhoto = upload.single('photo');
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);
  next();
});

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!'
  });
};

const filterObj = function(obj, ...fieldArray) {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (fieldArray.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.updateMe = catchAsync(async (req, res, next) => {
  //1)
  if (req.body.password || req.body.password)
    return new AppError('Password can not be included!', 404);
  //2)
  const updatePairs = filterObj(req.body, 'email', 'name');
  // add a photo to the updatePairs
  if (req.file) updatePairs.photo = req.file.filename;
  //3)
  const newUser = await User.findByIdAndUpdate(req.user.id, updatePairs, {
    new: true,
    validator: true
  });

  res.locals.user = newUser;

  res.status(200).json({
    status: 'success',
    data: { newUser }
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: 'scuess',
    data: null
  });
});
