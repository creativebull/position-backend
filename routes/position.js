const express = require('express');
const { check } = require('express-validator');

const positionsControllers = require('../controllers/position');
const fileUpload = require('../middleware/file-upload');
const checkAuth = require('../middleware/check-auth');

const router = express.Router();

router.get('/', positionsControllers.getAllPositions);

router.get('/:id', positionsControllers.getPositionById);

router.get('/user/:id', positionsControllers.getPositionsByUserId);

router.use(checkAuth);

router.post(
  '/',
  fileUpload.single('image'),
  [
    check('title')
      .not()
      .isEmpty(),
    check('description').isLength({ min: 5 }),
    check('address')
      .not()
      .isEmpty()
  ],
  positionsControllers.create
);

router.put(
  '/:id',
  [
    check('title')
      .not()
      .isEmpty(),
    check('description').isLength({ min: 5 })
  ],
  positionsControllers.update
);

router.delete('/:id', positionsControllers.del);

module.exports = router;
