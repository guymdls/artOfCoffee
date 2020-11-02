const mongoose = require("mongoose"),
    Review = require('./reviews');

const ImageSchema = new mongoose.Schema(
    {
        url: String,
        filename: String
    }

);


var gallerySchema = new mongoose.Schema({
    coffeShopName: String,
    location: String,
    images: [ImageSchema],
    description: String,
    author:  // object id
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reviews: [ // array of object is
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Review'
        }

    ]
});

// trigger when using findByIdAndDelete
gallerySchema.post('findOneAndDelete', async function (doc) {
    if (doc) {
        await Review.remove({
            //The $in operator selects the documents where the //
            //value of a field equals any value in the specified array. To specify an $in expression, use the following prototype:
            _id: { $in: doc.reviews } // delete all reviews in which _id exist}

        })
    }

})

module.exports = mongoose.model("gallery", gallerySchema) // name of the collection, mongodb will re-name it to galleries