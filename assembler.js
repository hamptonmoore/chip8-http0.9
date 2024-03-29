import fs from "fs";

if (process.argv[2] == undefined || process.argv[3] == undefined){
    console.log("USAGE: node assembler.js code.cchip8 output.asm")
}


/*

Instructions
// RTS	00EE	0	Return from subroutine
// JUMP    1nnn	1	Jump to address nnn
// CALL	2nnn	1	Call routine at address nnn
// SKE	3snn	2	Skip next instruction if register s equals nn
// SKNE	4snn	2	Do not skip next instruction if register s equals nn
// SKRE	5st0	2	Skip if register s equals register t
// LOAD	6snn	2	Load register s with value nn
// ADD	7snn	2	Add value nn to register s
// MOVE	8st0	2	Move value from register s to register t
// OR	8st1	2	Perform logical OR on register s and t and store in t
// OAND	8st2	2	Perform logical AND on register s and t and store in t
// XOR	8st3	2	Perform logical XOR on register s and t and store in t
// ADDR	8st4	2	Add s to t and store in s - register F set on carry
// SUB	8st5	2	Subtract s from t and store in s - register F set on !borrow
// SHR	8st6	2	Shift bits in s 1 bit right, store in t - bit 0 shifts to register F
// SHL	8stE	2	Shift bits in s 1 bit left, store in t - bit 7 shifts to register F
// SKRNE	9st0	2	Skip next instruction if register s not equal register t
// LOADI	Annn	1	Load index with value nnn
// JUMPI	Bnnn	1	Jump to address nnn + index
RAND	Ctnn	2	Generate random number between 0 and nn and store in t
DRAW	Dstn	3	Draw n byte sprite at x location reg s, y location reg t
SKPR	Es9E	1	Skip next instruction if the key in reg s is pressed
SKUP	EsA1	1	Skip next instruction if the key in reg s is not pressed
MOVED	Ft07	1	Move delay timer value into register t
KEYD	Ft0A	1	Wait for keypress and store in register t
LOADD	Fs15	1	Load delay timer with value in register s
LOADS	Fs18	1	Load sound timer with value in register s
// ADDI	Fs1E	1	Add value in register s to index
LDSPR	Fs29	1	Load index with sprite from register s
// BCD	Fs33	1	Store the binary coded decimal value of register s at index
// STOR	Fs55	1	Store the values of register s registers at index
// READ	Fs65	1	Read back the stored values at index into registers
 */

function handleValues(val, labels, padding){
    if (val.startsWith("0x")){
        return val.slice(2);
    } else if (val.startsWith("$")){
        return labels[val.slice(1)].toString(16).padStart(3, "0");
    } else if (val.startsWith('"')){
        return eval(`'${val.slice(1, -1)}'`).split("")
            .map(c => c.charCodeAt(0).toString(16).padStart(2, "0"))
            .join("");
    }
    else {
        return Number(val).toString(16)
    }
}

function addOutput(output, cmd){
    return output + `${cmd}\n`;
}

fs.readFile(process.argv[2], 'utf8', function(err, data){
  let lines = data.split("\n");
  let labels = {

  };
  let position = 0x002;
  let output = "";
  for (let line of lines){
      if (line[0] == "/"){
          continue;
      }
      let parts = line.split(/\s+/);

      if (line.trim() == "" || line.startsWith("/")){
          continue;
      }
      if (parts[0].startsWith("$")){
          labels[parts[0].slice(1)] = position;
      } else {
          switch (parts[0]){
              case "RTS":
                  output = addOutput(output, `00EE`);
                  break;
              case "JUMP":
                  output = addOutput(output, `1${handleValues(parts[1], labels)}`);
                  break;
              case "CALL":
                  output = addOutput(output, `2${handleValues(parts[1], labels)}`);
                  break;
              case "LOAD":
                  output = addOutput(output, `6${handleValues(parts[1])}${handleValues(parts[2])}`)
                  break;
              case "LOADI":
                  output = addOutput(output, `A${handleValues(parts[1], labels)}`);
                  break;
              case "JUMPI":
                  output = addOutput(output, `B${handleValues(parts[1], labels)}`);
                  break;
              case "READ":
                  output = addOutput(output, `F${handleValues(parts[1], labels)}65`);
                  break;
              case "STOR":
                  output = addOutput(output, `F${handleValues(parts[1], labels)}55`);
                  break;
              case "ADDI":
                  output = addOutput(output, `F${handleValues(parts[1], labels)}1E`);
                  break;
              case "BCD":
                  output = addOutput(output, `F${handleValues(parts[1], labels)}33`);
                  break;
              case "SKE":
                  output = addOutput(output, `3${handleValues(parts[1], labels)}${handleValues(parts.slice(2).join(" "), labels)}`);
                  break;
              case "SKNE":
                  output = addOutput(output, `4${handleValues(parts[1], labels)}${handleValues(parts.slice(2).join(" "), labels)}`);
                  break;
              case "SKRE":
                  output = addOutput(output, `5${handleValues(parts[1], labels)}${handleValues(parts.slice(2).join(" "), labels)}0`);
                  break;
              case "MOVE":
                  output = addOutput(output, `8${handleValues(parts[1], labels)}${handleValues(parts.slice(2).join(" "), labels)}0`);
                  break;
              case "OR":
                  output = addOutput(output, `8${handleValues(parts[1], labels)}${handleValues(parts.slice(2).join(" "), labels)}1`);
                  break;
              case "AND":
                  output = addOutput(output, `8${handleValues(parts[1], labels)}${handleValues(parts.slice(2).join(" "), labels)}2`);
                  break;
              case "XOR":
                  output = addOutput(output, `8${handleValues(parts[1], labels)}${handleValues(parts.slice(2).join(" "), labels)}3`);
                  break;
              case "ADDR":
                  output = addOutput(output, `8${handleValues(parts[1], labels)}${handleValues(parts.slice(2).join(" "), labels)}4`);
                  break;
              case "SUB":
                  output = addOutput(output, `8${handleValues(parts[1], labels)}${handleValues(parts.slice(2).join(" "), labels)}5`);
                  break;
              case "SHR":
                  output = addOutput(output, `8${handleValues(parts[1], labels)}${handleValues(parts.slice(2).join(" "), labels)}6`);
                  break;
              case "SHL":
                  output = addOutput(output, `8${handleValues(parts[1], labels)}${handleValues(parts.slice(2).join(" "), labels)}E`);
                  break;
              case "SKRNE":
                  output = addOutput(output, `9${handleValues(parts[1], labels)}${handleValues(parts.slice(2).join(" "), labels)}0`);
                  break;
              case "ADD":
                  output = addOutput(output, `7${handleValues(parts[1], labels)}${handleValues(parts.slice(2).join(" "), labels)}`);
                  break;
              case "DEBUGMEM":
                  output = addOutput(output, `F066`);
                  break;
              case "EXIT":
                  output = addOutput(output, `0000`);
                  break;
              case "DATA":
                  let data = handleValues(line.slice(5)) + "00";
                  output = addOutput(output, data);
                  position += (data.length/2) -2;
                  break;
          }
          position += 2;
      }
  }

  output = `1${labels.START.toString(16).padStart(3, "0")}\n` + output;

  if (process.argv[4] == "-m"){
  	  output = output.split("\n").join("");
	  fs.writeFileSync(process.argv[3], output);
	  console.log(`Wrote ${output.length/2} bytes of assembly written to ${process.argv[3]}`)
  } else {
	  fs.writeFileSync(process.argv[3], output);
	  console.log(`Wrote ${output.split("\n").length} lines of assembly written to ${process.argv[3]}`)
  }

})
