const ExpressError = require('./utils/ExpressError');
const Gallery = require('./models/gallery');
const Review = require('./models/reviews');
const { gallerySchema, reviewSchema } = require('./schemas.js');
const Joi = require('joi');



module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        // store url the user requested
        req.session.returnTo = req.originalUrl
        req.flash('error', 'you must be signed in');
        return res.redirect('/login');
    }
    next();
}

// validate middleware using joi
module.exports.validateGallery = (req, res, next) => {
    const { error } = gallerySchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}

// middleware
module.exports.isAuthor = async (req, res, next) => {
    const { id } = req.params;
    const gallery = await Gallery.findById(id);
    console.log(req.user._id)
    if (!gallery.author.equals(req.user._id)) {
        req.flash('error', 'You do not have permission to do that!');
        return res.redirect(`/gallery/${id}`);
    }
    next();
}

module.exports.isReviewAuthor = async (req, res, next) => {
    const { id, reviewId } = req.params;
    const review = await Review.findById(reviewId);
    if (!review.author.equals(req.user._id)) {
        req.flash('error', 'You do not have permission to do that!');
        return res.redirect(`/campgrounds/${id}`);
    }
    next();
}

module.exports.validateReview = (req, res, next) => {
    const { error } = reviewSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}

