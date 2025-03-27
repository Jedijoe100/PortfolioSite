import {readFile} from 'fs/promises'

let data;

try{
  data = JSON.parse(await readFile("data.json", "utf8"))
}
catch(err){
  if(err.code == "ENOENT"){
    data = JSON.parse(await readFile("default.json", "utf8"))
  }else{
    console.error(err);
  }
}

export default data;