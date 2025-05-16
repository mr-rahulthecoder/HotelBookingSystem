const Listing = require("../models/listing.js");
const mbxGeocoding= require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken:mapToken });

module.exports.index = async (req, res, next) => {
  try {
    const allListings = await Listing.find({});

    // Loop through each listing and update geometry if empty
    for (let listing of allListings) {
      if (!listing.geometry.coordinates || listing.geometry.coordinates.length === 0) {
        // Geocode location if coordinates are missing
        const response = await geocodingClient.forwardGeocode({
          query: listing.location,
          limit: 1
        }).send();

        if (response.body.features.length > 0) {
          // Update geometry for the existing listing
          listing.geometry = response.body.features[0].geometry;
          await listing.save();  // Save the updated listing with coordinates
          console.log(`Updated geometry for listing: ${listing.title}`);
        } else {
          console.log(`No valid geocode for listing: ${listing.title}`);
        }
      }
    }

    // Render listings to the view
    res.render("listings/index.ejs", { allListings });
  } catch (error) {
    next(error);
  }
};

module.exports.renderNewform = (req, res) => {
  res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res, next) => {
  try {
    let { id } = req.params;
    const listing = await Listing.findById(id)
      .populate({
        path: "reviews",
        populate: {
          path: "author",
        },
      })
      .populate("owner");

    if (!listing) {
      req.flash("error", "Listing you requested does not exist");
      res.redirect("/listings");
    }

    // If geometry is missing, geocode and update it
    if (!listing.geometry.coordinates || listing.geometry.coordinates.length === 0) {
      const response = await geocodingClient.forwardGeocode({
        query: listing.location,
        limit: 1
      }).send();

      if (response.body.features.length > 0) {
        // Update geometry for the existing listing
        listing.geometry = response.body.features[0].geometry;
        await listing.save();  // Save updated geometry
        console.log(`Updated geometry for listing: ${listing.title}`);
      } else {
        console.log(`No valid geocode for listing: ${listing.title}`);
      }
    }

    res.render("listings/show.ejs", { listing });
  } catch (error) {
    next(error);
  }
};


module.exports.createNewListing = async (req, res, next) => {
  const response = await geocodingClient.forwardGeocode({
    query: req.body.listing.location,
    limit: 1
  }).send();

  if (!req.body.listing) {
    throw new ExpressError(400, "Send valid data for listing");
  }

  if (!response.body.features || response.body.features.length === 0) {
    req.flash("error", "Invalid location. Please enter a valid address.");
    return res.redirect("/listings/new"); // or res.redirect("/listings/new")
  }

  const newListing = new Listing(req.body.listing);
  newListing.owner = req.user._id;
  newListing.image = { url: req.file.path, filename: req.file.filename };
  newListing.geometry = response.body.features[0].geometry;

  await newListing.save();
  req.flash("success", "Listing is created");
  res.redirect("/listings");
};

module.exports.editListing = async (req, res, next) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing you requested does not exist");
    res.redirect("/listings");
  }
  let originalImageUrl =listing.image.url;
  originalImageUrl = originalImageUrl.replace("/upload/h_250,w_300");

  res.render("listings/edit.ejs", { listing,originalImageUrl });
};
module.exports.updateListing = async (req, res, next) => {
  if (!req.body.listing) {
    throw new ExpressError(400, "Send valid data for listing");
  }
  let { id } = req.params;
  const listing = await Listing.findByIdAndUpdate(
    id,
    { ...req.body.listing },
    { new: true }
  );
  if(typeof req.file !=="undefined"){
  let url = req.file.path;
  let filename = req.file.filename;
  listing.image = {url,filename};
   await listing.save();
  }
  req.flash("success", "Listing is updated");
  res.redirect(`/listings/${id}`);
};
module.exports.deleteListing = async (req, res) => {
  let { id } = req.params;
  const deleted = await Listing.findByIdAndDelete(id);
  req.flash("success", "Listing is deleted");

  res.redirect("/listings");
};
