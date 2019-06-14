process.stdin.resume();
process.stdin.setEncoding("ascii");
var input = "";
var input_array = [];

process.stdin.on("data", function (chunk) {
    input += chunk;
    input_array = input.match(/[^\r\n]+/g);
});
process.on("SIGINT", function () {
    main();
});

class Memory {
    constructor() {
        this.memory = [
            {
                name: 'root',
                path: '/root',
                children: []
            }
        ];
    }

    setNewItem(item, path) {
        this.searchNode(this.memory, Object.assign([], path), (node) => node.children.push(item))
    }

    checkPath(path) {
        let isPathCorrect = false;
        this.searchNode(this.memory, Object.assign([], path), () => isPathCorrect = true);
        return isPathCorrect;
    }

    getItemsFromPath(path) {
        let list = [];
        this.searchNode(this.memory, Object.assign([], path), (node) => list = node.children.map((item) => item.name));
        return list;
    }

    getItemsRecursively() {
        let list = [];
        this.loopMemory(this.memory, list);
        return list;
    }

    searchNode(arr, path, action) {
        for (let i=0; i<arr.length; i++) {
            const node = arr[i];

            if (node.name === path[0]) {
                path.shift();
                if (path.length === 0) {
                    action(node);
                    break;
                }
                return this.searchNode(node.children, path, action);
            }
        }
    }

    loopMemory(arr, list) {
        for (let i=0; i<arr.length; i++) {
            const node = arr[i];

            if(node.children) {
                let nodeInfo = {
                    path: node.path,
                    items: node.children.length > 0 ? node.children.map((item) => item.name) : [' ']
                };
                list.push(nodeInfo);
                this.loopMemory(node.children, list);
            }
        }
    }
}

class File {
    constructor(name, path) {
        this.name = name;
        this.path = `/${path.join('/')}/${name}`;
    }
}

class Folder {
    constructor(name, path) {
        this.name = name;
        this.path = `/${path.join('/')}/${name}`;
        this.children = [];
    }
}

class SystemScope {
    constructor() {
        this.currentPath = ['root'];
        this.currentDisk = new Memory();
        this.commands = {
            pwd: this.getCurrentPath.bind(this),
            mkdir: this.createDirectory.bind(this),
            touch: this.createFile.bind(this),
            cd: this.changeDirectory.bind(this),
            ls: this.getFileList.bind(this)
        }
    }

    // touch
	createFile(name) {
        const file = new File(name, this.currentPath);
        this.currentDisk.setNewItem(file, this.currentPath);
    }

    // mkdir
    createDirectory(name) {
        const folder = new Folder(name, this.currentPath);
        this.currentDisk.setNewItem(folder, this.currentPath);
    }

    // cd
    changeDirectory(path) {
        let isPathCorrect;
        let newCurrentPath;

        if(path === '..' && this.currentPath.length > 1 ) {
            this.currentPath.pop();
        } else if(path.startsWith('/')) {
            newCurrentPath = path.match(/[^\/]+/g);
            isPathCorrect = this.currentDisk.checkPath(newCurrentPath);
            if(isPathCorrect) {
                this.currentPath = [...newCurrentPath];
            }
        } else {
            newCurrentPath = this.currentPath.concat(path);
            isPathCorrect = this.currentDisk.checkPath(newCurrentPath);
            if(isPathCorrect) {
                this.currentPath = [...newCurrentPath];
            }
        }
    }

    // ls
	getFileList(recursive) {
        let list;

        if(recursive) {
            list = this.currentDisk.getItemsRecursively();
            list.forEach(file => {
                process.stdout.write(file.path+'\r\n');
                process.stdout.write(file.items.join('  ')+'\r\n');
            })
         } else {
            list = this.currentDisk.getItemsFromPath(this.currentPath);
            process.stdout.write(list.join('  '))
         }
    }

    // pwd
	getCurrentPath() {
        process.stdout.write(`/${this.currentPath.join('/')}`+'\r\n');
    }
}

function main() {
    const system = new SystemScope();

    for(let i=0; i<input_array.length; i++) {
        const { command, parameter } = getCommand(input_array[i]);

        if(system.commands.hasOwnProperty(command)) {
            system.commands[command](parameter);
        } else if(command === 'quit') {
            process.exit();
        } else {
            process.stdout.write("Invalid Command error");
            process.exit();
        }
    }
    process.exit();
}

function getCommand(line) {
    let stream = line.split(' ');
    let command;
    let parameter = '';

    if (stream.length === 1) {
        command = stream[0];
    } else if (stream.length > 1) {
        command = stream[0];
        parameter = stream[1];
    }

    return { command, parameter };
}
