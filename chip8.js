class chip8 {
	memory;
	screen = null;

	constructor() {
		/*
		   0x000-0xE9F is open memory
		   0xEA0-0xEAF is for registers
		   0xEB0-0xECE is for the call stack locations, Big-Endian
		   0xECF stores current sub-routine level
		   0xED0-0xED1 stores the current pointer, Big-Endian
		   0xED2-0xED3 stores l, Big-Endian
		   0xED4 is the Delay Timer
		   0xED5 is the Sound Timer
		   0xED6 timer decrement interrupt
		   0xF00-0xFFF is used to store the display which is 64x32

		*/
		this.memory = new Uint8Array(0x1000).fill(0);
		// Execution starts in memory position 0x200
		this.memory[0xED0] = 0x02;
	}

	load8Bit(memory, starting) {
		for (let i = starting; i < memory.length + starting; i++) {
			this.memory[i] = memory[i - starting];
		}
	}

	load16Bit(memory, starting) {
		for (let i = starting; i < (memory.length * 2) + starting; i += 2) {
			this.memory[i] = memory[(i - starting) / 2] / 256;
			this.memory[i + 1] = memory[(i - starting) / 2] % 256;
		}
	}

	dump() {
		return this.memory;
	}

	// This count makes it so the mainloop is never hogged up, but it also isnt slowed down by constantly calling setTImeout0
	run = (count) => {
		if (this.step() !== -1) {
			if (count > 512) {
				setTimeout(() => {
					this.run(0);
				}, 0);
			} else {
				this.run(count + 1)
			}
		} else {
			console.log("Killing program")
		}
	};

	step() {
		// load current address
		let addr = (this.memory[0xED0] * 256) + this.memory[0xED1];
		// load current instruction
		let head = this.memory[addr];
		let tail = this.memory[addr + 1];
		// do render
		let redraw = false;
		// console.log("Executing 0x" + Number(head).toString(16) + Number(tail).toString(16) + " from 0x" + Number(addr).toString(16));
		if (this.memory[0xED6] === 1) {
			// Delay Timer
			if (this.memory[0xED4] > 0) {
				this.memory[0xED4]--;
			}
			// Sound Timer
			if (this.memory[0xED5] > 0) {
				this.memory[0xED5]--;
			}

			this.memory[0xED6] = 0;
		}

		switch (Math.floor(head / 16)) {
			case 0x0:
				switch (tail) {
					case 0xE0: // (00 E0) Clears the screen.
						for (let i = 0xF00; i < 0x1000; i++) {
							this.memory[i] = 0;
						}
						break;
					case 0xEE: // (00 EE) Returns from a subroutine.
						return -1;
				}
				break;
			case 0x1: // (1N NN) Jumps to address NNN.
				this.memory[0xED0] = head % 16;
				this.memory[0xED1] = tail;
				break;
			case 0x2: // (2N NN) Calls subroutine at NNN.
				// TODO program subroutine
				break;
			case 0x3: // (3X NN) Skips the next instruction if VX equals NN. (Usually the next instruction is a jump to skip a code block)
				if (this.memory[0xEA0 + (head % 16)] === tail) {
					this.incPtr(1);
				}
				break;
			case 0x4: // (4X NN) Skips the next instruction if VX doesn't equal NN. (Usually the next instruction is a jump to skip a code block)
				if (this.memory[0xEA0 + (head % 16)] !== tail) {
					this.incPtr(1);
				}
				break;
			case 0x5: // (5X Y0) Skips the next instruction if VX equals VY. (Usually the next instruction is a jump to skip a code block)
				if (this.memory[0xEA0 + (head % 16)] === [0xEA0 + Math.floor(tail / 16)]) {
					this.incPtr(1);
				}
				break;
			case 0x6: // (6X NN) Sets VX to NN.
				this.memory[0xEA0 + (head % 16)] = tail;
				break;
			case 0x7: // (6X NN) Sets VX to NN.
				this.memory[0xEA0 + (head % 16)] += tail;
				break;
			case 0x8:
				switch (tail % 16) {
					case 0x0: // (8X Y0) Sets VX to the value of VY.
						this.memory[0xEA0 + Math.floor(tail / 16)] = this.memory[0xEA0 + (head % 16)];
						break;
					case 0x1: // (8X Y1) Sets VX to VX or VY.
						this.memory[0xEA0 + (head % 16)] = this.memory[0xEA0 + (head % 16)] | this.memory[0xEA0 + Math.floor(tail / 16)];
						break;
					case 0x2: // (8X Y2) Sets VX to VX and VY.
						this.memory[0xEA0 + (head % 16)] = this.memory[0xEA0 + (head % 16)] & this.memory[0xEA0 + Math.floor(tail / 16)];
						break;
					case 0x3: // (8X Y3) Sets VX to VX xor VY.
						this.memory[0xEA0 + (head % 16)] = this.memory[0xEA0 + (head % 16)] ^ this.memory[0xEA0 + Math.floor(tail / 16)];
						break;
					case 0x4: {// (8X Y4) Adds VY to VX. VF is set to 1 when there's a carry, and to 0 when there isn't.
						let val = this.memory[0xEA0 + (head % 16)] + this.memory[0xEA0 + Math.floor(tail / 16)];
						this.memory[0xEA0 + (head % 16)] = val;
						// Set carry flag
						this.memory[0xEAF] = val > 255 ? 1 : 0;
						break;
					}
					case 0x5: // (8X Y4) VY is subtracted from VX. VF is set to 0 when there's a borrow, and 1 when there isn't.
						// Set carry flag
						if (this.memory[0xEA0 + (head % 16)] > this.memory[0xEA0 + Math.floor(tail / 16)]) {
							this.memory[0xEAF] = 0;
						} else {
							this.memory[0xEAF] = 1;
						}
						this.memory[0xEA0 + (head % 16)] -= this.memory[0xEA0 + Math.floor(tail / 16)];
						break;
					case 0x6: // (8X Y4) VY is subtracted from VX. VF is set to 0 when there's a borrow, and 1 when there isn't.

						// Set carry flag
						this.memory[0xEAF] = (this.memory[0xEA0 + (head % 16)] + 1) % 2;

						this.memory[0xEA0 + (head % 16)] >>>= 1;
						break;
					case 0x7: // (8X Y7) Sets VX to VY minus VX. VF is set to 0 when there's a borrow, and 1 when there isn't.
						// Set carry flag
						if (this.memory[0xEA0 + (head % 16)] > this.memory[0xEA0 + Math.floor(tail / 16)]) {
							this.memory[0xEAF] = 1;
						} else {
							this.memory[0xEAF] = 0;
						}
						this.memory[0xEA0 + (head % 16)] = this.memory[0xEA0 + Math.floor(tail / 16)] - this.memory[0xEA0 + (head % 16)];
						break;
					case 0xE: // (8X YE) Stores the most significant bit of VX in VF and then shifts VX to the left by 1.

						// Set carry flag
						this.memory[0xEAF] = (this.memory[0xEA0 + (head % 16)] + 1) % 2;

						this.memory[0xEA0 + (head % 16)] <<= 1;
						break;
				}
				break;
			case 0x9: // (9X Y0) Skips the next instruction if VX doesn't equal VY. (Usually the next instruction is a jump to skip a code block)
				if (this.memory[0xEA0 + (head % 16)] !== [0xEA0 + Math.floor(tail / 16)]) {
					this.incPtr(1);
				}
				break;
			case 0xA: // (AN NN) Sets I to the address NNN.
				this.memory[0xED2] = head % 16;
				this.memory[0xED3] = tail;
				break;
			case 0xB: // (BN NN) Jumps to address NNN plus V0.
				this.memory[0xED0] = head % 16;
				this.memory[0xED1] = tail;
				this.incPtr(this.memory[0xEA0]);
				break;
			case 0xC: // (CX NN)
				this.memory[0xEA0 + (head % 16)] = (Math.floor(Math.random() * 255) + 1) & tail;
				break;
			case 0xD: {
				let xpos = this.memory[0xEA0 + (head % 16)];
				let ypos = this.memory[0xEA0 + Math.floor(tail / 16)];
				let height = tail % 16;
				for (let i = 0; i < height; i++) {
					let pos = 0xF00 + Math.floor(xpos / 8) + ((ypos + i) * 8);
					let value = this.memory[(this.memory[0xED2] * 256) + this.memory[0xED3] + i] * 256;
					value >>>= xpos % 8;
					this.memory[pos] ^= Math.floor(value / 256);
					this.memory[pos + 1] ^= value % 256;

				}

				// TODO DXYN IMPLEMENT VF FLAG

				redraw = true;
				break;
			}
			case 0xE:
				// TODO Skips the next instruction if the key stored in VX is pressed. (Usually the next instruction is a jump to skip a code block)
				// TODO Skips the next instruction if the key stored in VX isn't pressed. (Usually the next instruction is a jump to skip a code block)
				break;
			case 0xF:
				switch (tail) {
					case 0x07:
						this.memory[0xEA0 + (head % 16)] = this.memory[0xED4];
						break;
					case 0x0A:
						// TODO A key press is awaited, and then stored in VX. (Blocking Operation. All instruction halted until next key event)
						break;
					case 0x15:
						this.memory[0xED4] = this.memory[0xEA0 + (head % 16)];
						break;
					case 0x18:
						this.memory[0xED5] = this.memory[0xEA0 + (head % 16)];
						break;
					case 0x1E: {
						let l = ((this.memory[0xED2] * 256) + this.memory[0xED3]);
						if (l + this.memory[0xEA0 + (head % 16)] > 0xFFF) {
							this.memory[0xEAF] = 1;
						} else {
							this.memory[0xEAF] = 0;
						}

						l += this.memory[0xEA0 + (head % 16)];
						l %= 0x1000;

						this.memory[0xED0] = l / 256;
						this.memory[0xED1] = l % 256;
						break;
					}

					case 0x29:
						// TODO Sets I to the location of the sprite for the character in VX. Characters 0-F (in hexadecimal) are represented by a 4x5 font.
						break;
					case 0x33:
						// TODO Stores the binary-coded decimal representation of VX
						break;
					case 0x55: {
						let l = ((this.memory[0xED2] * 256) + this.memory[0xED3]);
						let vTo = head % 16;
						for (let i = 0; i <= vTo; i++) {
							this.memory[l + i] = this.memory[0xEA0 + i];
						}

						break;
					}
					case 0x65: {
						let l = ((this.memory[0xED2] * 256) + this.memory[0xED3]);
						let vTo = head % 16;
						for (let i = 0; i <= vTo; i++) {
							this.memory[0xEA0 + i] = this.memory[l + i];
						}

						break;
					}
				}
				break;

		}

		if (redraw) {
			this.renderScreen();
		}

		this.incPtr(1);
		return 1;
	}

	renderScreen() {
		if (this.screen !== null) {
			this.screen(this.memory.slice(-0x100));
		}
	}

	incPtr(inc) {
		let addr = (this.memory[0xED0] * 256) + this.memory[0xED1] + (inc * 2);
		this.memory[0xED0] = addr / 256;
		this.memory[0xED1] = addr % 256;
	}

	attach(type, func) {
		if (type === "screen") {
			this.screen = func;
		}
	}

	interupt(type) {
		if (type === "timer") {
			this.memory[0xED6] = 1;
		}
	}


}