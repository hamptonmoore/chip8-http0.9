// noinspection JSUnresolvedFunction
const chip8 = require("../chip8.js");
const assert = require('assert');
describe('OPCode 0x3XNN', function () {
	it('Skips setting V1 to 0xff because V0 is 0x11', function () {
		let chip = new chip8();
		chip.load16Bit(new Uint16Array([
			0x6011,
			0x6122,
			0x3011,
			0x61ff
		]), 0x200);
		chip.run();
		assert.equal(chip.memory[0xEA1], 0x22);
	});
	it('Does not skip V1 to 0xff because V0 is not 0x11', function () {
		let chip = new chip8();
		chip.load16Bit(new Uint16Array([
			0x6033,
			0x6122,
			0x3011,
			0x61ff
		]), 0x200);
		chip.run();
		assert.equal(chip.memory[0xEA1], 0xff);
	});
});