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

// Get the most recently saved location from the database and expose it
app.get("/current-location", (req, res) => {
    Location.findOne().sort({$natural: -1}).limit(1)
            .then((result) => {
                res.send(result);
            })
            .catch((err) => {
                console.log(err)
            })
});

// All other GET requests not handled above will return our React app
app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
  });

// Run this on the hour between 7am and 4pm (London time)
nodeCron.schedule('0 0 7-16 * * *', function() {
        console.log('Fetching location');

        icloud.getDevices(function(error, devices) {

            var device;

            if (error) {
                throw error;
            }

            // Get the specific device we want
            if (devices) {
                device = devices.find(d => {
                    return d.id == process.env.DEVICE_ID
                });

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
                } 
            } else {
                console.log('No devices found')
            }

        });
    },
    { timezone: 'Europe/London'}
);