-000_
// Jump to 0x200 start of code
1200

-080_
// Store data for 501 error "501 not implemented" from 000 to 013
35 30 31 20 6e 6f 74 20 69 6d 70 6c 65 6d 65 6e 74 65 64



-020_
// Store data for 400 error "404 file not found"
34 30 34 20 66 69 6c 65 20 6e 6f 74 20 66 6f 75 6e 64 0a 0d 0a 0d 34 30 34 20 66 69 6c 65 20 6e 6f 74 20 66 6f 75 6e 64



-60_
//"200 OK
//Hello from /"
32 30 30 20 4f 4b 0a 0d 0a 0d 48 65 6c 6c 6f 20 66 72 6f 6d 20 2f 0a 0d



-100_
// HTTP/1.1
48 54 54 50 2f 31 2e 31 20



-200_
//  Lets check to see if the socket is open
AF06 //  Set I to F06 the boolean for socket status
F065 //  Get value of F06 to V0
3001 //  Skip if F06 is 1
1200 //  Go back to start if socket not open
//  Lets detect the first bit "GET "
6101 //  Set V1 to 01
AF01 //  Set I to F01 the boolean set after reading
F155 //  Setting boolean F01,OxF02 to V0,V1,
//  When F02 is set to 1 it tells the network driver to store the next char in F01
//  Lets see is it G?
F065 //  Copy from F01 to V0
3047 //  Skip next line if V0 == Ascii G hex 47,
1500 //  If it is not G then jump to address 500
//  Ok lets see if the next is E
F155 //  Setting boolean to get next char
F065 //  Copy from F01 to V0
3045 //  Is V0 == Ascii E hex 45,
1500 //  If it is not E then jump to address 500
//  Ok lets see if the next is T
F155 //  Setting boolean to get next char
F065 //  Copy from F01 to V0
3054 //  Is V0 == Ascii T hex 54,
1500 //  If it is not T then jump to address 500
//  Ok lets see if the next is a space
F155 //  Setting boolean to get next char
F065 //  Copy from F01 to V0
3020 //  Is V0 == Ascii Space hex 20,
1500 //  If it is not Space then jump to address 500
//  Now that we know its a GET request lets see if it is to the only path/
F155 //  Setting boolean to get next char
F065 //  Copy from F01 to V0
302F //  Is V0 == Ascii Slash hex 2F,
1510 //  If it is not Slash then jump to address 400
6C60 //  Set Vf to 60 start of 200 message
//  Now lets check for a Space
F155 //  Setting boolean to get next char
F065 //  Copy from F01 to V0
3020 //  Is V0 == Ascii Space hex 20,
1510 //  If it is not Space then jump to address 400
6C60 //  Set Vf to 60 start of 200 message
1600  //  Jump to copy from source



-300_
// Send data from response builder at 100-2FF to Network driver but wait till \r\n
// If there is a blank treat as EOF
// Write a null byte at the end of sending memory to prevent overflow from previous request
A109 // Set I to 109 IE start of new data
F11E // Add V1 to I
F055 // Write
// Lets detect the \r\n setup listen
6101 // Set V1 to 01
AF01 // Set I to F01 the boolean set after reading
// Ok now lets test for \r
F155 // Setting boolean to get next char
F065 // Copy from F01 to V0
300D // Is V0 == Ascii \r hex 0D,
1300 // If it is not char then jump to address 300
// Ok now lets test for \n
F155 // Setting boolean to get next char
F065 // Copy from F01 to V0
300A // Is V0 == Ascii \n hex 0A,
1300 // If it is not char then jump to address 300
1350



-350_
// Ok it matched lets send the message
A100 // Set I to 100 start of http message
6100 // Sets V1 to 1
6200 // Set V2 to 0
F065 // Copy from current I address to V0
4000 // Skip next line if V0 is not equal to 0
1400 // Jumps to final transmission
AF03 // Set I F03
F155 // Set F03 to current character and set boolean F04
7201 // Add 1 to V2
A100 // Set I back to 100 start of http message
F21E // Set I forward V2 spaces
1356 // Go to the 4th instrution copy



-400_
// Send data from response builder at 100-2FF to Network driver
// If there is a blank treat as EOF
6001 // Set V1 to 01
AF06 // Set I to F06 the boolean set after reading
F055 // Setting boolean F06 to true
1200 // Go back to start



-500_
// Write 501 error to end of 100
6C00 // Set I to 00 start of 501 message
1600  // Jump to copy from source



-510_
// Write 404 error to end of 100
6C20 // Set I to 14 start of 404 message
1600  // Jump to copy from source



-600_
6100 // Sets V1 to 0
A000 // Go to 000
FC1E // Add the value of VC to the register
F11E // Set I forward V1 spaces
F065 // Copy from current I address to V0
4000 // Skip next line if V0 is not equal to 0
1300 // Jump to sending
A109 // Set I to 109 IE start of new data
F11E // Add V1 to I
F055 // Write
7101  // Add 1 to V1
1602 // Go to the 2th instrution