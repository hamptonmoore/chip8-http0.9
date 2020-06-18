class networkDriver {
    memory;
    received;
    toSend;
    openSocket;
    resolve;
    constructor(){
        this.memory = new Uint8Array(0x1000).fill(0)
        this.toSend = "";
        this.received = "";
        this.openSocket = false;
        this.resolve = function(){}
    }

    set(addr, value) {
        if (addr == 0xF02) {
            // console.log(`NET: Chip8 Read Data Flag Set`)
            this.memory[0xF01] = this.toSend.charCodeAt(0);
            // console.log('Just sent: ' + this.toSend.charCodeAt(0));
            this.toSend = this.toSend.substring(1);
        } else if (addr == 0xF04) {
            // console.log(`NET: Chip8 Uploaded Data Flag Set`);
            this.received += String.fromCharCode(this.memory[0xF03]);
            this.memory[0xF04] = 0;
        } else if (addr == 0xF06) {
            // console.log("TRANSMISSION CLOSED");
            this.memory[0xF06] = 0;
            this.resolve(this.received);
        }
        else {
            // console.log(`NET: SET ${addr.toString(16)} ${value.toString(16)}`)
            this.memory[addr] = value;
        }

        return this.memory[addr];
    }

    get socketOpen(){
        return this.memory[0xF06] == 1;
    }

    async send(message){
        this.toSend = message;
        this.received = "";
        this.memory[0xF06] = 1;

        let response = await new Promise((resolve, reject)=>{
            this.resolve = resolve;
        })

        return response;
    }

    get(addr) {
        return this.memory[addr];
    }
}