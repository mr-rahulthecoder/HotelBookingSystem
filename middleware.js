
const ExpressError = require("./utils/ExpressError.js");
const {listingSchema, reviewSchema } = require("./schema.js");
const Listing = require("./models/listing");
const Review = require("./models/review.js");

module.exports.isLoggedIn= (req,res,next)=>{
    if(!req.isAuthenticated()){
        req.session.redirectUrl= req.originalUrl;
        req.flash("error","User must be logged in to creating the listings");
        return res.redirect("/login");
    }
    next();
}

module.exports.saveRedirectUrl = (req,res,next)=>{
    if(req.session.redirectUrl){
        res.locals.redirectUrl =req.session.redirectUrl;
        console.log("Redirecting to:", res.locals.redirectUrl);
     
    }
    next();

};
module.exports.isOwner =  async(req,res,next)=>{
    let { id } = req.params;
    let  listing = await Listing.findById(id);
    if(!listing.owner._id.equals(res.locals.currUser._id)){
        req.flash("error","you are not owner of this listings");
        return res.redirect(`/listings/${id}`);
    }
    next();
}
module.exports.validateListing = (req, res, next) => {
    let { error } = listingSchema.validate(req.body);
    if (error) {
      let errMsg = error.details.map((el) => el.message).join(",");
      throw new ExpressError(400, errMsg);
    } else {
      next();
    }
  };
  module.exports.validateReview = (req,res,next) =>{
    let {error}  = reviewSchema.validate(req.body);
    if(error){
        let errMsg =error.details.map((el)=>el.message).join(",");
        throw new ExpressError(400,errMsg);
    }else{
        next();
    }
    };

    module.exports.isAuthorReview =  async(req,res,next)=>{
        let { id, reviewId } = req.params;
        let  review = await Review.findById(reviewId);
        if(!review.author._id.equals(res.locals.currUser._id)){
            req.flash("error","you are not owner of this review");
            return res.redirect(`/listings/${id}`);
        }
        next();
    }