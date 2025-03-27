import express from 'express';
import data from '../scripts/get_data.js';
import fetchAll from '../scripts/sql.js';
var router = express.Router();
import { Octokit } from 'octokit';
import sqlite from 'sqlite3';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs/promises'
    
const __dirname = dirname(fileURLToPath(import.meta.url));
const db = new sqlite.Database(__dirname+"/../"+data.database);

const octokit = new Octokit({
    auth: data.secrets.github_token
})

function isNumeric(str) {
  if (typeof str != "string") return false // we only process strings!  
  return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
         !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
}
async function home_page(res){
    let projects = await fetchAll(db, "SELECT * FROM Projects WHERE display > 2");
    res.render('projects', {"data": data.public, "projects": projects});
}

router
    .get('/*', async function (req, res, next) {
        let id = req.path.split('/')[1]
        if(isNumeric(id)){
            let projects = await fetchAll(db, "SELECT * FROM Projects WHERE display >= 2 AND ID = "+id + ";");
            if(projects.length>0){
                let details = projects[0].detail.split('/')
                let content;
                let skills = await fetchAll(db, "SELECT Skills.skill, Skills.type FROM Skills INNER JOIN Evidence ON Evidence.skill_ID=Skills.ID WHERE Evidence.Evidence_Table = 'Projects' AND Evidence.Evidence_ID = ?;", projects[0].ID)
                switch(projects[0].detail_type){
                    case 'github':
                        try{
                            content = await octokit.request('GET '+projects[0].detail, {
                                mediaType: {
                                    format: "html",
                                },
                                owner: details[2],
                                repo: details[3],
                                headers: {
                                    'X-GitHub-Api-Version': '2022-11-28'
                                }
                            })
                        }catch(err){
                            console.error(err);
                            content = {data: ""}
                        }
                        break;
                    case 'text':
                        try {
                            const info = await fs.readFile('./data/' + projects[0].detail, { encoding: 'utf8' });
                            content = {data: info};
                        } catch (err) {
                            console.error(err);
                            content = {data: ""}
                        }
                        break;
                }
                res.render('project', {"data": data.public, "project": projects[0], "content": content, "skills": skills});
            }else{
                home_page(res)
            }
        }else{
            home_page(res)
        }
    })

export default router;
