import {networkDriver} from "./chips/networkDriver.mjs";
import {chip8} from "./chip8.mjs";

let net = new networkDriver();
let chip = new chip8();

let test = "hello"

chip.attach(0xF00, 0XF0A, net);

chip.load16Bit(new Uint16Array([
    // Lets check to see if the socket is open
    0xAF06, // Set I to F06, the boolean for socket status
    0xF065, // Get value of F06 to V0
    0x3001, // Skip if F06 is 1
    0x1200, // Go back to start if socket not open
    // Lets detect the first bit "GET "
    0x6101, // Set V1 to 0x01
    0xAF01, // Set I to F01, the boolean set after reading
    0xF155, // Setting boolean 0xF01,OxF02 to V0,V1,
    // When 0xF02 is set to 1 it tells the network driver to store the next char in 0xF01
    // Lets see is it G?
    0xF065, // Copy from 0xF01 to V0
    0x3047, // Skip next line if V0 == Ascii G, hex 47,
    0x1500, // If it is not G then jump to address 0x500
    // Ok lets see if the next is E
    0xF155, // Setting boolean to get next char
    0xF065, // Copy from 0xF01 to V0
    0x3045, // Is V0 == Ascii E, hex 45,
    0x1500, // If it is not E then jump to address 0x500
    // Ok lets see if the next is T
    0xF155, // Setting boolean to get next char
    0xF065, // Copy from 0xF01 to V0
    0x3054, // Is V0 == Ascii T, hex 54,
    0x1500, // If it is not T then jump to address 0x500
    // Ok lets see if the next is a space
    0xF155, // Setting boolean to get next char
    0xF065, // Copy from 0xF01 to V0
    0x3020, // Is V0 == Ascii Space, hex 20,
    0x1500, // If it is not Space then jump to address 0x500
    // Now that we know its a GET request lets see if it is to the only path /
    0xF155, // Setting boolean to get next char
    0xF065, // Copy from 0xF01 to V0
    0x302F, // Is V0 == Ascii Slash, hex 2F,
    0x1510, // If it is not Slash then jump to address 0x400
    0x6C60, // Set Vf to 0x60, start of 200 message
    // Now lets check for a Space
    0xF155, // Setting boolean to get next char
    0xF065, // Copy from 0xF01 to V0
    0x3020, // Is V0 == Ascii Space, hex 20,
    0x1510, // If it is not Space then jump to address 0x400
    0x6C60, // Set Vf to 0x60, start of 200 message
    0x1600  // Jump to copy from source
]), 0x200);

// Write 501 error to end of 0x100
chip.load16Bit(new Uint16Array([
    0x6C00, // Set I to 0x00, start of 501 message
    0x1600  // Jump to copy from source
]), 0x500);

// Write 404 error to end of 0x100
chip.load16Bit(new Uint16Array([
    0x6C20, // Set I to 0x14, start of 404 message
    0x1600  // Jump to copy from source
]), 0x510);

chip.load16Bit(new Uint16Array([
    0x6100, // Sets V1 to 0
    0xA000, // Go to 0x000
    0xFC1E, // Add the value of VC, to the register
    0xF11E, // Set I forward V1 spaces
    0xF065, // Copy from current I address to V0
    0x4000, // Skip next line if V0 is not equal to 0
    0x1300, // Jump to sending
    0xA109, // Set I to 0x109 IE start of new data
    0xF11E, // Add V1 to I
    0xF055, // Write
    0x7101,  // Add 1 to V1
    0x1602, // Go to the 2th instrution
]), 0x600);

// Store data for 501 error "501 not implemented", from 0x000 to 0x013
chip.load8Bit(new Uint8Array([53, 48, 49, 32, 110, 111, 116, 32, 105, 109, 112, 108, 101, 109, 101, 110, 116, 101, 100]), 0x000);

// Store data for 400 error "404 file not found"
chip.load8Bit(new Uint8Array([52, 48, 52, 32, 102, 105, 108, 101, 32, 110, 111, 116, 32, 102, 111, 117, 110, 100, 10, 13, 10, 13, 52, 48, 52, 32, 102, 105, 108, 101, 32, 110, 111, 116, 32, 102, 111, 117, 110, 100]), 0x020)

//"200 OK
//Hello from /"
chip.load8Bit(new Uint8Array([50, 48, 48, 32, 79, 75, 10, 13, 10, 13, 72, 101, 108, 108, 111, 32, 102, 114, 111, 109, 32, 47, 10, 13]), 0x060)

// Send data from response builder at 0x100-0x2FF to Network driver, but wait till \r\n
// If there is a blank treat as EOF
chip.load16Bit(new Uint16Array([
    // Write a null byte at the end of sending memory to prevent overflow from previous request
    0xA109, // Set I to 0x109 IE start of new data
    0xF11E, // Add V1 to I
    0xF055, // Write

    // Lets detect the \r\n, setup listen
    0x6101, // Set V1 to 0x01
    0xAF01, // Set I to F01, the boolean set after reading

    // Ok now lets test for \r
    0xF155, // Setting boolean to get next char
    0xF065, // Copy from 0xF01 to V0
    0x300D, // Is V0 == Ascii \r, hex 0D,
    0x1300, // If it is not char then jump to address 0x300

    // Ok now lets test for \n
    0xF155, // Setting boolean to get next char
    0xF065, // Copy from 0xF01 to V0
    0x300A, // Is V0 == Ascii \n, hex 0A,
    0x1300, // If it is not char then jump to address 0x300

    0x1350
]), 0x300);

chip.load16Bit(new Uint16Array([

    // Ok it matched lets send the message
    0xA100, // Set I to 0x100, start of http message
    0x6100, // Sets V1 to 1
    0x6200, // Set V2 to 0
    0xF065, // Copy from current I address to V0
    0x4000, // Skip next line if V0 is not equal to 0
    0x1400, // Jumps to final transmission
    0xAF03, // Set I 0xF03
    0xF155, // Set 0xF03 to current character and set boolean 0xF04
    0x7201, // Add 1 to V2
    0xA100, // Set I back to 0x100, start of http message
    0xF21E, // Set I forward V2 spaces
    0x1356, // Go to the 4th instrution, copy

]), 0x350);

// Send data from response builder at 0x100-0x2FF to Network driver
// If there is a blank treat as EOF
chip.load16Bit(new Uint16Array([
    0x6001, // Set V1 to 0x01
    0xAF06, // Set I to F06, the boolean set after reading
    0xF055, // Setting boolean 0xF06 to true
    0x1200, // Go back to start
]), 0x400);

// HTTP Response builder
chip.load8Bit(new Uint8Array([
    72, // "H"
    84, // "T"
    84, // "T"
    80, // "P"
    47, // "/"
    49, // "1"
    46, // "."
    49, // "1"
    32 // " "
]), 0x100);

chip.run(0);
chip.exportMemoryUsage();

