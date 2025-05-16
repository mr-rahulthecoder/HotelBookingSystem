const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const Listing = require("../models/listing.js");
const { isLoggedIn, isOwner, validateListing } = require("../middleware.js");
const listingsController = require("../controllers/listings.js");
const multer  = require('multer');
const {storage} = require("../cloudConfib.js");
const upload = multer({storage });

router
.route("/")
.get(wrapAsync(listingsController.index))
.post(
  isLoggedIn,
  upload.single('listing[image]'),
  wrapAsync(listingsController.createNewListing)
);

// new route
router.get("/new", isLoggedIn, listingsController.renderNewform);

router.route("/:id")
.get( wrapAsync(listingsController.showListing))
.put(
  isLoggedIn,
  isOwner,
  upload.single('listing[image]'),
  wrapAsync(listingsController.updateListing)
)
.delete(
  isLoggedIn,
  isOwner,
  wrapAsync(listingsController.deleteListing)
);

// edit route
router.get(
  "/:id/edit",
  isLoggedIn,
  isOwner,
  wrapAsync(listingsController.editListing)
);
 
module.exports = router;
