/*
 * Serialport Test - Transmitter and Receiver
 * In Transmitter Mode this program opens a serial port and writes
 * lots of data to a serial port
 * In Receiver Mode this program receives the data and displays it on the
 * console

 * (c) Copyright 2017 Roger Hardiman
 */

// External Dependencies
var SerialPort = require('serialport');
var args = require('commander');

// Command line arguments
args.description('Serialport Test Transmitter/Receiver');
args.option('-l, --list','List serial ports');
args.option('-p, --port <name>','Serial Port eg COM1 or /dev/ttyUSB0');
args.option('-b, --baud <value>','Baud Rate. Default 2400',parseInt);
args.option('--parity <value>','Parity none, even, odd. Default none');
args.option('-t, --transmitter','Transmitter');
args.option('-r, --receiver','Receiver');
args.parse(process.argv);

// Initial message
console.log('');
console.log('Serialport Test Transmitter');
console.log('(c) Roger Hardiman 2017 www.rjh.org.uk');
console.log('Use -h for help');
console.log('');

// List available serial ports
if (args.list || (!args.port)) {
  if (!args.list) {
    console.log('ERROR: No serial port name specified');
  }
  console.log('Available serial ports are:-');
  SerialPort.list(function(err,ports) {
    if (err) {
      console.log(err);
      return;
    }
    ports.forEach(function(port) {
      console.log(port.comName + '\t' + (port.pnpId || '') + '\t' + (port.manufacturer || ''));
    });
    console.log('');
  });
  return;
}

// Must be a transmitter or a receiver
if (!args.transmitter && !args.receiver) {
  console.log('ERROR: Must use -transmitter OR -receiver (-t OR -r)');
  console.log('');
  return;
}



// Defaults 9600 8-N-1
var serial_port = '';
var baud_rate = 9600;
var data_bits = 8;
var parity = 'none';
var stop_bits = 1;

// User Settings
if (args.port) serial_port = args.port;
if (args.baud) baud_rate = args.baud;
if (args.parity === 'none' || args.parity === 'odd' || args.parity === 'even') parity = args.parity;

// Open Serial Port.
var port = new SerialPort(serial_port, {
    baudrate: baud_rate,
    parity: parity,
    dataBits: data_bits,
    stopBits: stop_bits,
});


// Callback - Error 
port.on('error', function(err) {
    console.log(err);
    console.log('');
    process.exit(1);
});

// Callback - Open
var stream = port.on('open', function(err) {
    if (err) {
        console.log('Serial Port Error : ' + err);
    } else {
        console.log('Serial Port ' + serial_port + ' open ' + baud_rate + '-' + parity + '-' + stop_bits);

        if (args.transmitter) {
          console.log('Transmitting');
          setImmediate(send_message);
        } 
    }
});

var counter = 0;
function send_message() {
  counter++;
  writeAndDrain(counter + ' ' + 'the quick brown fox jumps over the lazy dog\r\n',function () {
    setTimeout(send_message,300); // call the send message again in 300ms
  });
}

function writeAndDrain (data, callback) {
  stream.write(data, function () {
    stream.drain(callback);
  });
}

// Callback - Data
port.on('data', function(buffer) {

    // write to console
    for (var i = 0; i < buffer.length; i++) {
      var next_byte = buffer[i];
      if (next_byte >= 32 && next_byte <=126) {
        process.stdout.write(String.fromCharCode(next_byte));
      } else if (next_byte == 10 ) {
        process.stdout.write('\n');
      } else {
        process.stdout.write('['+DecToHexPad(next_byte,2)+']');
      }
    }
});

// Callback - Disconnected (eg USB removal) 
port.on('disconnect', function(err) {
    console.log('Disconnected ' + err);
    process.exit(1);
});

function DecToHexPad(decimal,size) {
    var ret_string = decimal.toString('16').toUpperCase();
    while (ret_string.length < size) {
        ret_string = '0' + ret_string;
    }
    return ret_string;
}

