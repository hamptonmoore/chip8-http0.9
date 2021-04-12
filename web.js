import {networkDriver} from "./chips/networkDriver.mjs";
import {chip8} from "./chip8.mjs";
import fs from "fs";

let net = new networkDriver();
let chip = new chip8();

chip.attach(0xF00, 0XF0A, net);

fs.readFile('webserver.chip8', 'utf8', function(err, data){
    let lines = data.split("\n");
    let re = /^[0-9a-fA-F]$/;

    let memoryLocation = 0;
    for (let line of lines){
        let lastChar = ""
        for (let char of line){
            if (char == "/") {
                break;
            } else if (re.test(char)){
                if (lastChar != ""){
                    chip.memory[memoryLocation] = parseInt(lastChar + char, 16);
                    memoryLocation++;
                    lastChar = ""
                } else {
                    lastChar = char;
                }
            } else if (char == "-") {
                memoryLocation = parseInt(line.replace("-", "").replace("_", ""), 16);
                break;
            }
        }
    }

    chip.run(0);
    chip.exportMemoryUsage();
});