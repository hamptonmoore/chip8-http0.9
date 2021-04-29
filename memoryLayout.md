# Registers
## Global
VxD - View Counter

### Handling Request
VxC - Page to load
	- Vx00, 404
	- Vx01, index /
	- Vx02, stylesheet /s
	- Vx03, viewer /v

### Subroute: Sending
Vx3 - Read offset lower
Vx2 - Read offset upper
Vx4 - Finished sending Boolean
TLDR - Jump to $START then move forwards ($LOAD9) by (Vx2 * 0xff) + 0x3, next read the byte, check if it's null, if so 0x4 = 0x01

### Route: View
Vx2 - BCD first
Vx3 - BCD second
Vx4 - BCD third
TLDR - use BCD to load VxD into 0x2-0x4, then write to socket one by one

# Addresses

## Network Chip
0xF01 - Current ascii byte in
0xF02 - Boolean, byte has been read set by system
0xF03 - Current ascii byte out
0xF04 - Boolean, data has been placed set by system
0xF06 - Boolean network transmission is over
