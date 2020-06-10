class chip8 {
	memory;
	attached = false;
	forceStopped = false;
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
		   0xED6 timer decrement interrupt, boolean
		   0xED7 halted, boolean
		   0xF00-0xFFF is used for attaching

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

	dumpRange(start, stop) {
		if (stop === undefined) {
			stop = this.memory.length;
		}

		return this.memory.slice(start, stop);
	}

	// This count makes it so the event loop is never hogged up, but it also is not slowed down by constantly calling setTImeout0
	run = (count) => {
		if (this.step() !== -1) {
			if (count > 16) {
				setTimeout(() => {
					this.run(0);
				}, 0);
			} else {
				this.run(count + 1)
			}
		}
	};

	step() {
		// load current address
		let addr = (this.getMemory(0xED0) * 256) + this.getMemory(0xED1);
		// load current instruction
		let head = this.getMemory(addr);
		let tail = this.getMemory(addr + 1);

		//console.log(head, tail, addr);
		// do render
		let redraw = false;
		console.log("Executing 0x" + Number(head).toString(16).padEnd(2, "0").toUpperCase() + Number(tail).toString(16).padEnd(2, "0").toUpperCase() + " from 0x" + Number(addr).toString(16));
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
							this.setMemory(i, 0);
						}
						break;
					case 0xEE: // (00 EE) Returns from a subroutine.
						// TODO subroutine exiting
						this.setMemory(0xED7, 1);
						return -1;
					case 0x00:
						this.setMemory(0xED7, 1);
						return -1;
				}
				break;
			case 0x1: {// (1N NN) Jumps to address NNN.
				let pos = (head * 256 + tail - 2); // Two is subtracted so that when the CPU steps after this one is on the correct instruction
				this.setMemory(0xED0, Math.floor(pos / 256) % 16);
				this.setMemory(0xED1, pos % 256);
				console.log("Jump")
				break;
			}
			case 0x2: // (2N NN) Calls subroutine at NNN.
				// TODO program subroutine
				break;
			case 0x3: // (3X NN) Skips the next instruction if VX equals NN. (Usually the next instruction is a jump to skip a code block)
				if (this.getMemory(0xEA0 + (head % 16)) === tail) {
					this.incPtr(1);
				}
				break;
			case 0x4: // (4X NN) Skips the next instruction if VX doesn't equal NN. (Usually the next instruction is a jump to skip a code block)
				if (this.getMemory(0xEA0 + (head % 16)) !== tail) {
					this.incPtr(1);
				}
				break;
			case 0x5: // (5X Y0) Skips the next instruction if VX equals VY. (Usually the next instruction is a jump to skip a code block)
				if (this.getMemory(0xEA0 + (head % 16)) === this.getMemory(0xEA0 + Math.floor(tail / 16)) ) {
					this.incPtr(1);
				}
				break;
			case 0x6: // (6X NN) Sets VX to NN.
				this.setMemory(0xEA0 + (head % 16), tail);
				break;
			case 0x7: // (7X NN) Adds NN to VX. (Carry flag is not changed).
				let loc = 0xEA0 + (head % 16);
				this.setMemory(loc, this.getMemory(loc) + tail)
				break;
			case 0x8:
				switch (tail % 16) {
					case 0x0: // (8X Y0) Sets VX to the value of VY.
						this.setMemory(0xEA0 + Math.floor(tail / 16), this.getMemory(0xEA0 + (head % 16)) );
						break;
					case 0x1: // (8X Y1) Sets VX to VX or VY.
						this.setMemory(0xEA0 + (head % 16), this.getMemory(0xEA0 + (head % 16)) | this.getMemory(0xEA0 + Math.floor(tail / 16)) );
						break;
					case 0x2: // (8X Y2) Sets VX to VX and VY.
						this.setMemory(0xEA0 + (head % 16), this.getMemory(0xEA0 + (head % 16)) & this.getMemory(0xEA0 + Math.floor(tail / 16)) );
						break;
					case 0x3: // (8X Y3) Sets VX to VX xor VY.
						this.setMemory(0xEA0 + (head % 16), this.getMemory(0xEA0 + (head % 16)) ^ this.getMemory(0xEA0 + Math.floor(tail / 16)) );
						break;
					case 0x4: {// (8X Y4) Adds VY to VX. VF is set to 1 when there's a carry, and to 0 when there isn't.
						let val = this.getMemory(0xEA0 + (head % 16)) + this.getMemory(0xEA0 + Math.floor(tail / 16));
						this.setMemory(0xEA0 + (head % 16), val);
						// Set carry flag
						this.setMemory(0xEAF, val > 255 ? 1 : 0);
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
				this.setMemory(0xED2, head % 16);
				this.setMemory(0xED3, tail);
				break;
			case 0xB: // (BN NN) Jumps to address NNN plus V0.
				this.setMemory(0xED0, head % 16);
				this.setMemory(0xED1, tail);
				this.incPtr(this.memory[0xEA0]);
				break;
			case 0xC: // (CX NN) Sets VX to the result of a bitwise and operation on a random number (Typically: 0 to 255) and NN.
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
						this.setMemory(pos, this.getMemory(pos) ^ Math.floor(value / 256));
						this.setMemory(pos + 1, this.getMemory(pos+1) ^ value % 256);
	
					}
	
					// TODO DXYN IMPLEMENT VF FLAG
	
					redraw = true;
					break;
				}
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

						this.memory[0xED2] = l / 256;
						this.memory[0xED3] = l % 256;

						break;
					}
					case 0x55: {
						let l = ((this.memory[0xED2] * 256) + this.memory[0xED3]);
						let vTo = head % 16;
						for (let i = 0; i <= vTo; i++) {
							this.setMemory(l + i, this.memory[0xEA0 + i]);
						}

						break;
					}
					case 0x65: {
						let l = ((this.memory[0xED2] * 256) + this.memory[0xED3]);
						let vTo = head % 16;
						for (let i = 0; i <= vTo; i++) {
							this.memory[0xEA0 + i] = this.getMemory(l + i);
						}

						break;
					}
				}
				break;

		}

		// if (this.attached) {
		// 	this.callAttached();
		// }

		this.incPtr(1);
		return 1;
	}

	callAttached() {
		this.attached(this.memory.slice(-0x100));
	}

	incPtr(inc) {
		let addr = (this.memory[0xED0] * 256) + this.memory[0xED1] + (inc * 2);
		this.memory[0xED0] = addr / 256;
		this.memory[0xED1] = addr % 256;
	}

	attach(func) {
		this.attached = func;
	}

	interupt(type) {
		if (type === "timer") {
			this.memory[0xED6] = 1;
		}
	}

	setMemory(addr, value){
		if (addr < 0xF00){
			return this.memory[addr] = value;
		} else if (addr >= 0xF00 && addr <= 0xFFF && this.attached){
			return this.attached.set(addr, value);
		}
	}

	getMemory(addr){
		if (addr < 0xF00){
			return this.memory[addr];
		} else if (addr >= 0xF00 && addr <= 0xFFF && this.attached){
			return this.attached.get(addr);
		}
	}
}

if (typeof module !== 'undefined') {
	module.exports = chip8;
}