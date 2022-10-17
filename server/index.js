const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const nodeCron = require('node-cron');
const Location = require('./models/location')
var icloud = require('find-my-iphone').findmyphone;

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
  }

var dburl = process.env.DATABASE;

const PORT = process.env.PORT || 3001;
const app = express();

icloud.apple_id = process.env.ICLOUD_USER;
icloud.password = process.env.ICLOUD_PASSWORD;

var device;

// Have Node serve the files for our built React app
app.use(express.static(path.resolve(__dirname, '../client/build')));

// Connect to the database
mongoose.connect(dburl, { useNewUrlParser: true, useUnifiedTopology: true })
        .then((result) => app.listen(PORT, () => {
            console.log('Connected to database ' + dburl + `. Server listening on ${PORT}`);
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
nodeCron.schedule('* * 7-16 * * *', () => {
        icloud.getDevices(function(error, devices) {

            if (error) {
                throw error;
            }

            console.log(devices);

            // Get the specific device we wantreact
            device = devices.find(d => {
                return d.id == process.env.DEVICE_ID
            });

            if (device.location) {
                // Create a Mongo model of the location of the device
                const location = new Location({
                    longitude: device.location.longitude,
                    latitude: device.location.latitude
                });

                // Save to the database
                location.save()
                        .then((result) => console.log('location saved'))
                        .catch((err) => console.log(err));
            } else {
                console.log('Device location not available')
            }

        });
    },
    { timezone: 'Europe/London'}
);