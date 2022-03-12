const axios = require('axios').default;
require('dotenv').config()

const HttpError = require('../models/http-error');

async function getCoordsForAddress(address) {
  // console.log(address);

  const options = {
    method: 'GET',
    url: 'https://trueway-geocoding.p.rapidapi.com/Geocode',
    params: {address: address, language: 'en'},
    headers: {
      'x-rapidapi-host': 'trueway-geocoding.p.rapidapi.com',
      'x-rapidapi-key': process.env.GEOCODING_API_KEY
    }
  };

  const { data } = await axios.request(options);
  // console.log(data);

  if (!data) {
    const error = new HttpError(
      'Could not find location for the specified address.',
      422
    );
    throw error;
  }

  const coordinates = data.results[0].location;

  return coordinates;
}

module.exports = getCoordsForAddress;
