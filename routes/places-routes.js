const express = require('express');

const router = express.Router();

const DUMMY_PLACES = [
  {
    id: 'p1',
    title: 'Warsaw',
    description: 'One of the highest buildings in Warsaw!',
    location: {
      lat: 52.231838,
      lng: 21.005995
    },
    address: 'plac Defilad 1, 00-901 Warszawa',
    creator: 'u1'
  }
];

router.get('/:pid', (req, res, next) => {
  const placeId = req.params.pid;
  const place = DUMMY_PLACES.find(p => {
    return p.id === placeId;
  });
  res.json({place});
});

module.exports = router;