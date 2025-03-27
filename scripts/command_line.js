import cv_generator from './cv_builder.js';
const commands = [
    {
        name: "cv", information: "Generates a fresh CV from the database", extra: value => {
            cv_generator();
        }
    }
]

function start_commandline() {
    console.log("Command Line, type help to get commands")
    /*command line*/
    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    process.stdin.on('data', function (text) {
        if (text.replace("\n", "").split(" ")[0] === "help") {
            console.log("Commands")
            commands.forEach(value => {
                console.log(value.information)
            });
        }
        commands.forEach(value => {
            if (text.replace("\n", "").split(" ")[0] === value.name) {
                value.extra(text.replace("\n", "").split(" "))
            }
        });
    });
}

export default start_commandline
