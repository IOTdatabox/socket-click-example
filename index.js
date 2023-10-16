const { admin, db } = require('./utils/firebase');
const fs = require('fs');
var express = require('express');
var app = express();
var server = require('http').createServer(app);
const net = require('net');

// Socket Server

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://lytldukbwiidlixsqhxl.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5dGxkdWtid2lpZGxpeHNxaHhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTY1MDc0MjgsImV4cCI6MjAxMjA4MzQyOH0.vKR9pI_R8WULVXossWP832fGpqsc4K0VFwhJ9RqY0Bk')

const writeValidDataToSupabase = async (data) => {
    try {
        await supabase.from('valid_data').insert(data);
        console.log(`successfully write in Supabase: ${data}`);
    } catch (e) {
        console.log(e);
    }
}

const writeLogFile = async (data) => {
    // Store the invalid data in Supabase
    try {
        const errorMessage = `${new Date().toISOString()} - Error: ${data}\n`;
        // Append the error message to a log file
        fs.appendFile('error.log', errorMessage, (err) => {
            if (err) {
                console.error('Failed to write error to log file:', err);
            }
        });
    } catch (e) {
        console.log(e);
    }
}

const socketServer = net.createServer((socket) => {
    console.log('Client connected');
    // Add 'error' event listener for the socket
    socket.on('error', (err) => {
        console.error('Socket error:', err.message);
    });
    socket.on('data', (data) => {
        try {
            let requestData = data.toString();
            console.log('Request received:', requestData);
            requestData = requestData.replace(/\s+$/, '');
            const dataParts = requestData.split(/[?\s]+/);
            isValid = true;
            console.log(dataParts.length);
            dataParts.map(item => {
                console.log(typeof item, " - ", item)
            })
            const julianDate = parseInt(dataParts[0]);
            const timestamp = dataParts[1];
            const magValue = parseInt(dataParts[2]);
            const isGoodValue = requestData.indexOf('?') == -1;

            const [tHour, tMinute, tSecond] = timestamp.match(/\d{2}/g);

            const unitIP = socket.remoteAddress.toString().match(/(?:[0-9]{1,3}\.){3}[0-9]{1,3}/)[0];

            const validDataFromG781 = {
                julianDate,
                tHour: parseInt(tHour),
                tMinute: parseInt(tMinute),
                tSecond: parseInt(tSecond),
                magValue: parseInt(magValue),
                Good: isGoodValue,
                unitIP,
            };
            writeValidDataToSupabase(validDataFromG781);
        }
        catch (error) {
            if (data) {
                console.error('Error Invalid Data:', error.message);
                writeLogFile('Error Invalid Data' + data.toString());
            } else {
                writeLogFile('Error Socket Response:' + error.message);
            }
        }
    });

    socket.on('end', () => {
        console.log('Client disconnected');
    });
});

// Add 'error' event listener for the socket server
socketServer.on('error', (err) => {
    console.error('Socket server error:', err.message);
});

const port = 808;
socketServer.listen(port, () => {
    console.log(`Socket Server is running on port ${port}`);
});

// Express Server
app.use(express.static(__dirname + '/public'));
//redirect / to our index.html file
app.get('/', function (req, res, next) {
    res.sendFile(__dirname + '/public/index.html');
});

//start our web server and socket.io server listening
server.listen(3000, function () {
    console.log('listening on *:3000');
}); 