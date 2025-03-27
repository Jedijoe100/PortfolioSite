import ejs from 'ejs';
import fs from 'node:fs'
import fetchAll from './sql.js';
import data from './get_data.js';
import sqlite from 'sqlite3';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { rename } from 'node:fs';
    
const __dirname = dirname(fileURLToPath(import.meta.url));
const db = new sqlite.Database(__dirname+"/../"+data.database);

const cv_generator = async () => {
    let experience = await fetchAll(db, "SELECT * FROM Experience WHERE display BETWEEN 2 AND 3");
    let education = await fetchAll(db, "SELECT * FROM Education WHERE display BETWEEN 2 AND 3");
    let projects = await fetchAll(db, "SELECT * FROM Projects WHERE display BETWEEN 2 AND 3");
    let skills = await fetchAll(db, "SELECT * FROM Skills WHERE display BETWEEN 2 AND 3");
    let other = await fetchAll(db, "SELECT * FROM ScolarshipsAwardsVolunteering WHERE display BETWEEN 2 AND 3");
    //process projects to connect to skills
    let project_container = []
    for(const project of projects){
        let content = project;
        let skills = await fetchAll(db, "SELECT Skills.skill, Skills.type FROM Skills INNER JOIN Evidence ON Evidence.skill_ID=Skills.ID WHERE Evidence.Evidence_Table = 'Projects' AND Evidence.Evidence_ID = ?;", projects[0].ID)
        let skill_string = "";
        skills.forEach(element => {
            skill_string += element.skill + ", "
        });
        if(skill_string != ""){
            content['skills'] = skill_string.slice(0, -2);
        }
        project_container.push(content)
    }
    let skill_container = {};
    for (const element of skills){
        if(element.type in skill_container){
            skill_container[element.type] += ", " + element.skill;
        }else{
            skill_container[element.type] = element.skill;
        }
    }
    let other_container = {};
    for (const element of other){
        if(element.type in other_container){
            other_container[element.type].push(element);
        }else{
            other_container[element.type] = [element];
        }
    }
    ejs.renderFile('./views/cv.ejs', {data: data.public, education: education, experience: experience, projects: project_container, skills: skill_container, other: other_container}, {data: data.public}, function(err, str){
        if (err){
            console.error(err);
        }else{
            fs.writeFile('./temp/cv.tex', str, err => {
                if (err) {
                    console.error(err);
                }else{
                    let pdflatex = spawn('pdflatex', ['-output-directory=./temp', '-interaction=nonstopmode', './temp/cv.tex']);
                    pdflatex.on('exit', function (code) {
                        console.log('Latex Compiling code ' + code);
                        rename('./temp/cv.pdf', './cv/'+ data.public.cv_name+'.pdf', err => {
                            if (err) {
                                console.error(err);
                            }
                        });
                    });
                }
            });
        }
    });
}

export default cv_generator