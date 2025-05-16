const express = require("express");
const router = express.Router({ mergeParams: true });
const wrapAsync = require("../utils/wrapAsync.js");
const Review = require("../models/review.js");
const Listing = require("../models/listing.js");
const {
  validateReview,
  isLoggedIn,
  isAuthorReview,
} = require("../middleware.js");
const controllerReview = require("../controllers/reviews.js");

//REVIEWS
//post route
router.post(
  "/",
  isLoggedIn,
  validateReview,
  wrapAsync(controllerReview.createReview)
);

//delete review route
router.delete(
  "/:reviewId",
  isLoggedIn,
  isAuthorReview,
  wrapAsync(controllerReview.deleteReview)
);

module.exports = router;
