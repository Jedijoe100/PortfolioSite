import express from 'express';
import data from '../scripts/get_data.js';
import fetchAll from '../scripts/sql.js';
var router = express.Router();
import sqlite from 'sqlite3';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
    
const __dirname = dirname(fileURLToPath(import.meta.url));
const db = new sqlite.Database(__dirname+"/../"+data.database);

router
    .get('/', async function (req, res, next) {
        let experience = await fetchAll(db, "SELECT * FROM Experience WHERE display >= 3");
        let education = await fetchAll(db, "SELECT * FROM Education WHERE display >= 3");
        let projects = await fetchAll(db, "SELECT * FROM Projects WHERE display >= 3");
        let skills = await fetchAll(db, "SELECT * FROM Skills WHERE display >= 3");
        let other = await fetchAll(db, "SELECT * FROM ScolarshipsAwardsVolunteering WHERE display >= 3");
        let other_container = {};
        let skill_container = {};
        for (const element of skills){
            let evidence = await fetchAll(db, 
                "SELECT Projects.ID, title, 'Projects' AS type FROM Projects INNER JOIN Evidence ON Evidence.Evidence_ID=Projects.ID WHERE Evidence.skill_ID = $id AND Evidence.Evidence_Table = 'Projects' AND Projects.display >= 3 "+
                "UNION SELECT Education.ID, topic AS title, 'Education' AS type FROM Education INNER JOIN Evidence ON Evidence.Evidence_ID=Education.ID WHERE Evidence.skill_ID = $id AND Evidence.Evidence_Table = 'Education' AND Education.display >= 3 "+
                "UNION SELECT Experience.ID, title, 'Experience' AS type FROM Experience INNER JOIN Evidence ON Evidence.Evidence_ID=Experience.ID WHERE Evidence.skill_ID = $id AND Evidence.Evidence_Table = 'Experience' AND Experience.display >= 3 " +
                "UNION SELECT ScolarshipsAwardsVolunteering.ID, title, 'Other' AS type FROM ScolarshipsAwardsVolunteering INNER JOIN Evidence ON Evidence.Evidence_ID=ScolarshipsAwardsVolunteering.ID WHERE Evidence.skill_ID = $id AND Evidence.Evidence_Table = 'ScolarshipsAwardsVolunteering' AND ScolarshipsAwardsVolunteering.display >= 3;",
                {$id:element.ID})
            let content = {ID: element.ID, skill: element.skill, evidence: evidence}
            if(element.type in skill_container){
                skill_container[element.type].push(content);
            }else{
                skill_container[element.type] = [content];
            }
        }
        other.sort((a, b) => {
            let a_value, b_value = 0;
            if(/-$/.exec(a.date)){
                a_value = 3000
            }else{
                a_value = parseInt(/\d{4}$/.exec(a.date))
            }
            if(/-$/.exec(b.date)){
                b_value = 3000
            }else{
                b_value = parseInt(/\d{4}$/.exec(b.date))
            }
            return b_value - a_value
        });
        other.forEach(element => {
            if(element.type in other_container){
                other_container[element.type].push(element);
            }else{
                other_container[element.type] = [element];
            }
        })
        res.render('index', {"data": data.public, "experience": experience, "education": education, "projects": projects, "skills": skill_container, "other": other_container});
    })

export default router;
