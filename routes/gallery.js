const express = require("express"),
    router = express.Router(),
    methodOverride = require('method-override'),
    Gallery = require("../models/gallery"), // require galleries collection 
    Review = require("../models/reviews"),
    catchAsync = require('../utils/catchAsync'),
    multer = require('multer'),
    { storage } = require('../cloudinary'),
    upload = multer({ storage }),
    { cloudinary } = require("../cloudinary"),
    ExpressError = require('../utils/ExpressError');



const { isLoggedIn, isAuthor, validateGallery, validateReview, isReviewAuthor } = require('../middleware');
router.use(methodOverride('_method'))


// display all galleries
router.get("/", async (req, res) => {
    const allGalleries = await Gallery.find({});
    res.render("gallery/index", { gallery: allGalleries });

});

// display add new form
router.get("/new", isLoggedIn, (req, res) => {
    res.render("gallery/new")
});

// post request, get data from the form, save to database
router.post('/', isLoggedIn, upload.array('image'), validateGallery, catchAsync(async (req, res, next) => {
    // console.log(req)
    // console.log(req.body)  ==== {gallery: {text: my text, image: my image}}
    // console.log(req.body.gallery) ==== {text: my text, image: my image}
    const gallery = new Gallery(req.body.gallery); // from the form
    gallery.images = req.files.map(f => ({ url: f.path, filename: f.filename }))
    gallery.author = req.user._id; // from the req.user from mongoose
    await gallery.save();
    console.log(gallery)
    req.flash('success', 'Successfully shared new coffee shop to our wall');
    res.redirect(`gallery/${gallery._id}`);
}));


router.get("/:id", isLoggedIn, catchAsync(async (req, res, next) => {
    const gallery = await (await Gallery.findById(req.params.id).populate({
        path: 'reviews',
        populate: { path: 'author' }
    }).populate('author'))
    if (!gallery) {
        req.flash('error', 'Cannot find that coffee shop');
        return res.redirect('/gallery');
    }
    console.log(gallery)
    res.render('gallery/show', { gallery });
}));


router.get("/:id/edit", isAuthor, async (req, res) => {
    const gallery = await Gallery.findById(req.params.id)
    res.render('gallery/edit', { gallery });
});

router.put("/:id", isLoggedIn, isAuthor, upload.array('image'), validateGallery, async (req, res) => {
    const { id } = req.params;
    const gallery = await Gallery.findByIdAndUpdate(id, { ...req.body.gallery });
    const imgs = req.files.map(f => ({ url: f.path, filename: f.filename }));
    gallery.images.push(...imgs);
    await gallery.save();
    if (req.body.deleteImages) {
        for (let filename of req.body.deleteImages) {
            cloudinary.uploader.destroy(filename)
        }
        await gallery.updateOne({ $pull: { images: { filename: { $in: req.body.deleteImages } } } }) // remove from backend mongoose
    }
    req.flash('success', 'Successfully edited coffee shop');
    res.redirect(`/gallery/${gallery._id}`);
});

router.delete('/:id', isAuthor, catchAsync(async (req, res) => {
    const { id } = req.params;
    await Gallery.findByIdAndDelete(id);
    res.redirect('/gallery')

}));



router.post("/:id/reviews", isLoggedIn, validateReview, catchAsync(async (req, res) => {
    const gallery = await Gallery.findById(req.params.id);
    const review = new Review(req.body.review);
    review.author = req.user._id;
    gallery.reviews.push(review);
    await review.save();
    await gallery.save();
    req.flash('success', 'Created new review');
    res.redirect(`/gallery/${gallery._id}`);

}));

router.delete("/:id/reviews/:reviewId", isLoggedIn, isReviewAuthor, async (req, res) => {
    // remove id in ref and remove the review
    // const { id } = req.params;
    // await Gallery.findByIdAndDelete(id);
    // res.redirect('/gallery')
    // delete the objectID which inside the gallery, not delete the whole gallery
    const { id, reviewId } = req.params;
    await Gallery.findByIdAndUpdate(id, { $pull: { reviews: reviewId } }); // pull anything from reviews which has this id
    await Review.findByIdAndDelete(reviewId);
    req.flash('success', 'Successfully deleted review');
    res.redirect(`/gallery/${id}`);

});

router.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404));
});

router.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'something went wrong!'
    res.status(statusCode).render('error', { err })

});

module.exports = router;