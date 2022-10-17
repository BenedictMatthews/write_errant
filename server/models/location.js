const { mongoose, Number } = require("mongoose");
const Schema = mongoose.Schema;

const locationSchema = new Schema({
    longitude: {
        type: Number,
        required: true
    },
    latitude: {
        type: Number,
        required: true
    }
}, { timestamps: true });

// Mongo will use 'locations' as collection name
const Location = mongoose.model('location', locationSchema);
module.exports = Location;