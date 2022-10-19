const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const nodeCron = require('node-cron');
const Location = require('./models/location');
var icloud = require('find-my-iphone').findmyphone;

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
  }

const app = express();
const PORT = process.env.PORT || 3001;

var retryLocate = false;

icloud.apple_id = process.env.ICLOUD_USER;
icloud.password = process.env.ICLOUD_PASSWORD;

// Have Node serve the files for our built React app
app.use(express.static(path.resolve(__dirname, '../client/build')));

// Connect to the database
mongoose.connect(process.env.DATABASE, { useNewUrlParser: true, useUnifiedTopology: true })
        .then((result) => app.listen(PORT, () => {
            console.log(`Connected to database. Server listening on ${PORT}`);
          }))
        .catch((err) => console.log(err));

// Get the most recently saved location from the database, pick a random point within 1km of it and expose that
app.get("/current-location", (req, res) => {
    const r = 0.01 * Math.sqrt(Math.random());
    const theta = Math.random() * 2 * Math.PI;

    Location.findOne().sort({$natural: -1}).limit(1)
            .then((result) => {
                res.json({
                    "latitude":result.latitude + r * Math.sin(theta),
                    "longitude":result.longitude + r * Math.cos(theta)
                });
            })
            .catch((err) => {
                console.log(err)
            });
});

// All other GET requests not handled above will return the React app
app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
  });

// Run this on the times specified by CRON_SCHEDULE
nodeCron.schedule(process.env.CRON_SCHEDULE, function() {
        
        getLocation();
        
        //Sometimes the location is missing from the first attempt. try again after 10 seconds.
        if(retryLocate) {
            setTimeout(getLocation(), 10);
            retryLocate = false;
        }
    },
    { timezone: process.env.timezone}
);

// Finds the device and saves the location to the database
function getLocation() {
    icloud.getDevices(function(error, devices) {

        var device;

        console.log('Fetching location');

        if (error) {
            throw error;
        }

        // Get the specific device we want
        if (devices) {
            device = devices.find(d => {
                return d.id == process.env.DEVICE_ID
            });

            console.log(devices);

            if (device.location) {
                console.log('Device and location found')
                // Create a Mongo model of the location of the device
                const location = new Location({
                    latitude: device.location.latitude,
                    longitude: device.location.longitude
                });

                // Save to the database
                location.save()
                        .then(console.log('Location saved'))
                        .catch((err) => console.log(err));
            } else {
                console.log('Device location not available')
                retryLocate = true;
            } 
        } else {
            console.log('No devices found')
        }

    });
}