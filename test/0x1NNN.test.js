// noinspection JSUnresolvedFunction
const chip8 = require("../chip8.js");
const assert = require('assert');
describe('OPCode 0x1NNN', function () {
	it('pointer bytes (0xED0-0xED1) should be set to 0x02,0x10', function () {
		let chip = new chip8();
		chip.load16Bit(new Uint16Array([
			0x1210
		]), 0x200);
		chip.run();
		assert.equal(chip.dumpRange(0xED0, 0xED2).toString(), new Uint8Array([0x02, 0x10]).toString());
	});
});