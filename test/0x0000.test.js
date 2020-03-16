// noinspection JSUnresolvedFunction
const chip8 = require("../chip8.js");
const assert = require('assert');
describe('OPCode 0x0000', function () {
	it('byte 0xED7 should be set to 0x01', function () {
		let chip = new chip8();
		// chip.load16Bit(new Uint16Array([]), 0x200);
		chip.run();
		assert.equal(chip.memory[0x0ED7], 1);
	});
});