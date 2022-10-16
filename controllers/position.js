const fs = require('fs');

const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

const HttpError = require('../models/http-error');
const getCoordsForAddress = require('../util/location');
const Position = require('../models/position');
const User = require('../models/user');

const getAllPositions = async (req, res, next) => {
  let positions;
  try {
    positions = await Position.find({});
  } catch (err) {
    const error = new HttpError(
        'Fetching positions failed, please try again later.',
        500
    );
    return next(error);
  }

  if (!positions || positions.length === 0) {
    return next(
        new HttpError('Could not find any positions.', 404)
    );
  }

  res.json({
    positions: positions.map(position =>
        position.toObject({ getters: true })
    )
  });
};

const getPositionById = async (req, res, next) => {
  const positionId = req.params.id;

  let position;
  try {
    position = await Position.findById(positionId);
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not find a position.',
      500
    );
    return next(error);
  }

  if (!position) {
    const error = new HttpError(
      'Could not find position for the provided id.',
      404
    );
    return next(error);
  }

  res.json({ position: position.toObject({ getters: true }) });
};

const getPositionsByUserId = async (req, res, next) => {
  const userId = req.params.id;

  let userWithPositions;
  try {
    userWithPositions = await User.findById(userId).populate('positions');
  } catch (err) {
    const error = new HttpError(
      'Fetching positions failed, please try again later.',
      500
    );
    return next(error);
  }

  if (!userWithPositions || userWithPositions.positions.length === 0) {
    return next(
      new HttpError('Could not find positions for the provided user id.', 404)
    );
  }

  res.json({
    positions: userWithPositions.positions.map(position =>
      position.toObject({ getters: true })
    )
  });
};

const create = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError('Invalid inputs passed, please check your data.', 422)
    );
  }

  const { title, description, address } = req.body;

  let coordinates;
  try {
    coordinates = await getCoordsForAddress(address);
  } catch (error) {
    return next(error);
  }

  const createdPosition = new Position({
    title,
    description,
    address,
    location: coordinates,
    image: req.file.path,
    creator: req.userData.userId
  });

  let user;
  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError(
      'Creating position failed, please try again.',
      500
    );
    return next(error);
  }

  if (!user) {
    const error = new HttpError('Could not find user for provided id.', 404);
    return next(error);
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdPosition.save({ session: sess });
    user.positions.push(createdPosition);
    await user.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      'Creating position failed, please try again.',
      500
    );
    return next(error);
  }

  res.status(201).json({ position: createdPosition });
};

const update = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError('Invalid inputs passed, please check your data.', 422)
    );
  }

  const { title, description } = req.body;
  const positionId = req.params.id;

  let position;
  try {
    position = await Position.findById(positionId);
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not update position.',
      500
    );
    return next(error);
  }

  if (position.creator.toString() !== req.userData.userId) {
    const error = new HttpError('You are not allowed to edit this position.', 401);
    return next(error);
  }

  position.title = title;
  position.description = description;

  try {
    await position.save();
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not update position.',
      500
    );
    return next(error);
  }

  res.status(200).json({ position: position.toObject({ getters: true }) });
};

const del = async (req, res, next) => {
  const positionId = req.params.id;

  let position;
  try {
    position = await Position.findById(positionId).populate('creator');
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not delete position.',
      500
    );
    return next(error);
  }

  if (!position) {
    const error = new HttpError('Could not find position for this id.', 404);
    return next(error);
  }

  if (position.creator.id !== req.userData.userId) {
    const error = new HttpError(
      'You are not allowed to delete this position.',
      401
    );
    return next(error);
  }

  const imagePath = position.image;

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await position.remove({ session: sess });
    position.creator.positions.pull(position);
    await position.creator.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not delete position.',
      500
    );
    return next(error);
  }

  fs.unlink(imagePath, err => {
    throw err;
  });

  res.status(200).json({ message: 'Deleted position.' });
};

exports.getAllPositions = getAllPositions;
exports.getPositionById = getPositionById;
exports.getPositionsByUserId = getPositionsByUserId;
exports.create = create;
exports.update = update;
exports.del = del;
